// ==========================================
// ENUMS (Must match Database Enums)
// ==========================================
export type OrderStatus = 'pending' | 'accepted' | 'in_kitchen' | 'out_for_delivery' | 'done' | 'cancelled';
export type UserRole = 'super_admin' | 'branch_manager';

// ==========================================
// GEOSPATIAL TYPES
// ==========================================
export interface Point {
    lat: number;
    lng: number;
}

export interface Zone {
    name: string;
    delivery_fee: number;
    // A polygon is an array of Points: [[lat,lng], [lat,lng], ...]
    polygon: Point[];
}

// ==========================================
// DATABASE TABLES
// ==========================================

export interface Branch {
    id: number;
    name: string;
    phone_contact?: string;
    zones: Zone[]; // Automatically parsed from JSONB
    is_active: boolean;
    created_at: string;
}

export interface OrderItem {
    name: string;
    qty: number;
    price: number;
    options?: string[];
}

export interface Order {
    id: number;
    daily_seq: number;
    branch_id: number;

    // Customer Snapshot
    customer_name: string;
    customer_phone: string;
    customer_lat?: number;
    customer_lng?: number;
    address_text?: string;

    items: OrderItem[];
    kitchen_notes?: string;

    // Financials
    subtotal: number;
    delivery_fee: number;
    total_price: number;

    status: OrderStatus;

    // Timestamps
    created_at: string;
    accepted_at?: string;
    in_kitchen_at?: string;
    out_for_delivery_at?: string;
    done_at?: string;
    cancelled_at?: string;
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

export interface CoverageRequest {
    lat: number;
    lng: number;
}

export interface CoverageResponse {
    covered: boolean;
    branch_id?: number;
    branch_name?: string;
    zone_name?: string;
    delivery_fee?: number;
}
