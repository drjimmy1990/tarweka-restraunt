// ==========================================
// ENUMS & TYPES
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
    polygon: Point[];
}

// ==========================================
// DATABASE TABLES
// ==========================================

export interface Branch {
    id: number;
    name: string;
    phone_contact?: string;
    zones: Zone[];
    is_active: boolean;
    created_at: string;
}

export interface OrderItem {
    name: string;
    qty: number;
    price: number;
    size?: string;
    options?: string[];
}

export interface ModificationRequest {
    items: OrderItem[];
    notes?: string;
    requested_at: string;
}

export interface Order {
    id: number;
    daily_seq: number;
    branch_id: number;
    customer_id: number;
    address_id: number;

    // Content
    items: OrderItem[];
    kitchen_notes?: string;

    // Financials
    subtotal: number;
    delivery_fee: number;
    total_price: number;

    status: OrderStatus;

    // Exception Handling
    cancellation_reason?: string;
    customer_alert_message?: string;
    modification_pending?: boolean;
    modification_request?: ModificationRequest | null;

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
    message?: string;
}