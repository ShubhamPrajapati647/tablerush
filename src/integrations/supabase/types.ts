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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_staff: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          area: string | null
          business_category: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          cafe_type: string | null
          city: string | null
          closing_time: string | null
          cover_image_url: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          email: string | null
          id: string
          last_synced_at: string | null
          latitude: number | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          normalized_name: string | null
          opening_time: string | null
          owner_id: string | null
          owner_name: string | null
          phone: string | null
          pincode: string | null
          source: Database["public"]["Enums"]["business_source"]
          source_place_id: string | null
          source_url: string | null
          state: string | null
          status: Database["public"]["Enums"]["business_status"]
          table_rush_registered: boolean
          updated_at: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          business_category?: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          cafe_type?: string | null
          city?: string | null
          closing_time?: string | null
          cover_image_url?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          email?: string | null
          id?: string
          last_synced_at?: string | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          normalized_name?: string | null
          opening_time?: string | null
          owner_id?: string | null
          owner_name?: string | null
          phone?: string | null
          pincode?: string | null
          source?: Database["public"]["Enums"]["business_source"]
          source_place_id?: string | null
          source_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          table_rush_registered?: boolean
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          business_category?: string | null
          business_name?: string
          business_type?: Database["public"]["Enums"]["business_type"]
          cafe_type?: string | null
          city?: string | null
          closing_time?: string | null
          cover_image_url?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          email?: string | null
          id?: string
          last_synced_at?: string | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          normalized_name?: string | null
          opening_time?: string | null
          owner_id?: string | null
          owner_name?: string | null
          phone?: string | null
          pincode?: string | null
          source?: Database["public"]["Enums"]["business_source"]
          source_place_id?: string | null
          source_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          table_rush_registered?: boolean
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      directory_sync_runs: {
        Row: {
          areas: string[]
          created_count: number
          error_message: string | null
          fetched: number
          finished_at: string | null
          id: string
          provider: string | null
          skipped_count: number
          started_at: string
          status: string
          trigger: string
          updated_count: number
        }
        Insert: {
          areas?: string[]
          created_count?: number
          error_message?: string | null
          fetched?: number
          finished_at?: string | null
          id?: string
          provider?: string | null
          skipped_count?: number
          started_at?: string
          status?: string
          trigger?: string
          updated_count?: number
        }
        Update: {
          areas?: string[]
          created_count?: number
          error_message?: string | null
          fetched?: number
          finished_at?: string | null
          id?: string
          provider?: string | null
          skipped_count?: number
          started_at?: string
          status?: string
          trigger?: string
          updated_count?: number
        }
        Relationships: []
      }
      game_cards: {
        Row: {
          business_id: string | null
          card_type: Database["public"]["Enums"]["game_card_type"]
          created_at: string
          description: string
          id: string
          is_active: boolean
          payload: Json
          points: number
          title: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          card_type: Database["public"]["Enums"]["game_card_type"]
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          payload?: Json
          points?: number
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          card_type?: Database["public"]["Enums"]["game_card_type"]
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          payload?: Json
          points?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      game_moves: {
        Row: {
          card_id: string | null
          created_at: string
          id: string
          move_type: string
          payload: Json
          player_id: string | null
          points: number
          session_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          id?: string
          move_type?: string
          payload?: Json
          player_id?: string | null
          points?: number
          session_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          id?: string
          move_type?: string
          payload?: Json
          player_id?: string | null
          points?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_moves_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "game_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_moves_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_moves_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          customer_id: string | null
          display_name: string
          guest_token: string | null
          id: string
          joined_at: string
          score: number
          session_id: string
        }
        Insert: {
          customer_id?: string | null
          display_name: string
          guest_token?: string | null
          id?: string
          joined_at?: string
          score?: number
          session_id: string
        }
        Update: {
          customer_id?: string | null
          display_name?: string
          guest_token?: string | null
          id?: string
          joined_at?: string
          score?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rewards: {
        Row: {
          business_id: string
          card_id: string | null
          claimed_at: string | null
          created_at: string
          description: string
          id: string
          player_id: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["game_reward_status"]
          title: string
        }
        Insert: {
          business_id: string
          card_id?: string | null
          claimed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          player_id?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["game_reward_status"]
          title: string
        }
        Update: {
          business_id?: string
          card_id?: string | null
          claimed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          player_id?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["game_reward_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rewards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "game_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rewards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rewards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          business_id: string
          created_at: string
          ended_at: string | null
          id: string
          order_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["game_session_status"]
          table_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          order_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_session_status"]
          table_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          order_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_session_status"]
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_addons: {
        Row: {
          business_id: string
          created_at: string
          id: string
          menu_item_id: string
          name: string
          price: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          menu_item_id: string
          name: string
          price?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          menu_item_id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_addons_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          business_id: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_vegetarian: boolean
          name: string
          prep_minutes: number | null
          price: number
          updated_at: string
        }
        Insert: {
          business_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_vegetarian?: boolean
          name: string
          prep_minutes?: number | null
          price?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_vegetarian?: boolean
          name?: string
          prep_minutes?: number | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          addons: Json
          created_at: string
          id: string
          instructions: string | null
          line_total: number
          menu_item_id: string | null
          name: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          addons?: Json
          created_at?: string
          id?: string
          instructions?: string | null
          line_total?: number
          menu_item_id?: string | null
          name: string
          order_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          addons?: Json
          created_at?: string
          id?: string
          instructions?: string | null
          line_total?: number
          menu_item_id?: string | null
          name?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          guest_token: string | null
          id: string
          instructions: string | null
          order_number: string
          order_status: Database["public"]["Enums"]["order_status"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          subtotal: number
          table_id: string
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          guest_token?: string | null
          id?: string
          instructions?: string | null
          order_number: string
          order_status?: Database["public"]["Enums"]["order_status"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          subtotal?: number
          table_id: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          guest_token?: string | null
          id?: string
          instructions?: string | null
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          subtotal?: number
          table_id?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          order_id: string | null
          payload: Json
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          signature_valid: boolean
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          order_id?: string | null
          payload?: Json
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          signature_valid?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          signature_valid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          paid_at: string | null
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          reference: string | null
          refund_amount: number
          refund_id: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          paid_at?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          reference?: string | null
          refund_amount?: number
          refund_id?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          paid_at?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          reference?: string | null
          refund_amount?: number
          refund_id?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          business_id: string
          capacity: number
          created_at: string
          id: string
          qr_token: string
          status: Database["public"]["Enums"]["table_status"]
          table_number: string
          updated_at: string
        }
        Insert: {
          business_id: string
          capacity?: number
          created_at?: string
          id?: string
          qr_token?: string
          status?: Database["public"]["Enums"]["table_status"]
          table_number: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          capacity?: number
          created_at?: string
          id?: string
          qr_token?: string
          status?: Database["public"]["Enums"]["table_status"]
          table_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_directory: {
        Row: {
          address: string | null
          area: string | null
          business_category: string | null
          business_name: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          cafe_type: string | null
          city: string | null
          closing_time: string | null
          cover_image_url: string | null
          created_at: string | null
          cuisine: string | null
          description: string | null
          id: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          opening_time: string | null
          phone: string | null
          pincode: string | null
          source: Database["public"]["Enums"]["business_source"] | null
          source_url: string | null
          state: string | null
          table_rush_registered: boolean | null
          updated_at: string | null
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          business_category?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          cafe_type?: string | null
          city?: string | null
          closing_time?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          id?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          opening_time?: string | null
          phone?: never
          pincode?: string | null
          source?: Database["public"]["Enums"]["business_source"] | null
          source_url?: string | null
          state?: string | null
          table_rush_registered?: boolean | null
          updated_at?: string | null
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          business_category?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          cafe_type?: string | null
          city?: string | null
          closing_time?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          id?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          opening_time?: string | null
          phone?: never
          pincode?: string | null
          source?: Database["public"]["Enums"]["business_source"] | null
          source_url?: string | null
          state?: string | null
          table_rush_registered?: boolean | null
          updated_at?: string | null
          verified?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      public_venues: {
        Row: {
          address: string | null
          business_name: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          cafe_type: string | null
          city: string | null
          closing_time: string | null
          created_at: string | null
          cuisine: string | null
          description: string | null
          id: string | null
          location: string | null
          logo_url: string | null
          opening_time: string | null
          pincode: string | null
          state: string | null
          status: Database["public"]["Enums"]["business_status"] | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          cafe_type?: string | null
          city?: string | null
          closing_time?: string | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          opening_time?: string | null
          pincode?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          cafe_type?: string | null
          city?: string | null
          closing_time?: string | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          opening_time?: string | null
          pincode?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_read_game_session: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      can_read_order: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      directory_areas: {
        Args: { _type?: string }
        Returns: {
          area: string
          venue_count: number
        }[]
      }
      has_business_access: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_business: { Args: { _business_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      search_directory: {
        Args: {
          _area?: string
          _cuisine?: string
          _lat?: number
          _limit?: number
          _lng?: number
          _offset?: number
          _open_now?: boolean
          _sort?: string
          _table_rush?: boolean
          _term?: string
          _type?: string
        }
        Returns: {
          address: string
          area: string
          business_category: string
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          cafe_type: string
          city: string
          closing_time: string
          cover_image_url: string
          created_at: string
          cuisine: string
          description: string
          distance_km: number
          id: string
          latitude: number
          logo_url: string
          longitude: number
          opening_time: string
          phone: string
          pincode: string
          source: Database["public"]["Enums"]["business_source"]
          source_url: string
          state: string
          table_rush_registered: boolean
          total_count: number
          verified: boolean
          website_url: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "customer"
        | "restaurant_owner"
        | "restaurant_staff"
        | "cafe_owner"
        | "cafe_staff"
      business_source: "table_rush" | "external_provider"
      business_status: "pending" | "active" | "suspended" | "inactive"
      business_type: "restaurant" | "cafe"
      game_card_type: "food" | "action" | "challenge" | "reward" | "special"
      game_reward_status: "pending" | "claimed" | "expired"
      game_session_status: "waiting" | "active" | "ended" | "cancelled"
      order_status:
        | "new"
        | "accepted"
        | "preparing"
        | "ready"
        | "served"
        | "completed"
        | "cancelled"
      payment_method:
        | "upi"
        | "credit_card"
        | "debit_card"
        | "net_banking"
        | "pay_at_counter"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "pay_at_counter"
      table_status:
        | "available"
        | "occupied"
        | "order_pending"
        | "preparing"
        | "ready"
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
    Enums: {
      app_role: [
        "admin",
        "customer",
        "restaurant_owner",
        "restaurant_staff",
        "cafe_owner",
        "cafe_staff",
      ],
      business_source: ["table_rush", "external_provider"],
      business_status: ["pending", "active", "suspended", "inactive"],
      business_type: ["restaurant", "cafe"],
      game_card_type: ["food", "action", "challenge", "reward", "special"],
      game_reward_status: ["pending", "claimed", "expired"],
      game_session_status: ["waiting", "active", "ended", "cancelled"],
      order_status: [
        "new",
        "accepted",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],
      payment_method: [
        "upi",
        "credit_card",
        "debit_card",
        "net_banking",
        "pay_at_counter",
      ],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "pay_at_counter",
      ],
      table_status: [
        "available",
        "occupied",
        "order_pending",
        "preparing",
        "ready",
      ],
    },
  },
} as const
