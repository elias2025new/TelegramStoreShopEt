
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            products: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    description: string | null
                    price: number
                    image_url: string | null
                    category: string | null
                    gender: string | null
                    sizes: string[] | null
                    stock: Json | null
                    additional_images: string[] | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    description?: string | null
                    price: number
                    image_url?: string | null
                    category?: string | null
                    gender?: string | null
                    sizes?: string[] | null
                    stock?: Json | null
                    additional_images?: string[] | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    description?: string | null
                    price?: number
                    image_url?: string | null
                    category?: string | null
                    gender?: string | null
                    sizes?: string[] | null
                    stock?: Json | null
                    additional_images?: string[] | null
                }
                Relationships: []
            }
            store_visits: {
                Row: {
                    id: string
                    store_id: string
                    telegram_user_id: string
                    visit_date: string
                    visited_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    telegram_user_id: string
                    visit_date?: string
                    visited_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    telegram_user_id?: string
                    visit_date?: string
                    visited_at?: string
                }
                Relationships: []
            },
            orders: {
                Row: {
                    id: string
                    created_at: string
                    store_id: string
                    telegram_user_id: string
                    full_name: string
                    phone_number: string
                    shipping_address: string
                    location_data: Json | null
                    total_price: number
                    status: string
                    payment_method: string
                    delivered_at: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    store_id: string
                    telegram_user_id: string
                    full_name: string
                    phone_number: string
                    shipping_address: string
                    location_data?: Json | null
                    total_price: number
                    status?: string
                    payment_method?: string
                    delivered_at?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    store_id?: string
                    telegram_user_id?: string
                    full_name?: string
                    phone_number?: string
                    shipping_address?: string
                    location_data?: Json | null
                    total_price?: number
                    status?: string
                    payment_method?: string
                    delivered_at?: string | null
                }
                Relationships: []
            },
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    quantity: number
                    price_at_time: number
                    selected_size: string | null
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    quantity: number
                    price_at_time: number
                    selected_size?: string | null
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    price_at_time?: number
                    selected_size?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_product_id_fkey"
                        columns: ["product_id"]
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
