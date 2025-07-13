
import { getEvolutionAPIClient } from './client';
import { getSupabaseClient } from '../database/supabase-client';

// This is a placeholder for the actual AI processing logic
const processMessageWithAI = async (message: string, conversationContext: any, knowledgeGraphId: string) => {
  // In a real application, this would involve a call to a large language model
  // with the message, conversation context, and knowledge graph information.
  return `ECHO: ${message}`;
};

export const handleWhatsAppWebhook = async (req: any, res: any) => {
  const { instance, data, pusher } = req.body;

  if (data.key.fromMe) {
    return res.status(200).send('Ignoring message from self');
  }

  const message = data.message?.conversation || data.message?.extendedTextMessage?.text || '';
  const remoteJid = data.key.remoteJid;

  if (!message) {
    return res.status(200).send('No message content');
  }

  const supabase = getSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  const evolutionAPI = getEvolutionAPIClient(process.env.EVOLUTION_API_KEY!, process.env.EVOLUTION_API_HOST!);

  try {
    // 1. Find the assistant associated with the instance
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('*')
      .eq('whatsapp_instance_id', instance)
      .single();

    if (assistantError) {
      console.error('Error finding assistant:', assistantError);
      return res.status(500).send('Error finding assistant');
    }

    // 2. Get or create the conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('assistant_id', assistant.id)
      .eq('remote_jid', remoteJid)
      .single();

    let conversationContext = {};
    if (conversation) {
      conversationContext = conversation.context_summary;
    } else {
      const { data: newConversation, error: newConversationError } = await supabase
        .from('conversations')
        .insert({
          assistant_id: assistant.id,
          remote_jid: remoteJid
        })
        .single();
      if (newConversationError) {
        console.error('Error creating conversation:', newConversationError);
        return res.status(500).send('Error creating conversation');
      }
    }

    // 3. Process the message with the AI
    const response = await processMessageWithAI(message, conversationContext, assistant.knowledge_graph_id);

    // 4. Send the response back to the user
    await evolutionAPI.sendTextMessage(instance, remoteJid, response);

    res.status(200).send('Message processed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};
