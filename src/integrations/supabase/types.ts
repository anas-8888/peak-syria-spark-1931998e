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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      about_us: {
        Row: {
          created_at: string
          hero_subtitle: string
          hero_title: string
          id: string
          mission_content: string
          mission_title: string
          story_content: string
          story_title: string
          updated_at: string
          values: Json
        }
        Insert: {
          created_at?: string
          hero_subtitle?: string
          hero_title?: string
          id?: string
          mission_content?: string
          mission_title?: string
          story_content?: string
          story_title?: string
          updated_at?: string
          values?: Json
        }
        Update: {
          created_at?: string
          hero_subtitle?: string
          hero_title?: string
          id?: string
          mission_content?: string
          mission_title?: string
          story_content?: string
          story_title?: string
          updated_at?: string
          values?: Json
        }
        Relationships: []
      }
      ai_chat_rate_limit: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          background_color: string | null
          created_at: string
          display_type: string
          id: string
          image_url: string
          is_active: boolean
          link_text: string | null
          link_url: string | null
          position: number
          subtitle: string | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          display_type?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          position?: number
          subtitle?: string | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          display_type?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          position?: number
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_analytics: {
        Row: {
          bounce_count: number | null
          campaign_id: string
          clicked_count: number | null
          converted_count: number | null
          delivered_count: number | null
          id: string
          opened_count: number | null
          revenue_generated: number | null
          sent_count: number | null
          unsubscribe_count: number | null
          updated_at: string
        }
        Insert: {
          bounce_count?: number | null
          campaign_id: string
          clicked_count?: number | null
          converted_count?: number | null
          delivered_count?: number | null
          id?: string
          opened_count?: number | null
          revenue_generated?: number | null
          sent_count?: number | null
          unsubscribe_count?: number | null
          updated_at?: string
        }
        Update: {
          bounce_count?: number | null
          campaign_id?: string
          clicked_count?: number | null
          converted_count?: number | null
          delivered_count?: number | null
          id?: string
          opened_count?: number | null
          revenue_generated?: number | null
          sent_count?: number | null
          unsubscribe_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          selected_color: string | null
          selected_size: string | null
          updated_at: string
          user_id: string
          variant_id: string | null
          variant_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
          updated_at?: string
          user_id: string
          variant_id?: string | null
          variant_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
          updated_at?: string
          user_id?: string
          variant_id?: string | null
          variant_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          show_in_navbar: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          show_in_navbar?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          show_in_navbar?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          created_at: string
          display_order: number | null
          hex_code: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          hex_code: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          hex_code?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          created_at: string
          created_by: string | null
          criteria: Json
          customer_count: number | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          criteria?: Json
          customer_count?: number | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          criteria?: Json
          customer_count?: number | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_categories: {
        Row: {
          category_id: string
          created_at: string | null
          discount_id: string
          id: string
          is_excluded: boolean | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          discount_id: string
          id?: string
          is_excluded?: boolean | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          discount_id?: string
          id?: string
          is_excluded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_categories_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_products: {
        Row: {
          created_at: string | null
          discount_id: string
          id: string
          is_excluded: boolean | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          discount_id: string
          id?: string
          is_excluded?: boolean | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          discount_id?: string
          id?: string
          is_excluded?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_products_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_usages: {
        Row: {
          created_at: string | null
          discount_amount: number
          discount_id: string
          id: string
          ip_address: string | null
          order_id: string | null
          order_subtotal: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          discount_amount: number
          discount_id: string
          id?: string
          ip_address?: string | null
          order_id?: string | null
          order_subtotal: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          discount_amount?: number
          discount_id?: string
          id?: string
          ip_address?: string | null
          order_id?: string | null
          order_subtotal?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_usages_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          bogo_config: Json | null
          bundle_price: number | null
          bundle_products: Json | null
          channels: Database["public"]["Enums"]["discount_channel"][] | null
          code: string | null
          created_at: string | null
          created_by: string | null
          customer_segments: string[] | null
          days_of_week: number[] | null
          end_date: string | null
          first_order_only: boolean | null
          global_usage_limit: number | null
          happy_hours_end: string | null
          happy_hours_start: string | null
          id: string
          internal_notes: string | null
          is_automatic: boolean | null
          is_stackable: boolean | null
          logged_in_only: boolean | null
          marketing_label: string | null
          min_cart_subtotal: number | null
          min_purchase_amount: number | null
          min_quantity: number | null
          name: string
          per_customer_limit: number | null
          per_order_max_discount: number | null
          scope: Database["public"]["Enums"]["discount_scope"]
          show_in_banner: boolean
          stack_with_shipping: boolean | null
          start_date: string
          status: Database["public"]["Enums"]["discount_status"]
          tiered_config: Json | null
          total_revenue: number | null
          total_uses: number | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string | null
          value: number
          value_type: string | null
        }
        Insert: {
          bogo_config?: Json | null
          bundle_price?: number | null
          bundle_products?: Json | null
          channels?: Database["public"]["Enums"]["discount_channel"][] | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_segments?: string[] | null
          days_of_week?: number[] | null
          end_date?: string | null
          first_order_only?: boolean | null
          global_usage_limit?: number | null
          happy_hours_end?: string | null
          happy_hours_start?: string | null
          id?: string
          internal_notes?: string | null
          is_automatic?: boolean | null
          is_stackable?: boolean | null
          logged_in_only?: boolean | null
          marketing_label?: string | null
          min_cart_subtotal?: number | null
          min_purchase_amount?: number | null
          min_quantity?: number | null
          name: string
          per_customer_limit?: number | null
          per_order_max_discount?: number | null
          scope?: Database["public"]["Enums"]["discount_scope"]
          show_in_banner?: boolean
          stack_with_shipping?: boolean | null
          start_date: string
          status?: Database["public"]["Enums"]["discount_status"]
          tiered_config?: Json | null
          total_revenue?: number | null
          total_uses?: number | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at?: string | null
          value: number
          value_type?: string | null
        }
        Update: {
          bogo_config?: Json | null
          bundle_price?: number | null
          bundle_products?: Json | null
          channels?: Database["public"]["Enums"]["discount_channel"][] | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_segments?: string[] | null
          days_of_week?: number[] | null
          end_date?: string | null
          first_order_only?: boolean | null
          global_usage_limit?: number | null
          happy_hours_end?: string | null
          happy_hours_start?: string | null
          id?: string
          internal_notes?: string | null
          is_automatic?: boolean | null
          is_stackable?: boolean | null
          logged_in_only?: boolean | null
          marketing_label?: string | null
          min_cart_subtotal?: number | null
          min_purchase_amount?: number | null
          min_quantity?: number | null
          name?: string
          per_customer_limit?: number | null
          per_order_max_discount?: number | null
          scope?: Database["public"]["Enums"]["discount_scope"]
          show_in_banner?: boolean
          stack_with_shipping?: boolean | null
          start_date?: string
          status?: Database["public"]["Enums"]["discount_status"]
          tiered_config?: Json | null
          total_revenue?: number | null
          total_uses?: number | null
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string | null
          value?: number
          value_type?: string | null
        }
        Relationships: []
      }
      hero_showcase: {
        Row: {
          created_at: string
          cta_text: string | null
          cta_url: string | null
          hero_description: string
          hero_image_url: string
          hero_subtitle: string | null
          hero_title: string
          id: string
          is_active: boolean
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          hero_description: string
          hero_image_url: string
          hero_subtitle?: string | null
          hero_title: string
          id?: string
          is_active?: boolean
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          hero_description?: string
          hero_image_url?: string
          hero_subtitle?: string | null
          hero_title?: string
          id?: string
          is_active?: boolean
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          button_text: string
          button_url: string
          created_at: string
          display_order: number
          flag_name: string
          id: string
          image_height: number
          image_url: string
          image_width: number
          is_active: boolean
          show_in_navbar: boolean
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          button_text: string
          button_url: string
          created_at?: string
          display_order?: number
          flag_name: string
          id?: string
          image_height?: number
          image_url: string
          image_width?: number
          is_active?: boolean
          show_in_navbar?: boolean
          subtitle: string
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string
          button_url?: string
          created_at?: string
          display_order?: number
          flag_name?: string
          id?: string
          image_height?: number
          image_url?: string
          image_width?: number
          is_active?: boolean
          show_in_navbar?: boolean
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          last_updated: string | null
          page_type: string
          title: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          page_type: string
          title: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          page_type?: string
          title?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          completed_at: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          scheduled_date: string | null
          started_at: string | null
          status: string
          subject: string | null
          target_audience_size: number | null
          target_segment: string | null
          template_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          scheduled_date?: string | null
          started_at?: string | null
          status?: string
          subject?: string | null
          target_audience_size?: number | null
          target_segment?: string | null
          template_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scheduled_date?: string | null
          started_at?: string | null
          status?: string
          subject?: string | null
          target_audience_size?: number | null
          target_segment?: string | null
          template_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          preview_text: string | null
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          preview_text?: string | null
          subject?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          preview_text?: string | null
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          price: number
          product_id: string
          quantity: number
          selected_color: string | null
          selected_size: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          price: number
          product_id: string
          quantity: number
          selected_color?: string | null
          selected_size?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
          variant_id?: string | null
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          order_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          order_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_date: string | null
          cancel_reason: string | null
          cancel_status: string | null
          cancelled_at: string | null
          created_at: string | null
          customer_confirmed_receipt: boolean | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          discount_amount: number | null
          discount_id: string | null
          id: string
          pending_at: string | null
          processing_at: string | null
          receipt_confirmed_at: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_carrier_id: string | null
          shipping_cost: number | null
          shipping_region_id: string | null
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_date?: string | null
          cancel_reason?: string | null
          cancel_status?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          customer_confirmed_receipt?: boolean | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          discount_amount?: number | null
          discount_id?: string | null
          id?: string
          pending_at?: string | null
          processing_at?: string | null
          receipt_confirmed_at?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_carrier_id?: string | null
          shipping_cost?: number | null
          shipping_region_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_date?: string | null
          cancel_reason?: string | null
          cancel_status?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          customer_confirmed_receipt?: boolean | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          discount_amount?: number | null
          discount_id?: string | null
          id?: string
          pending_at?: string | null
          processing_at?: string | null
          receipt_confirmed_at?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_carrier_id?: string | null
          shipping_cost?: number | null
          shipping_region_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_carrier_id_fkey"
            columns: ["shipping_carrier_id"]
            isOneToOne: false
            referencedRelation: "shipping_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_region_id_fkey"
            columns: ["shipping_region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          additional_data: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          additional_data?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          additional_data?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          id: string
          order_id: string
          payment_method: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_name: string
          id?: string
          order_id: string
          payment_method: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          id?: string
          order_id?: string
          payment_method?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          color_id: string
          created_at: string | null
          display_order: number | null
          id: string
          image_id: string | null
          product_id: string
        }
        Insert: {
          color_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_id?: string | null
          product_id: string
        }
        Update: {
          color_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_id?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_colors_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          updated_at?: string | null
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
      product_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          product_id: string
          rating: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_id: string | null
          created_at: string
          id: string
          is_active: boolean
          price: number
          product_id: string
          size: string
          sku: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          price: number
          product_id: string
          size: string
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          color_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number
          product_id?: string
          size?: string
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          colors: Json | null
          created_at: string | null
          description: string | null
          features: string[] | null
          flag: string | null
          hidden: boolean
          id: string
          image_url: string | null
          is_active: boolean | null
          max_price: number | null
          min_price: number | null
          name: string
          offer_price: number | null
          price: number
          rating: number | null
          sizes: string[] | null
          sku: string | null
          stock_quantity: number | null
          target_gender: string | null
          unified_pricing: boolean
          updated_at: string | null
        }
        Insert: {
          category: string
          colors?: Json | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          flag?: string | null
          hidden?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name: string
          offer_price?: number | null
          price: number
          rating?: number | null
          sizes?: string[] | null
          sku?: string | null
          stock_quantity?: number | null
          target_gender?: string | null
          unified_pricing?: boolean
          updated_at?: string | null
        }
        Update: {
          category?: string
          colors?: Json | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          flag?: string | null
          hidden?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          offer_price?: number | null
          price?: number
          rating?: number | null
          sizes?: string[] | null
          sku?: string | null
          stock_quantity?: number | null
          target_gender?: string | null
          unified_pricing?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string | null
          region_id: string | null
          role_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string | null
          region_id?: string | null
          role_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          region_id?: string | null
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      shipping_carrier_regions: {
        Row: {
          carrier_id: string
          cost: number
          created_at: string
          id: string
          region_id: string
        }
        Insert: {
          carrier_id: string
          cost?: number
          created_at?: string
          id?: string
          region_id: string
        }
        Update: {
          carrier_id?: string
          cost?: number
          created_at?: string
          id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_carrier_regions_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "shipping_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_carrier_regions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_carriers: {
        Row: {
          created_at: string
          description: string | null
          details: string | null
          display_order: number
          estimated_days: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          details?: string | null
          display_order?: number
          estimated_days?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          details?: string | null
          display_order?: number
          estimated_days?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      showcase_products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
          showcase_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          showcase_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          showcase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_products_showcase_id_fkey"
            columns: ["showcase_id"]
            isOneToOne: false
            referencedRelation: "hero_showcase"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          brand_description: string | null
          business_hours: string | null
          created_at: string
          email_response_time: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          location_description: string | null
          maintenance_image_url: string | null
          maintenance_mode: boolean | null
          phone_description: string | null
          physical_address: string | null
          store_email: string | null
          store_phone: string | null
          twitter_url: string | null
          updated_at: string
          whatsapp_description: string | null
          whatsapp_number: string | null
        }
        Insert: {
          brand_description?: string | null
          business_hours?: string | null
          created_at?: string
          email_response_time?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          location_description?: string | null
          maintenance_image_url?: string | null
          maintenance_mode?: boolean | null
          phone_description?: string | null
          physical_address?: string | null
          store_email?: string | null
          store_phone?: string | null
          twitter_url?: string | null
          updated_at?: string
          whatsapp_description?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          brand_description?: string | null
          business_hours?: string | null
          created_at?: string
          email_response_time?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          location_description?: string | null
          maintenance_image_url?: string | null
          maintenance_mode?: boolean | null
          phone_description?: string | null
          physical_address?: string | null
          store_email?: string | null
          store_phone?: string | null
          twitter_url?: string | null
          updated_at?: string
          whatsapp_description?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          arabic_value: string
          created_at: string
          english_key: string
          id: string
          is_auto_detected: boolean
          last_seen_at: string
          updated_at: string
        }
        Insert: {
          arabic_value: string
          created_at?: string
          english_key: string
          id?: string
          is_auto_detected?: boolean
          last_seen_at?: string
          updated_at?: string
        }
        Update: {
          arabic_value?: string
          created_at?: string
          english_key?: string
          id?: string
          is_auto_detected?: boolean
          last_seen_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_ai_chat_rate_limit: {
        Args: {
          p_ip_address: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      create_order_with_items: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_latitude?: number
          p_delivery_longitude?: number
          p_discount_amount?: number
          p_discount_id?: string
          p_items?: Json
          p_shipping_address: string
          p_shipping_carrier_id?: string
          p_shipping_cost?: number
          p_shipping_region_id?: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: string
      }
      get_available_sizes_for_color: {
        Args: { p_color_id: string; p_product_id: string }
        Returns: {
          price: number
          size: string
          stock_quantity: number
          variant_id: string
        }[]
      }
      get_product_price_range: {
        Args: { p_product_id: string }
        Returns: {
          max_price: number
          min_price: number
          unified_pricing: boolean
        }[]
      }
      has_role: {
        Args: { _role_name: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      record_discount_usage: {
        Args: {
          p_discount_amount: number
          p_discount_id: string
          p_ip_address?: string
          p_order_id: string
          p_order_subtotal: number
          p_user_id: string
        }
        Returns: boolean
      }
      validate_discount_code: {
        Args: {
          p_cart_items: Json
          p_cart_subtotal: number
          p_code: string
          p_user_id: string
        }
        Returns: {
          discount_amount: number
          discount_id: string
          is_valid: boolean
          message: string
        }[]
      }
    }
    Enums: {
      discount_channel: "web" | "app" | "pos" | "marketplace"
      discount_scope: "store_wide" | "categories" | "products" | "flags"
      discount_status:
        | "active"
        | "scheduled"
        | "expired"
        | "paused"
        | "archived"
      discount_type:
        | "percentage"
        | "fixed_amount"
        | "bogo_x_for_y"
        | "tiered"
        | "bundle"
        | "volume"
        | "free_shipping"
        | "clearance"
        | "flash_sale"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      discount_channel: ["web", "app", "pos", "marketplace"],
      discount_scope: ["store_wide", "categories", "products", "flags"],
      discount_status: ["active", "scheduled", "expired", "paused", "archived"],
      discount_type: [
        "percentage",
        "fixed_amount",
        "bogo_x_for_y",
        "tiered",
        "bundle",
        "volume",
        "free_shipping",
        "clearance",
        "flash_sale",
      ],
    },
  },
} as const
