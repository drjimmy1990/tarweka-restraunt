# Geo-Aware RMS AI

A comprehensive Restaurant Management System (RMS) designed to be AI-native. It features a modern React dashboard for restaurant managers and a dedicated Node.js/Express API integration layer for AI Agents and Bots (e.g., n8n, Chatbots) to programmatically interact with the system.

## 📁 Project Structure

This repository contains two main applications:

1.  **Likely Root (`/`) - Frontend Dashboard**:
    *   **Tech**: React, Vite, TypeScript, Tailwind CSS, Supabase (Client).
    *   **Purpose**: Operational dashboard for managers to view orders, update status, manage branches/zones, and view analytics.
    *   **Connection**: Direct connection to Supabase using the Anon Key.

2.  **`/backend-api` - Integration API**:
    *   **Tech**: Node.js, Express, TypeScript, Supabase (Admin).
    *   **Purpose**: Secure API endpoints for AI Agents to check delivery coverage, create orders, and manage order status.
    *   **Connection**: Connection to Supabase using the Service Role Key (Admin privileges).

---

## 🚀 Prerequisites

*   **Node.js** (v18 or higher)
*   **npm** (comes with Node.js)
*   **Supabase Project**: You need a valid Supabase project with the schema applied.
    *   See `supabase_schema.txt` for the required database structure.

---

## 🛠 Environmental Variables

You must configure the `.env` files for both the frontend and backend.

### 1. Frontend (`.env`)
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Backend API (`backend-api/.env`)
Create a `.env` file in the `backend-api` directory:

```env
PORT=4000
N8N_API_KEY=your_secure_random_api_key_for_agents
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

> **⚠️ WARNING**: Never expose your `SUPABASE_SERVICE_KEY` in the frontend or public repositories. It has full admin access to your database.

---

## 💻 Local Installation & Development

### 1. Setup Backend
```bash
cd backend-api
npm install
npm run dev
```
*   The backend will start at `http://localhost:4000`.

### 2. Running Full System Test
We have included a script to simulate a full order lifecycle (Create -> Track -> Modify -> Update Status) using live DB data.
```bash
npx ts-node src/scripts/full_test.ts
```

### 3. Setup Frontend
Open a new terminal in the root directory:
```bash
npm install
npm run dev
```
*   The frontend will start at `http://localhost:5173`.

---

## 🔌 API Documentation (Integration Layer)

These endpoints are designed for your **AI Agents** (n8n, LangChain, etc.). All requests must include the `x-api-key` header matching the `N8N_API_KEY` set in your `.env`.

**Base URL**: `http://localhost:4000/api` (Locally) or `https://your-api-domain.com/api` (Production)

### 1. Check Delivery Coverage
Determines if a lat/lng is within any active branch's delivery zone.

*   **Endpoint**: `POST /check-coverage`
*   **Headers**: `x-api-key: <your_key>`
*   **Body**:
    ```json
    {
      "lat": 24.7136,
      "lng": 46.6753
    }
    ```

**Example Curl**:
```bash
curl -X POST http://localhost:4000/api/check-coverage \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-secret-key" \
  -d '{"lat": 24.7136, "lng": 46.6753}'
```

### 2. Create Order
Creates a new order using existing Customer and Address IDs (typically obtained from previous steps or the `customer_addresses` table).

*   **Endpoint**: `POST /orders`
*   **Headers**: `x-api-key: <your_key>`
*   **Body**:
    ```json
    {
      "customer_id": 12,
      "address_id": 5,
      "kitchen_notes": "Extra crispy fries",
      "items": [
        { "name": "Burger", "qty": 2, "price": 25 },
        { "name": "Fries", "qty": 1, "price": 10 }
      ]
    }
    ```

**Example Curl**:
```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-secret-key" \
  -d '{
    "customer_id": 12,
    "address_id": 5,
    "items": [{"name": "Shawarma", "qty": 2, "price": 15}],
    "kitchen_notes": "Garlic sauce on side"
  }'
```

### 3. Get Order Details
Retrieve full details of a specific order. Useful for "Track my Order" bots.

*   **Endpoint**: `GET /orders/:id`
*   **Headers**: `x-api-key: <your_key>`

**Example Curl**:
```bash
curl -X GET http://localhost:4000/api/orders/123 \
  -H "x-api-key: my-secret-key"
```

### 4. Modify Order
Request changes to an existing order (items or notes).

*   **Endpoint**: `POST /orders/:id/modify`
*   **Headers**: `x-api-key: <your_key>`
*   **Body** (Only include fields to update):
    ```json
    {
      "items": [
        { "name": "Burger", "qty": 3, "price": 25 }
      ],
      "notes": "Changed mind, extra chilly"
    }
    ```

**Example Curl**:
```bash
curl -X POST http://localhost:4000/api/orders/123/modify \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-secret-key" \
  -d '{ "notes": "Please hurry" }'
```

### 5. Update Order Status
Update an order's status. Useful for Driver bots or Cancellation flows.

*   **Endpoint**: `PATCH /orders/:id`
*   **Headers**: `x-api-key: <your_key>`
*   **Body**:
    ```json
    {
      "status": "cancelled",
      "cancellation_reason": "Customer changed mind" 
    }
    ```
    *Valid Statuses*: `pending`, `accepted`, `in_kitchen`, `out_for_delivery`, `done`, `cancelled`.

**Example Curl**:
```bash
curl -X PATCH http://localhost:4000/api/orders/123 \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-secret-key" \
  -d '{"status": "cancelled", "cancellation_reason": "Testing bot"}'
```

*   **Alternative Endpoint**: `PATCH /orders/:id/status` (Identical behavior, distinct URL for routing logic).

---

## 🚢 Deployment Guide: Docker (Recommended)

This project allows you to deploy both the frontend and backend using Docker Compose.

1.  **Prepare .env files**: Ensure you have created `.env` in the root and `.env` in `backend-api/` with your production values.
2.  **Build and Run**:
    ```bash
    docker-compose up --build -d
    ```
3.  **Access**:
    *   **Frontend**: `http://your-server-ip:80`
    *   **Backend API**: `http://your-server-ip:4000`

---

## 🌐 Deployment Guide: aaPanel

If you are using aaPanel (or a similar VPS manager), follow these steps:

### Part 1: Backend Deployment (Node.js)

1.  **Upload Code**: Upload the `backend-api` folder to your server (e.g., `/www/wwwroot/my-api`).
2.  **Website -> Node Project**:
    *   Go to aaPanel "Website" > "Node Project".
    *   Add Node Project.
    *   **Project Path**: Select the `backend-api` folder.
    *   **Run Command**: `npm run start` (Make sure to run `npm run build` locally or on server first if using TS compilation, **OR** just use `npm run dev` / `ts-node` if you prefer, but `dist/index.js` is better for prod).
    *   **Port**: `4000`.
    *   **Domain**: Map your API domain (e.g., `api.example.com`).
3.  **Environment**: Ensure you set the environment variables in the project settings or a `.env` file in the directory.
4.  **Start**: Start the service. It will be accessible via your domain.

### Part 2: Frontend Deployment (Static)

1.  **Build locally**:
    ```bash
    npm run build
    ```
    This creates a `dist` folder in your project root.
2.  **Upload**: Upload the contents of the `dist` folder to your server (e.g., `/www/wwwroot/my-dashboard`).
3.  **Website -> PHP/Static**:
    *   Add a new "PHP Project" (or Static).
    *   **Document Root**: Point to the folder where you uploaded the `dist` contents.
    *   **Domain**: Map your dashboard domain (e.g., `dashboard.example.com`).
4.  **Nginx Configuration (Important for SPA)**:
    You must configure Nginx to handle React Router's client-side routing.
    *   Go to Site Settings > Config (or URL Rewrite).
    *   Add this rule:
        ```nginx
        location / {
          try_files $uri $uri/ /index.html;
        }
        ```
5.  **Save**: Your dashboard is now live.

### Part 3: Connecting Them
*   Ensure your **Frontend** `.env` (built into the code) points `VITE_SUPABASE_URL` to your real Supabase instance.
*   The Frontend **does not** call the Backend API directly for dashboard tasks; it talks to Supabase.
*   Your **bots/agents** should use the `api.example.com` domain to talk to the Backend.
