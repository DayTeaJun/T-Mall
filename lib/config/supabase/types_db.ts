export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          options: Json | null
          product_id: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          options?: Json | null
          product_id: string
          quantity?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          options?: Json | null
          product_id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: number
          is_admin: boolean
          is_read: boolean
          room_id: number
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          is_admin?: boolean
          is_read?: boolean
          room_id: number
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          is_admin?: boolean
          is_read?: boolean
          room_id?: number
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          admin_id: string | null
          closed_at: string | null
          created_at: string
          id: number
          last_message: string | null
          last_message_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: number
          last_message?: string | null
          last_message_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: number
          last_message?: string | null
          last_message_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_rooms_user_table"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_rooms_user_table"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          coupon_code: string | null
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string
          id: string
          issued_count: number
          max_discount_price: number | null
          min_order_price: number | null
          name: string
          total_quantity: number
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at: string
          id?: string
          issued_count?: number
          max_discount_price?: number | null
          min_order_price?: number | null
          name: string
          total_quantity?: number
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string
          id?: string
          issued_count?: number
          max_discount_price?: number | null
          min_order_price?: number | null
          name?: string
          total_quantity?: number
        }
        Relationships: []
      }
      delivery_addresses: {
        Row: {
          address: string
          address_name: string
          created_at: string | null
          delivery_instruction: string | null
          detail_address: string | null
          id: string
          is_default: boolean | null
          postal_code: string
          receiver_name: string
          receiver_phone: string
          user_id: string | null
        }
        Insert: {
          address: string
          address_name: string
          created_at?: string | null
          delivery_instruction?: string | null
          detail_address?: string | null
          id?: string
          is_default?: boolean | null
          postal_code: string
          receiver_name: string
          receiver_phone: string
          user_id?: string | null
        }
        Update: {
          address?: string
          address_name?: string
          created_at?: string | null
          delivery_instruction?: string | null
          detail_address?: string | null
          id?: string
          is_default?: boolean | null
          postal_code?: string
          receiver_name?: string
          receiver_phone?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          metadata: Json | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          metadata?: Json | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          metadata?: Json | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          admin_id: string | null
          answer_content: string | null
          answered_at: string | null
          content: string
          created_at: string | null
          email: string | null
          guest_name: string | null
          id: number
          image_urls: string[] | null
          inquiry_type: string
          is_privacy_agreed: boolean | null
          is_public: boolean | null
          password: string | null
          phone_number: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          answer_content?: string | null
          answered_at?: string | null
          content: string
          created_at?: string | null
          email?: string | null
          guest_name?: string | null
          id?: number
          image_urls?: string[] | null
          inquiry_type: string
          is_privacy_agreed?: boolean | null
          is_public?: boolean | null
          password?: string | null
          phone_number?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          answer_content?: string | null
          answered_at?: string | null
          content?: string
          created_at?: string | null
          email?: string | null
          guest_name?: string | null
          id?: number
          image_urls?: string[] | null
          inquiry_type?: string
          is_privacy_agreed?: boolean | null
          is_public?: boolean | null
          password?: string | null
          phone_number?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          delivery_status: string | null
          id: string
          is_hidden: boolean
          order_id: string
          price: number
          product_id: string
          quantity: number
          size: string | null
        }
        Insert: {
          delivery_status?: string | null
          id?: string
          is_hidden?: boolean
          order_id: string
          price: number
          product_id: string
          quantity: number
          size?: string | null
        }
        Update: {
          delivery_status?: string | null
          id?: string
          is_hidden?: boolean
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_user_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          deleted: boolean | null
          deleted_at: string | null
          detail_address: string | null
          discount_amount: number | null
          id: string
          receiver: string | null
          request: string | null
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          deleted?: boolean | null
          deleted_at?: string | null
          detail_address?: string | null
          discount_amount?: number | null
          id?: string
          receiver?: string | null
          request?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          deleted?: boolean | null
          deleted_at?: string | null
          detail_address?: string | null
          discount_amount?: number | null
          id?: string
          receiver?: string | null
          request?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inquiry: {
        Row: {
          admin_id: string | null
          answer_content: string | null
          answered_at: string | null
          content: string
          created_at: string
          id: number
          product_id: string
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          admin_id?: string | null
          answer_content?: string | null
          answered_at?: string | null
          content: string
          created_at?: string
          id?: number
          product_id: string
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          admin_id?: string | null
          answer_content?: string | null
          answered_at?: string | null
          content?: string
          created_at?: string
          id?: number
          product_id?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_inquiry_admin"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_inquiry_admin"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_inquiry_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_inquiry_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_inquiry_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          deleted: boolean
          deleted_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          gender: string | null
          id: string
          image_url: string | null
          name: string
          original_price: number | null
          price: number
          rating_map: Json | null
          sales_count: number | null
          stock_by_size: Json | null
          subcategory: string | null
          tags: string[] | null
          total_stock: number | null
          updated_at: string | null
          user_id: string | null
          views: number
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          deleted?: boolean
          deleted_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          gender?: string | null
          id?: string
          image_url?: string | null
          name: string
          original_price?: number | null
          price: number
          rating_map?: Json | null
          sales_count?: number | null
          stock_by_size?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          total_stock?: number | null
          updated_at?: string | null
          user_id?: string | null
          views?: number
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          deleted?: boolean
          deleted_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          gender?: string | null
          id?: string
          image_url?: string | null
          name?: string
          original_price?: number | null
          price?: number
          rating_map?: Json | null
          sales_count?: number | null
          stock_by_size?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          total_stock?: number | null
          updated_at?: string | null
          user_id?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_user_table_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_user_table_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpfuls: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfuls_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpfuls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpfuls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string | null
          helpful_count: number
          id: string
          images: string[] | null
          product_id: string
          rating: number
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          helpful_count?: number
          id?: string
          images?: string[] | null
          product_id: string
          rating: number
          updated_at?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          helpful_count?: number
          id?: string
          images?: string[] | null
          product_id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coupons: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          is_used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          is_used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          is_used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_table: {
        Row: {
          address: string
          created_at: string | null
          email: string | null
          id: string
          last_login_at: string | null
          level: number | null
          phone: string
          profile_image_url: string | null
          status: string | null
          updated_at: string | null
          user_name: string | null
        }
        Insert: {
          address?: string
          created_at?: string | null
          email?: string | null
          id: string
          last_login_at?: string | null
          level?: number | null
          phone?: string
          profile_image_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_name?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          level?: number | null
          phone?: string
          profile_image_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      available_review_products: {
        Row: {
          order_item_id: string | null
          product_description: string | null
          product_id: string | null
          product_image: string | null
          product_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_with_user_info: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          email: string | null
          id: string | null
          product_names: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          id: string | null
          profile_image_url: string | null
          user_name: string | null
        }
        Insert: {
          id?: string | null
          profile_image_url?: string | null
          user_name?: string | null
        }
        Update: {
          id?: string | null
          profile_image_url?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      public_usernames: {
        Row: {
          user_name: string | null
        }
        Insert: {
          user_name?: string | null
        }
        Update: {
          user_name?: string | null
        }
        Relationships: []
      }
      v_products_with_favorites: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          deleted: boolean | null
          deleted_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          favorite_count: number | null
          gender: string | null
          id: string | null
          image_url: string | null
          name: string | null
          original_price: number | null
          price: number | null
          rating_map: Json | null
          sales_count: number | null
          stock_by_size: Json | null
          subcategory: string | null
          tags: string[] | null
          total_stock: number | null
          updated_at: string | null
          user_id: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_user_table_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_user_table_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_view_buyer_profile: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      cancel_order_item: { Args: { p_order_item_id: string }; Returns: string }
      delete_inquiry_with_password: {
        Args: { p_inquiry_id: number; p_password: string }
        Returns: {
          image_urls: string[]
          success: boolean
        }[]
      }
      delete_old_closed_chats: { Args: never; Returns: undefined }
      delete_order: { Args: { p_order_id: string }; Returns: undefined }
      delete_product: {
        Args: { target_product_id: string }
        Returns: undefined
      }
      download_coupon: { Args: { p_coupon_code: string }; Returns: Json }
      get_inquiry_detail: {
        Args: { p_inquiry_id: number }
        Returns: {
          answer_content: string
          answered_at: string
          content: string
          created_at: string
          guest_name: string
          id: number
          image_urls: string[]
          inquiry_type: string
          is_guest_post: boolean
          is_locked: boolean
          is_public: boolean
          status: string
          title: string
          updated_at: string
          user_id: string
        }[]
      }
      get_inquiry_secret: {
        Args: { p_inquiry_id: number; p_password: string }
        Returns: {
          answer_content: string
          answered_at: string
          content: string
          created_at: string
          guest_name: string
          id: number
          image_urls: string[]
          inquiry_type: string
          is_public: boolean
          status: string
          title: string
          updated_at: string
        }[]
      }
      hide_order_item_review: {
        Args: { p_order_item_id: string }
        Returns: undefined
      }
      increment_product_views: { Args: { p_id: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      list_inquiries: {
        Args: {
          p_limit: number
          p_offset: number
          p_query: string
          p_type: string
        }
        Returns: {
          created_at: string
          guest_name: string
          id: number
          inquiry_type: string
          is_guest_post: boolean
          is_locked: boolean
          is_public: boolean
          status: string
          title: string
          total_count: number
          user_id: string
        }[]
      }
      mark_messages_as_read: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      mark_room_messages_as_read: {
        Args: { target_room_id: number }
        Returns: undefined
      }
      order_contains_my_product: {
        Args: { target_order_id: string }
        Returns: boolean
      }
      set_default_address: {
        Args: { current_user_id: string; target_id: string }
        Returns: undefined
      }
      toggle_review_helpful: {
        Args: { p_review_id: string; p_user_id: string }
        Returns: Json
      }
      use_coupon: { Args: { p_user_coupon_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
