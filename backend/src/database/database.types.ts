/**
 * AIDA Platform - Database Types
 * Unified types for Supabase database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          name: string | null;
          business_name: string | null;
          business_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          name?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          name?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      whatsapp_instances: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: string;
          qr_code: string | null;
          message_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          status?: string;
          qr_code?: string | null;
          message_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          status?: string;
          qr_code?: string | null;
          message_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      verification_codes: {
        Row: {
          id: string;
          phone: string;
          code: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          code: string;
          expires_at: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          code?: string;
          expires_at?: string;
          used?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
