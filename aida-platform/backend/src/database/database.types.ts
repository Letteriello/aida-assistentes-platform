/**
 * AIDA Platform - Database Types
 * Auto-generated types for Supabase database schema
 * These types ensure type safety across the entire platform
 */

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          name: string;
          industry: string;
          created_at: string;
          updated_at: string;
          subscription_plan: 'free' | 'pro' | 'enterprise';
          is_active: boolean;
          settings: Json;
        };
        Insert: {
          id?: string;
          name: string;
          industry: string;
          created_at?: string;
          updated_at?: string;
          subscription_plan?: 'free' | 'pro' | 'enterprise';
          is_active?: boolean;
          settings?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string;
          created_at?: string;
          updated_at?: string;
          subscription_plan?: 'free' | 'pro' | 'enterprise';
          is_active?: boolean;
          settings?: Json;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          business_id: string;
          role: 'owner' | 'admin' | 'manager' | 'agent';
          permissions: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          business_id: string;
          role?: 'owner' | 'admin' | 'manager' | 'agent';
          permissions?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          business_id?: string;
          role?: 'owner' | 'admin' | 'manager' | 'agent';
          permissions?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
      };
      assistants: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          whatsapp_instance_id: string;
          knowledge_graph_id: string | null;
          personality_prompt: string;
          system_prompt: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          settings: Json;
          metrics: Json;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          whatsapp_instance_id: string;
          knowledge_graph_id?: string | null;
          personality_prompt: string;
          system_prompt?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          settings?: Json;
          metrics?: Json;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          whatsapp_instance_id?: string;
          knowledge_graph_id?: string | null;
          personality_prompt?: string;
          system_prompt?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          settings?: Json;
          metrics?: Json;
        };
      };
      conversations: {
        Row: {
          id: string;
          assistant_id: string;
          remote_jid: string;
          customer_name: string | null;
          customer_phone: string | null;
          status: 'active' | 'resolved' | 'escalated' | 'archived';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          created_at: string;
          updated_at: string;
          last_message_at: string;
          context_summary: string;
          embeddings: string; // pgvector type stored as string
          metadata: Json;
        };
        Insert: {
          id?: string;
          assistant_id: string;
          remote_jid: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          status?: 'active' | 'resolved' | 'escalated' | 'archived';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
          context_summary?: string;
          embeddings?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          assistant_id?: string;
          remote_jid?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          status?: 'active' | 'resolved' | 'escalated' | 'archived';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
          context_summary?: string;
          embeddings?: string;
          metadata?: Json;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          content: string;
          sender_type: 'customer' | 'assistant' | 'human_agent';
          message_type: 'text' | 'media' | 'location' | 'contact' | 'document';
          timestamp: string;
          embeddings: string; // pgvector type stored as string
          metadata: Json;
          is_processed: boolean;
          processing_time_ms: number | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          content: string;
          sender_type: 'customer' | 'assistant' | 'human_agent';
          message_type?: 'text' | 'media' | 'location' | 'contact' | 'document';
          timestamp?: string;
          embeddings?: string;
          metadata?: Json;
          is_processed?: boolean;
          processing_time_ms?: number | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          content?: string;
          sender_type?: 'customer' | 'assistant' | 'human_agent';
          message_type?: 'text' | 'media' | 'location' | 'contact' | 'document';
          timestamp?: string;
          embeddings?: string;
          metadata?: Json;
          is_processed?: boolean;
          processing_time_ms?: number | null;
        };
      };
      knowledge_nodes: {
        Row: {
          id: string;
          business_id: string;
          entity_type: 'product' | 'service' | 'policy' | 'procedure' | 'faq' | 'contact';
          entity_name: string;
          content: string;
          properties: Json;
          embeddings: string; // pgvector type stored as string
          created_at: string;
          updated_at: string;
          is_active: boolean;
          source: 'manual' | 'import' | 'api' | 'extracted';
        };
        Insert: {
          id?: string;
          business_id: string;
          entity_type: 'product' | 'service' | 'policy' | 'procedure' | 'faq' | 'contact';
          entity_name: string;
          content: string;
          properties?: Json;
          embeddings?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          source?: 'manual' | 'import' | 'api' | 'extracted';
        };
        Update: {
          id?: string;
          business_id?: string;
          entity_type?: 'product' | 'service' | 'policy' | 'procedure' | 'faq' | 'contact';
          entity_name?: string;
          content?: string;
          properties?: Json;
          embeddings?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          source?: 'manual' | 'import' | 'api' | 'extracted';
        };
      };
      knowledge_relations: {
        Row: {
          id: string;
          from_node_id: string;
          to_node_id: string;
          relation_type: 'relates_to' | 'contains' | 'depends_on' | 'replaces' | 'references';
          strength: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_node_id: string;
          to_node_id: string;
          relation_type: 'relates_to' | 'contains' | 'depends_on' | 'replaces' | 'references';
          strength?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_node_id?: string;
          to_node_id?: string;
          relation_type?: 'relates_to' | 'contains' | 'depends_on' | 'replaces' | 'references';
          strength?: number;
          created_at?: string;
        };
      };
      evolution_instances: {
        Row: {
          id: string;
          business_id: string;
          instance_name: string;
          api_key: string;
          webhook_url: string;
          status: 'connecting' | 'connected' | 'disconnected' | 'error';
          qr_code: string | null;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
          last_ping_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          instance_name: string;
          api_key: string;
          webhook_url: string;
          status?: 'connecting' | 'connected' | 'disconnected' | 'error';
          qr_code?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
          last_ping_at?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          instance_name?: string;
          api_key?: string;
          webhook_url?: string;
          status?: 'connecting' | 'connected' | 'disconnected' | 'error';
          qr_code?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
          last_ping_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      conversations_vector_search: {
        Args: {
          query_embedding: string;
          business_id: string;
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          similarity: number;
        }[];
      };
      knowledge_nodes_vector_search: {
        Args: {
          query_embedding: string;
          business_id: string;
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          entity_name: string;
          entity_type: string;
          similarity: number;
        }[];
      };
      messages_vector_search: {
        Args: {
          query_embedding: string;
          business_id: string;
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          conversation_id: string;
          similarity: number;
        }[];
      };
      conversations_hybrid_search: {
        Args: {
          search_query: string;
          query_embedding: string;
          business_id: string;
          vector_weight: number;
          text_weight: number;
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          combined_score: number;
        }[];
      };
      knowledge_nodes_hybrid_search: {
        Args: {
          search_query: string;
          query_embedding: string;
          business_id: string;
          vector_weight: number;
          text_weight: number;
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          entity_name: string;
          entity_type: string;
          combined_score: number;
        }[];
      };
      generate_embedding: {
        Args: {
          input_text: string;
          model_name: string;
        };
        Returns: number[];
      };
      enable_pgvector: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      execute_sql: {
        Args: {
          sql_query: string;
          sql_params: any[];
        };
        Returns: any;
      };
    };
    Enums: {
      subscription_plan: 'free' | 'pro' | 'enterprise';
      user_role: 'owner' | 'admin' | 'manager' | 'agent';
      conversation_status: 'active' | 'resolved' | 'escalated' | 'archived';
      conversation_priority: 'low' | 'medium' | 'high' | 'urgent';
      message_sender_type: 'customer' | 'assistant' | 'human_agent';
      message_type: 'text' | 'media' | 'location' | 'contact' | 'document';
      knowledge_entity_type: 'product' | 'service' | 'policy' | 'procedure' | 'faq' | 'contact';
      knowledge_source: 'manual' | 'import' | 'api' | 'extracted';
      relation_type: 'relates_to' | 'contains' | 'depends_on' | 'replaces' | 'references';
      instance_status: 'connecting' | 'connected' | 'disconnected' | 'error';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper type for JSON columns
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Convenience types for database operations
export type BusinessRow = Database['public']['Tables']['businesses']['Row'];
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type AssistantRow = Database['public']['Tables']['assistants']['Row'];
export type AssistantInsert = Database['public']['Tables']['assistants']['Insert'];
export type AssistantUpdate = Database['public']['Tables']['assistants']['Update'];

export type ConversationRow = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type KnowledgeNodeRow = Database['public']['Tables']['knowledge_nodes']['Row'];
export type KnowledgeNodeInsert = Database['public']['Tables']['knowledge_nodes']['Insert'];
export type KnowledgeNodeUpdate = Database['public']['Tables']['knowledge_nodes']['Update'];

export type KnowledgeRelationRow = Database['public']['Tables']['knowledge_relations']['Row'];
export type KnowledgeRelationInsert = Database['public']['Tables']['knowledge_relations']['Insert'];
export type KnowledgeRelationUpdate = Database['public']['Tables']['knowledge_relations']['Update'];

export type EvolutionInstanceRow = Database['public']['Tables']['evolution_instances']['Row'];
export type EvolutionInstanceInsert = Database['public']['Tables']['evolution_instances']['Insert'];
export type EvolutionInstanceUpdate = Database['public']['Tables']['evolution_instances']['Update'];