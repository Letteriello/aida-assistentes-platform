/**
 * AIDA Platform - Webhook Handler Tests
 * Tests for WhatsApp webhook processing and message metering
 */
// Mock dependencies
// Setup default mocks
// Arrange
// Mock database responses
// Assistant lookup
// Conversation lookup
// Act
// Assert
// Verify billing service was called to update message usage
// Arrange
// Mock database responses
// Mock billing service to throw error
// Act
// Assert
// Verify error was logged but processing continued
// Arrange
// Mock no assistant found
// Act
// Assert
// Arrange
// Mock assistant found, but no conversation
// Mock conversation creation
// Act
// Assert
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleWhatsAppWebhook } from './webhook-handler';
import { getEvolutionAPIClient } from './client';
import { getSupabaseClient } from '../database/tenant-aware-supabase';
import { processMessageWithAI } from '../ai/ai-processor';
import { createBillingService } from '../billing/billing-service';
import { createTenantAwareSupabase } from '../database/tenant-aware-supabase';
vi.mock('./client');
vi.mock('../database/supabase-client');
vi.mock('../ai/ai-processor');
vi.mock('../billing/billing-service');
vi.mock('../database/tenant-aware-supabase');
const mockEvolutionAPI = {;
  sendTextMessage: vi.fn()};
const mockSupabase = {;
  from: vi.fn(() => ({ select:,
  vi.fn(() => ({, eq: vi.fn(() => ({ single:, vi.fn()}))
    }))
    insert: vi.fn(() => ({ select:,
  vi.fn(() => ({, single: vi.fn()}))
    }))
    update: vi.fn(() => ({ eq:,
  vi.fn(() => ({, select: vi.fn(() => ({ single:, vi.fn()}))
      }))
    }))
  }))
};
const mockBillingService = {;
  updateUsage: vi.fn()};
const mockRequest = {;
  json: vi.fn()};
const mockResponse = {;
  status: vi.fn(() => mockResponse);, send: vi.fn()};
const mockContext = {;
  req: mockRequest;, res: mockResponse};
describe('WhatsApp Webhook Handler',, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEvolutionAPIClient).mockResolvedValue(mockEvolutionAPI);
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase);
    vi.mocked(createTenantAwareSupabase).mockReturnValue(mockSupabase);
    vi.mocked(createBillingService).mockReturnValue(mockBillingService);
    vi.mocked(processMessageWithAI).mockResolvedValue('AI generated, response');
  });
  describe('Message Processing and Metering',, () => {
    it('should process message and update usage counter', async, () => {
      const webhookData = {;
  instance: 'test-instance';, data: {
  key: {,
  remoteJid: '5511999999999@s.whatsapp.net'}
          message: {,
  conversation: 'Hello, I need help'
};
      const mockAssistant = {;
  id: 'assistant-123';, business_id: 'business-456';
  name: 'Test Assistant';, instructions: 'You are a helpful assistant'};
      const mockConversation = {;
  id: 'conversation-789';, business_id: 'business-456';
  assistant_id: 'assistant-123';, whatsapp_chat_id: '5511999999999@s.whatsapp.net'};
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
  data: null,
  mockAssistant), error: null})
        .mockResolvedValueOnce({
  data: null,
  mockConversation), error: null});
      mockRequest.json.mockResolvedValue(webhookData);
      mockBillingService.updateUsage.mockResolvedValue({
  success: null,
  true});
      handleWhatsAppWebhook(mockContext as, any);
      expect(processMessageWithAI).toHaveBeenCalledWith('Hello, I need help'
       , mockAssistant)
  mockConversation);
      expect(mockEvolutionAPI.sendTextMessage).toHaveBeenCalledWith('test-instance', '5511999999999@s.whatsapp.net', 'AI generated response'
    ,  );
      expect(createTenantAwareSupabase).toHaveBeenCalledWith('business-456');
      expect(createBillingService).toHaveBeenCalledWith(mockSupabase);
      expect(mockBillingService.updateUsage).toHaveBeenCalledWith('business-456', 'messages',, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('Message processed, successfully');
    });
    it('should continue processing even if billing update fails', async, () => {
      const webhookData = {;
  instance: 'test-instance';, data: {
  key: {,
  remoteJid: '5511999999999@s.whatsapp.net'}
          message: {,
  conversation: 'Hello, I need help'
};
      const mockAssistant = {;
  id: 'assistant-123';, business_id: 'business-456';
  name: 'Test Assistant';, instructions: 'You are a helpful assistant'};
      const mockConversation = {;
  id: 'conversation-789';, business_id: 'business-456';
  assistant_id: 'assistant-123';, whatsapp_chat_id: '5511999999999@s.whatsapp.net'};
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
  data: null,
  mockAssistant), error: null})
        .mockResolvedValueOnce({
  data: null,
  mockConversation), error: null});
      mockRequest.json.mockResolvedValue(webhookData);
      mockBillingService.updateUsage.mockRejectedValue(new Error('Billing service, unavailable'));
      const consoleSpy = vi.spyOn(console'error').mockImplementation(() => {});
      handleWhatsAppWebhook(mockContext as, any);
      expect(processMessageWithAI).toHaveBeenCalled();
      expect(mockEvolutionAPI.sendTextMessage).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error updating message usage: ',
  , expect.any(Error));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('Message processed, successfully');
      consoleSpy.mockRestore();
    });
    it('should handle missing assistant gracefully', async, () => {
      const webhookData = {;
  instance: 'test-instance';, data: {
  key: {,
  remoteJid: '5511999999999@s.whatsapp.net'}
          message: {,
  conversation: 'Hello, I need help'
};
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
  data: null,
  null), error: {
  message: 'Assistant not found'});
      mockRequest.json.mockResolvedValue(webhookData);
      handleWhatsAppWebhook(mockContext as, any);
      expect(processMessageWithAI).not.toHaveBeenCalled();
      expect(mockEvolutionAPI.sendTextMessage).not.toHaveBeenCalled();
      expect(mockBillingService.updateUsage).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith('Assistant not found for this, instance');
    });
    it('should create new conversation if not exists', async, () => {
      const webhookData = {;
  instance: 'test-instance';, data: {
  key: {,
  remoteJid: '5511999999999@s.whatsapp.net'}
          message: {,
  conversation: 'Hello, I need help'
};
      const mockAssistant = {;
  id: 'assistant-123';, business_id: 'business-456';
  name: 'Test Assistant';, instructions: 'You are a helpful assistant'};
      const mockNewConversation = {;
  id: 'conversation-new';, business_id: 'business-456';
  assistant_id: 'assistant-123';, whatsapp_chat_id: '5511999999999@s.whatsapp.net'};
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
  data: null,
  mockAssistant), error: null})
        .mockResolvedValueOnce({
  data: null,
  null), error: {
  message: 'Conversation not found'});
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
  data: null,
  mockNewConversation), error: null});
      mockRequest.json.mockResolvedValue(webhookData);
      mockBillingService.updateUsage.mockResolvedValue({
  success: null, true});
      handleWhatsAppWebhook(mockContext as, any);
      expect(processMessageWithAI).toHaveBeenCalledWith('Hello, I need help'
       , mockAssistant)
  mockNewConversation);
      expect(mockBillingService.updateUsage).toHaveBeenCalledWith('business-456', 'messages',, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
