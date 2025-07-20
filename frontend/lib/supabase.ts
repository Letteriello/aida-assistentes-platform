import { createClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Database } from '@shared/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper functions for common operations
export const auth = {
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) =>
    supabase.auth.signUp({ email, password, options: { data: metadata } }),
  
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  
  signOut: () => supabase.auth.signOut(),
  
  getSession: () => supabase.auth.getSession(),
  
  getUser: () => supabase.auth.getUser(),
  
  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) =>
    supabase.auth.onAuthStateChange(callback)
};

// Database helpers
export const db = {
  // Business operations
  getBusiness: (id: string) =>
    supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single(),
  
  getBusinessByUserId: (userId: string) =>
    supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .single(),
  
  // Assistant operations
  getAssistants: (businessId: string) =>
    supabase
      .from('assistants')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false }),
  
  getAssistant: (id: string) =>
    supabase
      .from('assistants')
      .select('*')
      .eq('id', id)
      .single(),
  
  // Conversation operations
  getConversations: (businessId: string, limit = 50) =>
    supabase
      .from('conversations')
      .select(`
        *,
        messages!inner(
          id,
          content,
          sender_type,
          created_at
        )
      `)
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  
  getConversation: (id: string) =>
    supabase
      .from('conversations')
      .select(`
        *,
        messages(
          *
        )
      `)
      .eq('id', id)
      .single(),
  
  // Message operations
  getMessages: (conversationId: string) =>
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
  
  // Knowledge operations
  getKnowledgeNodes: (businessId: string) =>
    supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false }),
  
  // User operations
  getUser: (id: string) =>
    supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single(),
  
  updateUser: (id: string, updates: Partial<Database['public']['Tables']['users']['Update']>) =>
    supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
};

// Real-time subscriptions
export const realtime = {
  subscribeToConversations: (businessId: string, callback: (payload: unknown) => void) =>
    supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`
        },
        callback
      )
      .subscribe(),
  
  subscribeToMessages: (conversationId: string, callback: (payload: unknown) => void) =>
    supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        callback
      )
      .subscribe()
};

export default supabase;