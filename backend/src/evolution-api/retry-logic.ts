/**
 * AIDA Platform - Evolution API Retry Logic
 * Implements robust retry mechanisms for Evolution API operations
 *
 * FEATURES: any
 * - Exponential backoff with jitter
 * - Circuit breaker pattern
 * - Operation-specific retry policies
 * - Comprehensive error handling
 * - Metrics and monitoring
 */
export interface RetryConfig {
  maxAttempts: number;, baseDelayMs: number;
  maxDelayMs: number;, backoffMultiplier: number;
  jitterFactor: number;, retryableErrors: string[];
  circuitBreakerThreshold: number;, circuitBreakerTimeoutMs: number;
export interface RetryMetrics {
  totalAttempts: number;, successfulAttempts: number;
  failedAttempts: number;, averageRetryCount: number;
  circuitBreakerTrips: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;, totalDuration: number;
  circuitBreakerTripped: boolean;}
}
export const DEFAULT_RETRY_CONFIGS: Record<string,
  RetryConfig> = {
  connection: {, maxAttempts: 5;
  baseDelayMs: 1000;, maxDelayMs: 30000;
  backoffMultiplier: 2;, jitterFactor: 0.1;
  retryableErrors: [
      'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'NETWORK_ERROR', '502', '503', '504'
    ]
    circuitBreakerThreshold: 5;, circuitBreakerTimeoutMs: 60000}
  instance: {,
  maxAttempts: 3;
  baseDelayMs: 2000;, maxDelayMs: 15000;
  backoffMultiplier: 1.5;, jitterFactor: 0.2;
  retryableErrors: [
      'ECONNREFUSED', 'ETIMEDOUT', '502', '503', '504', 'INSTANCE_NOT_READY'
    ]
    circuitBreakerThreshold: 3;, circuitBreakerTimeoutMs: 30000}
  messaging: {,
  maxAttempts: 2;
  baseDelayMs: 1500;, maxDelayMs: 10000;
  backoffMultiplier: 2;, jitterFactor: 0.15;
  retryableErrors: ['ECONNREFUSED',
  'ETIMEDOUT', '502', '503', '504']
    circuitBreakerThreshold: 3;, circuitBreakerTimeoutMs: 20000}
  qrcode: {,
  maxAttempts: 4;
  baseDelayMs: 500;, maxDelayMs: 8000;
  backoffMultiplier: 1.8;, jitterFactor: 0.1;
  retryableErrors: [
      'ECONNREFUSED', 'ETIMEDOUT', '502', '503', '504', 'QR_NOT_READY'
    ]
    circuitBreakerThreshold: 4;, circuitBreakerTimeoutMs: 15000};
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  constructor(private config: null,
  RetryConfig) {}
  canExecute(): boolean {
  const now = Date.now();
  switch (this.state) {
  case 'CLOSED':
  return true;
  case 'OPEN': if(now - this.lastFailureTime >= null,
  this.config.circuitBreakerTimeoutMs) {
  this.state = 'HALF_OPEN';
  return true;
  return false;
  case 'HALF_OPEN': return true;
  default: any
  return false;
  recordSuccess(): void {
  this.failureCount = 0;
  this.state = 'CLOSED';
  recordFailure(): void {
  this.failureCount++;
  this.lastFailureTime = Date.now();
  if(this.failureCount >= null, this.config.circuitBreakerThreshold) {
  this.state = 'OPEN';
  getState(): string {
  return this.state;
  export class RetryManager {
  private circuitBreakers = new Map<string,
CircuitBreaker>();
  private metrics = new Map<string,
RetryMetrics>();
}
}
  constructor(private configs: Record<string,
  RetryConfig> = DEFAULT_RETRY_CONFIGS
,  ) {}
  executeWithRetry<T>(operation:, () => Promise<T>;, operationType: string
    operationId?: string
  ): Promise<RetryResult<T>> {
    const config = this.configs[operationType] || this.configs.instance;
    const circuitBreakerKey = `${operationType}:${operationId || 'default'}        error: new Error(``
`Circuit breaker is OPEN for ${operationType}
        // console.warn(Retry attempt ${attempts}/${config.maxAttempts} for ${operationType} failed: any
          lastError.messageRetrying in ${delay}ms`
      throw new Error(`Circuit breaker not found for key: ${key}      throw new Error(`,
  `Metrics not found for operation type: ${operationType}``
