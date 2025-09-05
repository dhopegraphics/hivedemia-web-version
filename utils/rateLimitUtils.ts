/**
 * Rate limiting and retry utilities for AI API calls
 */

export interface RateLimitConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
}

export interface RetryOptions extends RateLimitConfig {
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRetries: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Sleep utility function
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (
  attempt: number,
  config: RateLimitConfig
): number => {
  const delay =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
};

/**
 * Check if error is a rate limit error
 */
export const isRateLimitError = (error: any): boolean => {
  if (!error) return false;

  // Check for Claude rate limit errors
  if (
    error.status === 429 ||
    (error.message && error.message.includes("rate_limit_error")) ||
    (error.message && error.message.includes("429"))
  ) {
    return true;
  }

  // Check for other common rate limit indicators
  if (error.code === "RATE_LIMITED" || error.code === "TOO_MANY_REQUESTS") {
    return true;
  }

  return false;
};

/**
 * Check if error is recoverable (should retry)
 */
export const isRecoverableError = (error: any): boolean => {
  // Rate limit errors are recoverable
  if (isRateLimitError(error)) return true;

  // Network errors are recoverable
  if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT") return true;

  // 5xx server errors are recoverable
  if (error.status >= 500 && error.status < 600) return true;

  return false;
};

/**
 * Retry wrapper with exponential backoff for API calls
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...options };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      // Add a small delay before each attempt to prevent overwhelming the API
      if (attempt > 1) {
        const delay = calculateBackoffDelay(attempt - 1, config);

        await sleep(delay);

        if (options.onRetry) {
          options.onRetry(attempt - 1, lastError!);
        }
      }

      return await fn();
    } catch (error) {
      lastError = error as Error;

      // If this is the last attempt, throw the error
      if (attempt === config.maxRetries + 1) {
        throw error;
      }

      // Check if we should retry this error
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(lastError)
        : isRecoverableError(lastError);

      if (!shouldRetry) {
        throw error;
      }

      console.warn(
        `API call failed (attempt ${attempt}), will retry:`,
        (error as Error).message || "Unknown error"
      );
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error("Unknown error in retry logic");
};

/**
 * Rate limiter class to manage API call frequency
 */
export class RateLimiter {
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private resetTime: number = 0;

  constructor(
    private callsPerMinute: number = 10,
    private tokensPerMinute: number = 50000
  ) {}

  /**
   * Wait if necessary to respect rate limits
   */
  async waitIfNeeded(estimatedTokens: number = 1000): Promise<void> {
    const now = Date.now();

    // Reset counters every minute
    if (now - this.resetTime >= 60000) {
      this.callCount = 0;
      this.resetTime = now;
    }

    // Check call frequency
    const timeSinceLastCall = now - this.lastCallTime;
    const minTimeBetweenCalls = 60000 / this.callsPerMinute;

    if (timeSinceLastCall < minTimeBetweenCalls) {
      const waitTime = minTimeBetweenCalls - timeSinceLastCall;

      await sleep(waitTime);
    }

    // Estimate if this call might exceed token limits
    if (estimatedTokens > this.tokensPerMinute / 10) {
      await sleep(3000); // Extra 3 second delay for large requests
    }

    this.lastCallTime = Date.now();
    this.callCount++;
  }
}

/**
 * Global rate limiter instance
 */
export const globalRateLimiter = new RateLimiter();
