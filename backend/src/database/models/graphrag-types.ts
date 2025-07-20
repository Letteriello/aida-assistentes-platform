/**
 * TypeScript type definitions for GraphRAG Pipeline
 * Implements Microsoft GraphRAG architecture types
 */

// Core Graph Entities
export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description: string;
  confidence: number;
  sourceDocuments: string[];
  attributes: Record<string, any>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Relationship {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  type: RelationshipType;
  description: string;
  confidence: number;
  sourceDocument: string;
  extractedAt: Date;
  tenantId: string;
}

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[];
}

export interface GraphRelationship {
  id: string;
  type: string;
  sourceNodeId: string;
  targetNodeId: string;
  properties: Record<string, any>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Entity and Relationship Types
export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  CONCEPT = 'CONCEPT',
  PROCESS = 'PROCESS',
  LOCATION = 'LOCATION',
  TECHNOLOGY = 'TECHNOLOGY',
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  POLICY = 'POLICY',
  EVENT = 'EVENT'
}

export enum RelationshipType {
  REPORTS_TO = 'REPORTS_TO',
  WORKS_WITH = 'WORKS_WITH',
  PART_OF = 'PART_OF',
  USES = 'USES',
  CREATES = 'CREATES',
  MANAGES = 'MANAGES',
  OWNS = 'OWNS',
  DEPENDS_ON = 'DEPENDS_ON',
  INFLUENCES = 'INFLUENCES',
  RELATED_TO = 'RELATED_TO',
  IMPLEMENTS = 'IMPLEMENTS',
  SERVES = 'SERVES'
}

// Community Structure
export interface Community {
  id: string;
  level: number;
  entities: string[];
  summary: string;
  keywords: string[];
  coherenceScore: number;
  parentCommunity?: string;
  childCommunities: string[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunitySummary {
  communityId: string;
  theme: string;
  summary: string;
  keywords: string[];
  entityCount: number;
  coherenceScore: number;
  businessSignificance: string;
}

export interface CommunityInsight {
  communityId: string;
  insight: string;
  relevanceScore: number;
  supportingEntities: string[];
}

// Query Processing
export interface QueryContext {
  originalQuery: string;
  recognizedEntities: string[];
  queryType: QueryType;
  complexity: QueryComplexity;
  requiredHops: number;
  intent: QueryIntent;
}

export enum QueryType {
  FACTUAL = 'FACTUAL',
  RELATIONAL = 'RELATIONAL',
  ANALYTICAL = 'ANALYTICAL',
  EXPLORATORY = 'EXPLORATORY',
  COMPARATIVE = 'COMPARATIVE'
}

export enum QueryComplexity {
  SIMPLE = 'SIMPLE',
  MODERATE = 'MODERATE',
  COMPLEX = 'COMPLEX',
  MULTI_HOP = 'MULTI_HOP'
}

export enum QueryIntent {
  INFORMATION_SEEKING = 'INFORMATION_SEEKING',
  RELATIONSHIP_DISCOVERY = 'RELATIONSHIP_DISCOVERY',
  PATTERN_ANALYSIS = 'PATTERN_ANALYSIS',
  DECISION_SUPPORT = 'DECISION_SUPPORT'
}

// Retrieval Results
export interface GraphTraversalResult {
  entities: Entity[];
  relationships: Relationship[];
  paths: GraphPath[];
  traversalMetrics: TraversalMetrics;
}

export interface GraphPath {
  startEntity: string;
  endEntity: string;
  relationships: string[];
  hopCount: number;
  averageConfidence: number;
  pathRelevance: number;
}

export interface TraversalMetrics {
  nodesVisited: number;
  relationshipsTraversed: number;
  maxDepthReached: number;
  executionTimeMs: number;
  cacheHits: number;
}

export interface VectorSearchResult {
  results: VectorSearchMatch[];
  totalMatches: number;
  executionTimeMs: number;
}

export interface VectorSearchMatch {
  documentId: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  entityMentions: string[];
}

export interface CommunitySearchResult {
  communities: Community[];
  summaries: CommunitySummary[];
  relevanceScores: number[];
}

export interface RetrievalResult {
  graphResults: GraphTraversalResult;
  vectorResults: VectorSearchResult;
  communityResults: CommunitySearchResult;
  aggregatedContext: string;
  confidence: number;
  sources: SourceReference[];
  retrievalMetrics: RetrievalMetrics;
}

export interface RetrievalMetrics {
  totalExecutionTimeMs: number;
  graphRetrievalTimeMs: number;
  vectorRetrievalTimeMs: number;
  communityRetrievalTimeMs: number;
  contextAggregationTimeMs: number;
  sourceCount: number;
  tokenCount: number;
}

// Response Generation
export interface GraphRAGResponse {
  answer: string;
  confidence: number;
  provenance: ProvenanceChain[];
  reasoning: ReasoningStep[];
  sources: SourceReference[];
  graphPaths: GraphPath[];
  communityInsights: CommunityInsight[];
  responseMetrics: ResponseMetrics;
}

export interface ProvenanceChain {
  claim: string;
  sources: SourceReference[];
  confidence: number;
  derivationPath: string[];
}

export interface ReasoningStep {
  step: string;
  sources: string[];
  confidence: number;
  reasoning: string;
  graphEvidence?: GraphEvidence;
}

export interface GraphEvidence {
  supportingEntities: string[];
  supportingRelationships: string[];
  evidenceStrength: number;
}

export interface SourceReference {
  id: string;
  type: SourceType;
  content: string;
  confidence: number;
  relevanceScore: number;
  metadata: SourceMetadata;
}

export enum SourceType {
  DOCUMENT = 'DOCUMENT',
  GRAPH_PATH = 'GRAPH_PATH',
  COMMUNITY_SUMMARY = 'COMMUNITY_SUMMARY',
  ENTITY_DESCRIPTION = 'ENTITY_DESCRIPTION',
  RELATIONSHIP = 'RELATIONSHIP'
}

export interface SourceMetadata {
  documentId?: string;
  documentTitle?: string;
  pageNumber?: number;
  section?: string;
  author?: string;
  createdAt?: Date;
  entityIds?: string[];
  communityId?: string;
}

export interface ResponseMetrics {
  generationTimeMs: number;
  tokenCount: number;
  sourceCount: number;
  provenanceCount: number;
  reasoningSteps: number;
  confidenceDistribution: number[];
}

// Entity Extraction
export interface EntityExtractionResult {
  entities: Entity[];
  relationships: Relationship[];
  confidence: number;
  extractionMetrics: ExtractionMetrics;
}

export interface ExtractionMetrics {
  executionTimeMs: number;
  entitiesExtracted: number;
  relationshipsExtracted: number;
  averageConfidence: number;
  processingTokens: number;
}

export interface ExtractionJob {
  id: string;
  documentId: string;
  status: ExtractionJobStatus;
  entitiesExtracted: number;
  relationshipsExtracted: number;
  communitiesDetected: number;
  errorMessage?: string;
  tenantId: string;
  createdAt: Date;
  completedAt?: Date;
}

export enum ExtractionJobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Context Building
export interface ContextSection {
  type: ContextSectionType;
  content: string;
  priority: number;
  tokens: number;
  sources: SourceReference[];
}

export enum ContextSectionType {
  COMMUNITY = 'community',
  GRAPH = 'graph',
  VECTOR = 'vector',
  METADATA = 'metadata'
}

export interface ContextBuilder {
  maxTokens: number;
  currentTokens: number;
  sections: ContextSection[];
}

// Community Detection
export interface CommunityDetectionResult {
  communities: Community[];
  hierarchicalStructure: CommunityHierarchy;
  detectionMetrics: CommunityDetectionMetrics;
}

export interface CommunityHierarchy {
  levels: number;
  communities: Map<number, Community[]>;
  parentChildRelations: Map<string, string[]>;
}

export interface CommunityDetectionMetrics {
  executionTimeMs: number;
  communitiesDetected: number;
  averageCoherence: number;
  modularityScore: number;
  resolutionParameter: number;
}

// Cache Management
export interface CacheEntry {
  key: string;
  value: any;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageResponseTime: number;
  totalEntries: number;
  memoryUsage: number;
}

// API Interfaces
export interface GraphRAGQueryRequest {
  query: string;
  options?: {
    includeProvenance?: boolean;
    maxHops?: number;
    communityLevel?: number;
    hybridWeight?: number; // 0-1, weight between graph and vector
    minConfidence?: number;
    maxSources?: number;
  };
}

export interface GraphRAGQueryResponse extends GraphRAGResponse {
  queryId: string;
  executionTimeMs: number;
  warnings?: string[];
}

export interface GraphExplorationRequest {
  entityId: string;
  maxHops?: number;
  minConfidence?: number;
  includeRelationshipDetails?: boolean;
}

export interface GraphExplorationResponse {
  centerEntity: Entity;
  connectedEntities: Entity[];
  relationships: Relationship[];
  communityContext: CommunitySummary[];
  explorationMetrics: ExplorationMetrics;
}

export interface ExplorationMetrics {
  nodesExplored: number;
  relationshipsFound: number;
  communitiesIdentified: number;
  executionTimeMs: number;
}

// Analytics and Monitoring
export interface GraphRAGAnalytics {
  performanceMetrics: PerformanceMetrics;
  qualityMetrics: QualityMetrics;
  usageMetrics: UsageMetrics;
  systemMetrics: SystemMetrics;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughputQPS: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface QualityMetrics {
  averageConfidence: number;
  provenanceAccuracy: number;
  userSatisfactionScore: number;
  answerCompleteness: number;
  factualAccuracy: number;
}

export interface UsageMetrics {
  dailyQueries: number;
  uniqueUsers: number;
  popularQueryTypes: QueryType[];
  mostAccessedEntities: string[];
  averageQueryComplexity: number;
}

export interface SystemMetrics {
  graphSize: {
    nodeCount: number;
    relationshipCount: number;
    communityCount: number;
  };
  resourceUsage: {
    memoryUsage: number;
    cpuUtilization: number;
    tokenConsumption: number;
    storageUsage: number;
  };
  healthStatus: SystemHealthStatus;
}

export enum SystemHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  ERROR = 'error'
}

// Configuration
export interface GraphRAGConfig {
  extraction: {
    batchSize: number;
    maxConcurrency: number;
    confidenceThreshold: number;
    retryAttempts: number;
  };
  traversal: {
    defaultMaxHops: number;
    defaultMinConfidence: number;
    cacheExpirationMinutes: number;
    maxTraversalNodes: number;
  };
  community: {
    minCommunitySize: number;
    resolutionParameter: number;
    hierarchyLevels: number;
    summaryTokenLimit: number;
  };
  retrieval: {
    maxSources: number;
    contextTokenLimit: number;
    hybridWeight: number;
    vectorSimilarityThreshold: number;
  };
  performance: {
    maxExecutionTimeMs: number;
    memoryLimitMB: number;
    cacheEnabled: boolean;
    monitoringEnabled: boolean;
  };
}

// Error Types
export class GraphRAGError extends Error {
  constructor(
    public code: GraphRAGErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GraphRAGError';
  }
}

export enum GraphRAGErrorCode {
  ENTITY_EXTRACTION_FAILED = 'ENTITY_EXTRACTION_FAILED',
  GRAPH_TRAVERSAL_FAILED = 'GRAPH_TRAVERSAL_FAILED',
  COMMUNITY_DETECTION_FAILED = 'COMMUNITY_DETECTION_FAILED',
  CONTEXT_AGGREGATION_FAILED = 'CONTEXT_AGGREGATION_FAILED',
  RESPONSE_GENERATION_FAILED = 'RESPONSE_GENERATION_FAILED',
  INVALID_QUERY = 'INVALID_QUERY',
  TIMEOUT = 'TIMEOUT',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

// Utility Types
export type EntityMap = Map<string, Entity>;
export type RelationshipMap = Map<string, Relationship>;
export type CommunityMap = Map<string, Community>;

export interface GraphRAGContext {
  tenantId: string;
  userId?: string;
  sessionId?: string;
  requestId: string;
  timestamp: Date;
  config: GraphRAGConfig;
}

export interface GraphRAGResult<T> {
  success: boolean;
  data?: T;
  error?: GraphRAGError;
  metrics?: any;
  warnings?: string[];
}