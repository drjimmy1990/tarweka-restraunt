
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const API_KEY = process.env.N8N_API_KEY!;
const API_URL = 'http://localhost:4000/api';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const main = async () => {
    try {
        console.log('🔵 Starting Full System Test...');

        // 1. Get a valid Branch & Zone
        const { data: branches, error: bError } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true);

        if (bError || !branches || branches.length === 0) {
            throw new Error('No active branches found. Cannot test coverage.');
        }

        // Find a valid point (First point of the first zone of the first branch)
        let validLat = 0;
        let validLng = 0;
        let found = false;

        // Simple helper to find a point in a polygon (using approximate centroid or just a vertex)
        // Polygon format in DB is typically [{lat, lng}, ...]
        for (const b of branches) {
            if (b.zones && b.zones.length > 0) {
                const zone = b.zones[0];
                if (zone.polygon && zone.polygon.length > 0) {
                    // Just pick the first vertex? 
                    // To be safe, let's pick a geometric average (centroid) to likely be inside
                    const lats = zone.polygon.map((p: any) => p.lat);
                    const lngs = zone.polygon.map((p: any) => p.lng);
                    validLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
                    validLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;
                    found = true;
                    console.log(`📍 Found valid test location in Branch: ${b.name}, Zone: ${zone.name}`);
                    console.log(`   Coords: ${validLat}, ${validLng}`);
                    break;
                }
            }
        }

        if (!found) throw new Error('No valid zones found in branches.');

        // 2. Create Test Customer & Address
        console.log('\n👤 Creating Test Customer & Address...');
        const uniquePhone = `+9665${Math.floor(10000000 + Math.random() * 90000000)}`;

        const { data: customer, error: cError } = await supabase
            .from('customers')
            .upsert({ phone_number: uniquePhone, full_name: 'Test Setup User' }, { onConflict: 'phone_number' })
            .select()
            .single();

        if (cError) throw cError;

        const { data: address, error: aError } = await supabase
            .from('customer_addresses')
            .insert({
                customer_id: customer.id,
                address_text: '123 Test St, Riyadh',
                latitude: validLat,
                longitude: validLng,
                is_default: true
            })
            .select()
            .single();

        if (aError) throw aError;
        console.log(`✅ Created Customer ID: ${customer.id}, Address ID: ${address.id}`);

        // 3. Test API: Create Order
        console.log('\n🛒 1. Testing POST /orders (Create Order)...');
        const createPayload = {
            customer_id: customer.id,
            address_id: address.id,
            items: [
                { name: 'Test Burger', qty: 2, price: 50 },
                { name: 'Fries', qty: 1, price: 15 }
            ],
            kitchen_notes: 'No pickles'
        };

        const res1 = await axios.post(`${API_URL}/orders`, createPayload, {
            headers: { 'x-api-key': API_KEY }
        });

        console.log(`✅ Status: ${res1.status}`);
        console.log(`   Order ID: ${res1.data.order_id}`);
        console.log(`   Message: ${res1.data.message}`);
        const orderId = res1.data.order_id;

        // 4. Test API: Get Order
        console.log(`\n🔍 2. Testing GET /orders/${orderId}...`);
        const res2 = await axios.get(`${API_URL}/orders/${orderId}`, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log(`✅ Status: ${res2.status}`);
        console.log(`   Current Status: ${res2.data.status_arabic} (${res2.data.order.status})`);

        // 5. Test API: Modify Order
        console.log(`\n✏️ 3. Testing POST /orders/${orderId}/modify...`);
        const modifyPayload = {
            items: [{ name: 'Test Burger', qty: 3, price: 50 }], // increased qty
            notes: 'Extra pickles actually'
        };
        const res3 = await axios.post(`${API_URL}/orders/${orderId}/modify`, modifyPayload, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log(`✅ Status: ${res3.status}`);
        console.log(`   New Subtotal: ${res3.data.order.subtotal}`);
        console.log(`   New Notes: ${res3.data.order.kitchen_notes}`);

        // 6. Test API: Update Status
        console.log(`\n🔄 4. Testing PATCH /orders/${orderId}/status...`);
        const statusPayload = {
            status: 'in_kitchen'
        };
        const res4 = await axios.patch(`${API_URL}/orders/${orderId}/status`, statusPayload, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log(`✅ Status: ${res4.status}`);
        console.log(`   New Status: ${res4.data.data.status}`);

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');

    } catch (err: any) {
        console.error('❌ Test Failed:', err.response?.data || err.message);
    }
};

main();
