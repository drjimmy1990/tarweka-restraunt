import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isPointInPolygon } from '../utils/geoUtils';
import { Branch, Zone } from '../types';
import { OrderStatus } from '../types'; // Ensure OrderStatus is imported

export const createOrder = async (req: Request, res: Response) => {
    try {
        const {
            customer_phone,
            customer_name,
            lat,
            lng,
            address_text,
            items,
            kitchen_notes
        } = req.body;

        // 1. Validate Input
        if (!customer_phone || !items || !items.length || !lat || !lng) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 2. Find Coverage (Re-Verify Logic)
        // We do this again server-side for security.
        const { data: branches } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true);

        let selectedBranch: Branch | null = null;
        let deliveryFee = 0;

        if (branches) {
            for (const b of branches) {
                const branch = b as Branch;
                if (!branch.zones) continue;

                for (const zone of branch.zones) {
                    if (isPointInPolygon({ lat, lng }, zone.polygon)) {
                        selectedBranch = branch;
                        deliveryFee = zone.delivery_fee;
                        break;
                    }
                }
                if (selectedBranch) break;
            }
        }

        if (!selectedBranch) {
            return res.status(400).json({
                error: 'Out of Delivery Area',
                message: 'This location is not covered by any active branch.'
            });
        }

        // 3. Handle Customer (Upsert)
        // We check if phone exists. If yes, update name. If no, create.
        const { data: customer, error: custError } = await supabase
            .from('customers')
            .upsert(
                { phone_number: customer_phone, full_name: customer_name },
                { onConflict: 'phone_number' }
            )
            .select()
            .single();

        if (custError || !customer) {
            throw new Error(`Customer Error: ${custError?.message}`);
        }

        // 4. Create Address Entry
        const { data: address, error: addrError } = await supabase
            .from('customer_addresses')
            .insert({
                customer_id: customer.id,
                address_text: address_text || 'Pinned Location',
                latitude: lat,
                longitude: lng,
                is_default: true
            })
            .select()
            .single();

        if (addrError) {
            throw new Error(`Address Error: ${addrError.message}`);
        }

        // 5. Calculate Financials
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);

        // 6. Insert Order
        // Note: 'total_price' is generated automatically by DB, we don't send it.
        // Note: 'daily_seq' is generated automatically by DB Trigger.
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                branch_id: selectedBranch.id,
                customer_id: customer.id,
                address_id: address.id,
                items: items,
                kitchen_notes: kitchen_notes,
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                status: 'pending',
                // Redundant but useful fields for history (Excluded as they are not in the provided schema)
                // customer_name: customer_name,
                // customer_phone: customer_phone,
                // delivery_address: address_text,
                // delivery_lat: lat,
                // delivery_lng: lng
            })
            .select()
            .single();

        if (orderError) {
            throw new Error(`Order Creation Error: ${orderError.message}`);
        }

        // 7. Success Response
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
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

// ... existing createOrder code ...

// ------------------------------------------
// NEW: Get Order Details (For Bot Status Check)
// ------------------------------------------
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

        res.json({
            success: true,
            order
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ------------------------------------------
// NEW: Update Status (For Bot Actions)
// ------------------------------------------
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, cancellation_reason } = req.body;

        // Validate Status
        const validStatuses: OrderStatus[] = ['pending', 'accepted', 'in_kitchen', 'out_for_delivery', 'done', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        // Prepare Update Data (Handle Timestamps)
        const updateData: any = { status };
        const now = new Date().toISOString();

        if (status === 'accepted') updateData.accepted_at = now;
        if (status === 'in_kitchen') updateData.in_kitchen_at = now;
        if (status === 'out_for_delivery') updateData.out_for_delivery_at = now;
        if (status === 'done') updateData.done_at = now;

        // Handle Cancellation
        if (status === 'cancelled') {
            updateData.cancelled_at = now;
            if (cancellation_reason) updateData.cancellation_reason = cancellation_reason;
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