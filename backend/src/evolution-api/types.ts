/**
 * AIDA Platform - Evolution API Types
 * TypeScript interfaces for Evolution API responses
 *
 * Based on Evolution API documentation and actual response patterns
 */
// Base response structure
export interface EvolutionAPIResponse<T = any> {;
  status: number;
  message?: string;
  data?: T;
  // Health check response
  export interface HealthCheckResponse {
  status: number;, message: string;
  version: string;
  clientName?: string;
  manager?: string;
  documentation?: string;
  swagger?: string;
}
}
// Instance management types
export interface InstanceCreateResponse {
  instance: {,
  instanceName: string;
  status: 'created';}
  };
  hash?: {
  apikey: string;};
  webhook?: {
  webhook: string;, events: string[];};
  qrcode?: {
  code: string;, base64: string;};
export interface InstanceConnectionResponse {
  instance: {,
  instanceName: string;
  state: 'open' | 'close' | 'connecting' | 'qr';}
  };
export interface InstanceStatusResponse {
  instance: {,
  instanceName: string;
  state: 'open' | 'close' | 'connecting' | 'qr';}
  };
export interface QRCodeResponse {
  base64: string;, code: string;
  count: number;}
}
export interface InstanceDeleteResponse {
  status: 'SUCCESS' | 'ERROR';, response: {
  message: string;}
  };
// Message types
export interface MessageSendResponse {
  key: {,
  remoteJid: string;
  fromMe: boolean;, id: string;}
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
  text: string;};
  };
  messageTimestamp: number;, status: 'SUCCESS' | 'ERROR';
export interface MediaMessageData {
  mediatype: 'image' | 'video' | 'audio' | 'document';, media: string; // base64 or URL,
  fileName?: string;
  caption?: string;
}
}
// Webhook types
export interface WebhookSetResponse {
  webhook: {,
  instanceName: string;
  webhook: string;, events: string[];}
  };
export interface WebhookFindResponse {
  enabled: boolean;, url: string;
  webhookByEvents: boolean;, events: string[];}
}
// Instance settings types
export interface InstanceSettingsResponse {
  instanceName: string;, owner: string;
  profileName?: string;
  profilePictureUrl?: string;
  status: string;, serverUrl: string;
  apikey: string;
  webhook?: {
  webhook: string;, events: string[];}
  };
export interface InstanceUpdateData {
  instanceName?: string;
  webhook?: {
  url: string;, events: string[];}
  };
  settings?: {
  reject_call: boolean;, msg_call: string;
  groups_ignore: boolean;, always_online: boolean;
  read_messages: boolean;, read_status: boolean;};
// Error response type
export interface EvolutionAPIError {
  status: number;, message: string;
  error?: string;
  details?: unknown;
}
}
// Instance fetch response
export interface InstanceFetchResponse {
  instanceName: string;, owner: string;
  profileName?: string;
  profilePictureUrl?: string;
  status: 'open' | 'close' | 'connecting';, serverUrl: string;
  apikey: string;
  webhook?: {
  webhook: string;, events: string[];}
  };
// Batch instances response
export interface InstancesFetchResponse {
  instances: InstanceFetchResponse[];
  // Contact types
  export interface ContactData {
  fullName: string;, wuid: string;
  phoneNumber: string;
  // Group types
  export interface GroupData {
  id: string;, subject: string;
  subjectOwner?: string;
  subjectTime?: number;
  creation?: number;
  owner?: string;
  desc?: string;
  descId?: string;
  restrict?: boolean;
  announce?: boolean;
  participants: GroupParticipant[];
  export interface GroupParticipant {
  id: string;
  admin?: 'admin' | 'superadmin' | null;
}
}
// Chat types
export interface ChatData {
  id: string;
  name?: string;
  isGroup: boolean;
  unreadCount?: number;
  lastMessage?: {
  key: {,
  remoteJid: string;
  fromMe: boolean;, id: string;}
  };
    message: unknown;, messageTimestamp: number;};
// Presence types
export interface PresenceData {
  id: string;, presences: Record<;
  string
  {
  lastKnownPresence: 'available' | 'unavailable' | 'composing' | 'recording';
  lastSeen?: number;
  >;
  // Union types for common responses
  export type InstanceOperationResponse = | InstanceCreateResponse;
  | InstanceConnectionResponse
  | InstanceDeleteResponse;
  export type MessageResponse = MessageSendResponse;
  export type WebhookResponse = WebhookSetResponse | WebhookFindResponse;
  export type SettingsResponse = InstanceSettingsResponse | InstancesFetchResponse;
}
}
