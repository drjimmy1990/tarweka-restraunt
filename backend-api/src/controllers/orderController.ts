import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isPointInPolygon } from '../utils/geoUtils';
import { Branch, Zone, OrderStatus } from '../types';

export const createOrder = async (req: Request, res: Response) => {
    try {
        const {
            customer_id,
            address_id,
            items,
            kitchen_notes
        } = req.body;

        // 1. Validate IDs exist
        if (!customer_id || !address_id || !items || !items.length) {
            return res.status(400).json({ error: 'Missing customer_id, address_id, or items' });
        }

        // 2. Fetch Branch & Delivery Fee based on the Address ID
        // We need to check coverage again using the saved address coordinates to get the fee
        const { data: address } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('id', address_id)
            .single();

        if (!address) return res.status(404).json({ error: 'Address not found' });

        // 3. Find Coverage (Re-Run Ray Casting on saved Lat/Lng)
        const { data: branches } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true);

        let selectedBranch: Branch | null = null;
        let deliveryFee = 0;

        if (branches) {
            for (const b of branches) {
                // Cast to Branch type safely
                const branch = b as unknown as Branch;
                if (!branch.zones) continue;
                for (const zone of branch.zones) {
                    if (isPointInPolygon({ lat: address.latitude, lng: address.longitude }, zone.polygon)) {
                        selectedBranch = branch;
                        deliveryFee = zone.delivery_fee;
                        break;
                    }
                }
                if (selectedBranch) break;
            }
        }

        if (!selectedBranch) {
            return res.status(400).json({ error: 'Address location is no longer in delivery zone' });
        }

        // 4. Calculate Subtotal
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);

        // 5. Insert Order
        // Note: We use type assertion for 'any' to bypass partial type mismatch if existing DB types are strict without full fields
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                branch_id: selectedBranch.id,
                customer_id: customer_id,
                address_id: address_id,
                items: items,
                kitchen_notes: kitchen_notes,
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                status: 'pending'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        res.status(201).json({
            success: true,
            order_id: order.id,
            daily_seq: order.daily_seq,
            branch_name: selectedBranch.name,
            total_price: subtotal + deliveryFee,
            message: 'Order created successfully'
        });

    } catch (err: any) {
        console.error('Create Order Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const getOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: order, error } = await supabase
            .from('orders')
            .select('*, branches(name)') // Join branch name
            .eq('id', id)
            .single();

        if (error || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Translate status for Arabic context if needed (optional helper)
        const statusMap: Record<string, string> = {
            'pending': '⏳ معلق',
            'accepted': '✅ مقبول',
            'in_kitchen': '👨‍🍳 بيجهز في المطبخ',
            'out_for_delivery': '🛵 خرج للتوصيل',
            'done': '🎉 تم التوصيل',
            'cancelled': '❌ ملغي'
        };

        const statusArabic = statusMap[order.status] || order.status;

        res.json({
            success: true,
            status_arabic: statusArabic,
            order
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const modifyOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { items, notes } = req.body;

        if (!items && !notes) {
            return res.status(400).json({ error: 'No changes provided' });
        }

        const updateData: any = {};
        if (items) updateData.items = items;
        if (notes) updateData.kitchen_notes = notes;

        // Recalculate subtotal if items change
        if (items) {
            const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
            updateData.subtotal = subtotal;
        }

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Order modification requested',
            order: data
        });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, cancellation_reason, reason } = req.body;

        // Validate Status
        const validStatuses: OrderStatus[] = ['pending', 'accepted', 'in_kitchen', 'out_for_delivery', 'done', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        // Prepare Update Data (Handle Timestamps)
        const updateData: any = {};
        if (status) updateData.status = status;

        const now = new Date().toISOString();

        if (status === 'accepted') updateData.accepted_at = now;
        if (status === 'in_kitchen') updateData.in_kitchen_at = now;
        if (status === 'out_for_delivery') updateData.out_for_delivery_at = now;
        if (status === 'done') updateData.done_at = now;

        // Handle Cancellation
        if (status === 'cancelled') {
            updateData.cancelled_at = now;
            // Support both parameter names
            const finalReason = cancellation_reason || reason;
            if (finalReason) updateData.cancellation_reason = finalReason;
        }

        // Execute Update
        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            success: true,
            message: `Order #${id} updated to ${status}`,
            data
        });

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};