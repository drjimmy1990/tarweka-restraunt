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
        const { data: address } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('id', address_id)
            .single();

        if (!address) return res.status(404).json({ error: 'Address not found' });

        // 3. Find Coverage (Re-Run Ray Casting)
        const { data: branches } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true);

        let selectedBranch: Branch | null = null;
        let deliveryFee = 0;

        if (branches) {
            for (const b of branches) {
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
            .select('*, branches(name)')
            .eq('id', id)
            .single();

        if (error || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

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

// --- FIX: UPDATED MODIFY LOGIC ---
// Instead of modifying directly, we create a Request for Manager Approval
export const requestModification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { items, notes } = req.body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid items provided' });
        }

        // Check Order Status first
        const { data: order } = await supabase
            .from('orders')
            .select('status')
            .eq('id', id)
            .single();

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Logic Rule: Cannot modify if Out for Delivery or Done
        if (['out_for_delivery', 'done', 'cancelled'].includes(order.status)) {
            return res.status(400).json({
                error: 'Too late',
                message: 'Order cannot be modified at this stage.'
            });
        }

        // Update the Order with Modification Request Flag
        const { error } = await supabase
            .from('orders')
            .update({
                modification_pending: true,
                modification_request: {
                    items: items,
                    notes: notes,
                    requested_at: new Date().toISOString()
                }
            })
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Modification request sent to kitchen manager.'
        });

    } catch (err: any) {
        console.error("Modify Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, cancellation_reason, reason } = req.body;

        const validStatuses: OrderStatus[] = ['pending', 'accepted', 'in_kitchen', 'out_for_delivery', 'done', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const updateData: any = {};
        if (status) updateData.status = status;

        const now = new Date().toISOString();

        if (status === 'accepted') updateData.accepted_at = now;
        if (status === 'in_kitchen') updateData.in_kitchen_at = now;
        if (status === 'out_for_delivery') updateData.out_for_delivery_at = now;
        if (status === 'done') updateData.done_at = now;

        if (status === 'cancelled') {
            updateData.cancelled_at = now;
            const finalReason = cancellation_reason || reason;
            if (finalReason) updateData.cancellation_reason = finalReason;
        }

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