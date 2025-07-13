/**
 * AIDA Platform - Database Type Definitions
 * CRITICAL: Type-safe database schema for multi-tenant architecture
 * PATTERN: Supabase-generated types with pgvector support
 */

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
      businesses: {
        Row: {
          id: string
          name: string
          industry: string | null
          created_at: string
          updated_at: string
          subscription_plan: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'suspended'
          max_assistants: number
          max_conversations_per_month: number
          settings: Json | null
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          created_at?: string
          updated_at?: string
          subscription_plan?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          max_assistants?: number
          max_conversations_per_month?: number
          settings?: Json | null
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          created_at?: string
          updated_at?: string
          subscription_plan?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          max_assistants?: number
          max_conversations_per_month?: number
          settings?: Json | null
        }
        Relationships: []
      }
      assistants: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          whatsapp_instance_id: string | null
          knowledge_graph_id: string | null
          personality_prompt: string
          is_active: boolean
          created_at: string
          updated_at: string
          settings: Json | null
          performance_metrics: Json | null
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          whatsapp_instance_id?: string | null
          knowledge_graph_id?: string | null
          personality_prompt: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          settings?: Json | null
          performance_metrics?: Json | null
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          whatsapp_instance_id?: string | null
          knowledge_graph_id?: string | null
          personality_prompt?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          settings?: Json | null
          performance_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assistants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          assistant_id: string
          remote_jid: string
          customer_name: string | null
          customer_phone: string | null
          last_message_at: string
          context_summary: string | null
          embeddings: number[] | null
          status: 'active' | 'resolved' | 'escalated' | 'archived'
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          assistant_id: string
          remote_jid: string
          customer_name?: string | null
          customer_phone?: string | null
          last_message_at?: string
          context_summary?: string | null
          embeddings?: number[] | null
          status?: 'active' | 'resolved' | 'escalated' | 'archived'
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          assistant_id?: string
          remote_jid?: string
          customer_name?: string | null
          customer_phone?: string | null
          last_message_at?: string
          context_summary?: string | null
          embeddings?: number[] | null
          status?: 'active' | 'resolved' | 'escalated' | 'archived'
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          content: string
          sender_type: 'customer' | 'assistant'
          message_type: 'text' | 'media' | 'location' | 'document' | 'audio'
          timestamp: string
          embeddings: number[] | null
          metadata: Json | null
          processing_status: 'pending' | 'processed' | 'failed'
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          content: string
          sender_type: 'customer' | 'assistant'
          message_type?: 'text' | 'media' | 'location' | 'document' | 'audio'
          timestamp?: string
          embeddings?: number[] | null
          metadata?: Json | null
          processing_status?: 'pending' | 'processed' | 'failed'
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          content?: string
          sender_type?: 'customer' | 'assistant'
          message_type?: 'text' | 'media' | 'location' | 'document' | 'audio'
          timestamp?: string
          embeddings?: number[] | null
          metadata?: Json | null
          processing_status?: 'pending' | 'processed' | 'failed'
          confidence_score?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_nodes: {
        Row: {
          id: string
          business_id: string
          entity_type: string
          entity_name: string
          properties: Json | null
          embeddings: number[] | null
          created_at: string
          updated_at: string
          source: string | null
          confidence_score: number | null
          version: number
        }
        Insert: {
          id?: string
          business_id: string
          entity_type: string
          entity_name: string
          properties?: Json | null
          embeddings?: number[] | null
          created_at?: string
          updated_at?: string
          source?: string | null
          confidence_score?: number | null
          version?: number
        }
        Update: {
          id?: string
          business_id?: string
          entity_type?: string
          entity_name?: string
          properties?: Json | null
          embeddings?: number[] | null
          created_at?: string
          updated_at?: string
          source?: string | null
          confidence_score?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_nodes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_relations: {
        Row: {
          id: string
          business_id: string
          from_node_id: string
          to_node_id: string
          relation_type: string
          properties: Json | null
          confidence_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          from_node_id: string
          to_node_id: string
          relation_type: string
          properties?: Json | null
          confidence_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          from_node_id?: string
          to_node_id?: string
          relation_type?: string
          properties?: Json | null
          confidence_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_relations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_relations_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_relations_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          }
        ]
      }
      evolution_instances: {
        Row: {
          id: string
          business_id: string
          assistant_id: string
          instance_id: string
          instance_name: string
          status: 'creating' | 'connecting' | 'connected' | 'disconnected' | 'error'
          qr_code: string | null
          webhook_url: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
          last_seen_at: string | null
          settings: Json | null
        }
        Insert: {
          id?: string
          business_id: string
          assistant_id: string
          instance_id: string
          instance_name: string
          status?: 'creating' | 'connecting' | 'connected' | 'disconnected' | 'error'
          qr_code?: string | null
          webhook_url?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
          last_seen_at?: string | null
          settings?: Json | null
        }
        Update: {
          id?: string
          business_id?: string
          assistant_id?: string
          instance_id?: string
          instance_name?: string
          status?: 'creating' | 'connecting' | 'connected' | 'disconnected' | 'error'
          qr_code?: string | null
          webhook_url?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
          last_seen_at?: string | null
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_instances_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_instances_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      vector_search: {
        Args: {
          query_embedding: number[]
          business_id: string
          table_name: string
          threshold?: number
          limit?: number
        }
        Returns: {
          id: string
          content: string
          similarity: number
          metadata: Json
        }[]
      }
      generate_embeddings: {
        Args: {
          texts: string[]
        }
        Returns: {
          embeddings: number[][]
        }
      }
    }
    Enums: {
      subscription_plan: 'free' | 'pro' | 'enterprise'
      subscription_status: 'active' | 'inactive' | 'suspended'
      conversation_status: 'active' | 'resolved' | 'escalated' | 'archived'
      message_sender_type: 'customer' | 'assistant'
      message_type: 'text' | 'media' | 'location' | 'document' | 'audio'
      processing_status: 'pending' | 'processed' | 'failed'
      instance_status: 'creating' | 'connecting' | 'connected' | 'disconnected' | 'error'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/**
 * Helper types for common database operations
 */
export type BusinessRow = Database['public']['Tables']['businesses']['Row']
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert']
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update']

export type AssistantRow = Database['public']['Tables']['assistants']['Row']
export type AssistantInsert = Database['public']['Tables']['assistants']['Insert']
export type AssistantUpdate = Database['public']['Tables']['assistants']['Update']

export type ConversationRow = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type MessageRow = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type KnowledgeNodeRow = Database['public']['Tables']['knowledge_nodes']['Row']
export type KnowledgeNodeInsert = Database['public']['Tables']['knowledge_nodes']['Insert']
export type KnowledgeNodeUpdate = Database['public']['Tables']['knowledge_nodes']['Update']

export type KnowledgeRelationRow = Database['public']['Tables']['knowledge_relations']['Row']
export type KnowledgeRelationInsert = Database['public']['Tables']['knowledge_relations']['Insert']
export type KnowledgeRelationUpdate = Database['public']['Tables']['knowledge_relations']['Update']

export type EvolutionInstanceRow = Database['public']['Tables']['evolution_instances']['Row']
export type EvolutionInstanceInsert = Database['public']['Tables']['evolution_instances']['Insert']
export type EvolutionInstanceUpdate = Database['public']['Tables']['evolution_instances']['Update']