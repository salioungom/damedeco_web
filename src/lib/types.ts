export interface Category {
    id: string;
    name: string;
    icon: string;
    image: string;
    product_count?: number;
}

import { Product as ApiProduct } from '@/types/product';

export type Product = ApiProduct;

export interface Order {
    id: number;
    order_id?: number | string;
    order_number: string;
    /**
     * Machine d'état Order (backend) : pending → processing → shipped → delivered,
     * avec branche d'annulation depuis pending/processing/shipped → cancelled.
     * `confirmed` est LEGACY uniquement (anciennes commandes, à ne plus générer).
     * `refunded` est conservé pour compatibilité (aucun workflow de remboursement créé).
     */
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    /**
     * État agrégé du paiement (géré par le backend).
     * `pending` = commande nouvellement créée / intent non transmis à PayTech.
     * Une commande `status = pending` + `payment_status = paid` est UNE COMMANDE PAYÉE.
     */
    payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
    total_amount: string;
    shipping_amount?: number | string;
    currency: string;
    shipping_address?: {
        first_name?: string;
        last_name?: string;
        full_name?: string;
        email?: string;
        phone?: string;
        city?: string;
        address?: string;
        instructions?: string;
    };
    mode?: 'home_delivery' | 'store_pickup';
    items: OrderItem[];
    created_at: string;
    items_count?: number;
}

export interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: string;
    total_price: string;
    product: {
        id: number;
        name: string;
        sku: string;
        cover_image_url?: string;
        images?: Array<{
            id: number;
            image_url: string;
            alt_text?: string;
            is_cover: boolean;
        }>;
    };
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: 'retail' | 'wholesale';
    orders: number;
    totalSpent: number;
}


export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'client' | 'superadmin';
    type?: 'retail' | 'wholesale';
    avatar?: string;
    phone?: string;
    isActive?: boolean;
    lastLogin?: string;
    createdAt?: string;
}

export interface AuthResponse {
    user: User;
    token?: string;
    refreshToken?: string;
    message?: string;
}

export interface LoginCredentials {
    identifiant: string;
    password: string;
}

export interface RegisterData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

export interface SecurityEvent {
    id: string;
    userId?: string;
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ipAddress: string;
    userAgent?: string;
    timestamp: string;
    resolved?: boolean;
}

export interface Session {
    id: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    lastActivity: string;
    isActive: boolean;
}

export interface CartItem {
    product: Product;
    quantity: number;
    priceType: 'retail' | 'wholesale';
    addedAt: string;
}

export interface Cart {
    id: string;
    userId: string;
    items: CartItem[];
    total: number;
    itemCount: number;
    updatedAt: string;
}

export interface DeliveryOption {
    id: string;
    name: string;
    description: string;
    price: number;
    estimated_days: number;
    is_available: boolean;
    zones?: string[];
}

export interface PromoCodeValidation {
    valid: boolean;
    discount_amount: number;
    discount_type: 'percentage' | 'fixed';
    message?: string;
    code?: string;
    min_order_amount?: number;
}

export interface PromoCodeRequest {
    code: string;
    total_amount: number;
}
