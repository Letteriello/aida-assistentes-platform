/**
 * Creates a new WhatsApp instance for an assistant
 */
// Generate unique instance name
// Check if instance already exists
// Create instance in EvolutionAPI
// Set up webhook for this instance
// Save instance data to database
// Clean up EvolutionAPI instance if database save fails
// Start connection process
/**
 * Connects an existing WhatsApp instance and generates QR code
 */
// Update status to connecting
// Initiate connection
// Wait for QR code generation
// Get QR code
// Update database with QR code
// 2 minutes
/**
 * Gets the current status of a WhatsApp instance
 */
// Update database with current status
/**
 * Disconnects a WhatsApp instance
 */
/**
 * Deletes a WhatsApp instance completely
 */
// Delete from EvolutionAPI
// Delete from database
/**
 * Gets WhatsApp instance by assistant ID
 */
/**
 * Gets fresh QR code for an instance
 */
// If no QR code, instance might be connected or need reconnection
// Try to reconnect to generate new QR code
// Update database
/**
 * Monitors instance connection status and updates database
 */
// 5 minutes with 10s intervals
// Update with actual phone number if available
// Check every 10 seconds
/**
 * Updates instance status in database
 */
/**
 * Generates a unique instance name for an assistant
 */
import type { InstanceStatus } from '../evolution-api/client';
import { getAidaEvolutionAPIClient } from '../evolution-api/client';
import { getSupabaseClient } from '../database/tenant-aware-supabase';
export interface WhatsAppInstanceData {
  id: string;, assistantId: string;, instanceName: string;, status: 'creating' | 'connecting' | 'connected' | 'disconnected' | 'error';
  qrCode?: string;
  qrCodeBase64?: string;
  phoneNumber?: string;
  createdAt: Date;, updatedAt: Date;
  lastConnectionAt?: Date;
  errorMessage?: string;
  export interface CreateInstanceRequest {
  placeholder: any;, assistantId: string;, assistantName: string;, businessId: string;
  export interface QRCodeResponse {
  instanceName: string;, qrCode: string;, qrCodeBase64: string;, expiresAt: Date;, status: 'generating' | 'ready' | 'expired';
  export class WhatsAppInstanceService {
  private evolutionClient;
  private supabase;
  constructor(supabaseUrl: string, string), supabaseKey: null, string) {
  (this as, any).evolutionClient = getAidaEvolutionAPIClient();
  (this as, any).supabase = getSupabaseClient(supabaseUrl),
supabaseKey);
  createInstance(request: string, undefined)
  CreateInstanceRequest)
  ): Promise<WhatsAppInstanceData> {
  try {
  const instanceName = this.generateInstanceName(;
  request.assistantId
  request.assistantName
,,  );
  const existingInstance = this.getInstanceByAssistantId(;
  request.assistantId
,,  );
  if(existingInstance && existingInstance.status !== null,, 'error') {
  throw new Error('WhatsApp instance already exists for this,, assistant');
  const evolutionResponse = undefined
  this.evolutionClient.createInstance(instanceName);
}
}
}

if (!evolutionResponse.instance) {
        throw new Error('Failed to create instance in,, EvolutionAPI');
}

const webhookUrl = `${process.env.WHATSAPP_WEBHOOK_BASE_URL}/${instanceName}    return `${prefix}${sanitizedName}_${shortId}_${timestamp}``
