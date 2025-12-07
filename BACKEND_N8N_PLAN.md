
# Geo-Aware RMS: Backend, Automation & Production Master Plan

This document serves as the technical blueprint for Phase 2 (Backend Implementation) and Phase 3 (Production Deployment).

---

## Part 1: Node.js Backend Architecture (The Brain)

**Stack:** Node.js (v20+), Express.js, TypeScript, Supabase Client (`@supabase/supabase-js`).

### 1.1 Core Logic: The Ray Casting Algorithm (Geofencing)
This is the most critical logic to determine which branch serves a customer and the specific delivery fee.

**The Algorithm (TypeScript):**
```typescript
interface Point { lat: number; lng: number }
interface Zone { name: string; fee: number; polygon: Point[] }

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;

        const intersect = ((yi > point.lng) !== (yj > point.lng))
            && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Service Function
export const findCoverage = (userLocation: Point, branches: Branch[]) => {
    for (const branch of branches) {
        if (!branch.is_active) continue;
        
        // Check all zones in this branch
        for (const zone of branch.zones) {
            if (isPointInPolygon(userLocation, zone.polygon)) {
                return {
                    covered: true,
                    branch_id: branch.id,
                    branch_name: branch.name,
                    zone_name: zone.name,
                    delivery_fee: zone.delivery_fee
                };
            }
        }
    }
    return { covered: false };
};
```

### 1.2 Schema Strategy: Daily IDs
To avoid long, confusing IDs (e.g., `#1841029`) in the kitchen, we use a **Daily Sequence**:
- We added a `daily_seq` column to the `orders` table.
- A Postgres Trigger `BEFORE INSERT` checks the `MAX(daily_seq)` for the current `DATE` and increments it by 1.
- **Result:** Every day, the first order is **#1**, then **#2**, etc.

### 1.3 API Endpoints Specification

#### A. Public Endpoints (Secured by API Key for n8n)
*   **`POST /api/geo/check-coverage`**
    *   **Input:** `{ "lat": 30.044, "lng": 31.235 }`
    *   **Logic:** Fetches active branches from Supabase -> Runs Ray Casting -> Returns result.
    *   **Output:** `{ "covered": true, "fee": 15.0, "branch_id": 1 }`

*   **`POST /api/orders/create`**
    *   **Input:** Customer Phone, Name, Items (Array), Lat/Lng.
    *   **Logic:** 
        1. Check `customers` table (Upsert if new).
        2. Validate coverage again (Security check).
        3. Insert into `orders` table (Trigger automatically sets ID #1, #2...).
    *   **Output:** `{ "order_id": 1, "daily_seq": 1, "status": "pending" }`

#### B. Private Endpoints (Secured by JWT/Supabase Auth for Frontend)
*   **`GET /api/manager/orders`**
    *   **Headers:** `Authorization: Bearer <Supabase_JWT>`
    *   **Logic:** Returns orders *only* for the branch assigned to the logged-in manager.
*   **`PATCH /api/manager/orders/:id/status`**
    *   **Input:** `{ "status": "in_kitchen" }`
    *   **Logic:** Updates status and sets specific timestamp (e.g., `in_kitchen_at = NOW()`).

---

## Part 2: n8n Automation Workflows (The Connector)

We need two primary workflows.

### Workflow A: "The Order Taker" (WhatsApp -> System)
**Trigger:** Webhook (WhatsApp Business API / Twilio / 360Dialog) receiving a message.

1.  **Node: Parse Message**
    *   Extract text or location attachment.
    *   *If text:* Use Google Maps API node to geocode address to Lat/Lng.
    *   *If location pin:* Extract Lat/Lng directly.

2.  **Node: HTTP Request (Call Backend)**
    *   Method: `POST`
    *   URL: `https://api.your-domain.com/api/geo/check-coverage`
    *   Body: `{ "lat": ..., "lng": ... }`

3.  **Node: Switch (Logic)**
    *   *If Covered:* Calculate Total = Cart Total + Delivery Fee.
    *   *If Not Covered:* Send WhatsApp reply: "Sorry, we do not deliver to this area yet."

4.  **Node: HTTP Request (Create Order)**
    *   *Condition:* If user replies "Confirm".
    *   URL: `https://api.your-domain.com/api/orders/create`

5.  **Node: WhatsApp Reply**
    *   "Order placed successfully! Order #1. Tracking link: https://..."

### Workflow B: "The Status Notifier" (System -> WhatsApp)
**Trigger:** Supabase Realtime (Webhook on `UPDATE` orders table).

1.  **Node: Filter Changes**
    *   Only proceed if `old.status` != `new.status`.

2.  **Node: Postgres Lookup (or HTTP Request)**
    *   Fetch Customer Phone and Name using `customer_id`.

3.  **Node: Switch (Status Message)**
    *   *Accepted:* "👨‍🍳 Your order is being prepared!"
    *   *Out for Delivery:* "🛵 Captain [Agent Name] is on the way!"
    *   *Unusual Condition (Alert):* If `customer_alert_message` is not null -> Send the specific alert text.

4.  **Node: WhatsApp Sender**
    *   Send the formatted template message to the customer.

---

## Part 3: Production Development Plan

### Phase 1: Infrastructure Setup (Week 1)
1.  **Database:** 
    *   Create Project on Supabase.
    *   Run the full SQL Schema (`supabase_schema.txt`).
    *   Enable Row Level Security (RLS).
2.  **Repo:** 
    *   Set up Monorepo (Frontend folder / Backend folder).

### Phase 2: Backend Development (Week 2)
1.  Initialize Express app.
2.  Implement `findCoverage` logic.
3.  Connect to Supabase using `SERVICE_ROLE_KEY` (for admin tasks) and `ANON_KEY`.
4.  Test endpoints using Postman.

### Phase 3: Frontend Integration (Week 3)
1.  Replace `services/mockData.ts` and `services/api.ts` with real Axios/Fetch calls to your Node.js backend.
2.  Implement `supabase.channel()` in React for true real-time updates (remove polling `setInterval`).
3.  Test RTL layout and translations on actual mobile devices.

### Phase 4: n8n & Deployment (Week 4)
1.  **Hosting:**
    *   *Frontend:* Deploy to **Vercel** (Excellent for React).
    *   *Backend:* Deploy to **Railway** or **Render** (Node.js hosting).
    *   *n8n:* Self-host on a **DigitalOcean Droplet** (Docker) or use **n8n Cloud**.
2.  **Environment Variables:**
    ```env
    # Database
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_KEY=your-service-role-key
    
    # Security
    JWT_SECRET=your-jwt-secret
    
    # External APIs
    GOOGLE_MAPS_API_KEY=your-google-maps-key
    WHATSAPP_TOKEN=your-whatsapp-token
    
    # Integration
    N8N_WEBHOOK_BASE_URL=https://n8n.your-domain.com/webhook
    ```

### Phase 5: Testing & Handover
1.  **Load Testing:** Simulate 50 simultaneous orders via Postman.
2.  **Geofence Testing:** Test locations strictly inside and outside drawn polygons.
3.  **Failover:** Test what happens if n8n goes down (Frontend manual entry should still work).

---

## Recommended 3rd Party Tools

1.  **Mapping:** Google Maps API (Geocoding) or Mapbox (Cheaper alternative).
2.  **WhatsApp Provider:**
    *   *Twilio:* Easiest to start, slightly more expensive per msg.
    *   *Meta Cloud API:* Cheapest (direct), requires Facebook verification.
3.  **Icons/UI:** Lucide React (Already implemented).
