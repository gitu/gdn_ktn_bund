/**
 * Performance Utilities
 * 
 * Utilities for optimizing performance including memoization, debouncing,
 * and expensive operation caching.
 */

import { OPTIMIZATION_CONSTANTS } from '@/constants/optimization'

/**
 * Simple memoization cache with TTL support
 */
class MemoCache<K, V> {
  private cache = new Map<string, { value: V; timestamp: number }>()
  private readonly ttl: number

  constructor(ttlMs: number = OPTIMIZATION_CONSTANTS.CACHE_EXPIRY_MS) {
    this.ttl = ttlMs
  }

  private generateKey(key: K): string {
    return typeof key === 'string' ? key : JSON.stringify(key)
  }

  get(key: K): V | undefined {
    const stringKey = this.generateKey(key)
    const entry = this.cache.get(stringKey)
    
    if (!entry) return undefined
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(stringKey)
      return undefined
    }
    
    return entry.value
  }

  set(key: K, value: V): void {
    const stringKey = this.generateKey(key)
    this.cache.set(stringKey, {
      value,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * Memoize expensive functions with TTL cache
 */
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  ttlMs?: number
): (...args: Args) => Return {
  const cache = new MemoCache<Args, Return>(ttlMs)
  
  return (...args: Args): Return => {
    const cached = cache.get(args)
    if (cached !== undefined) {
      return cached
    }
    
    const result = fn(...args)
    cache.set(args, result)
    return result
  }
}

/**
 * Memoize async functions with TTL cache
 */
export function memoizeAsync<Args extends unknown[], Return>(
  fn: (...args: Args) => Promise<Return>,
  ttlMs?: number
): (...args: Args) => Promise<Return> {
  const cache = new MemoCache<Args, Return>(ttlMs)
  const pendingCache = new Map<string, Promise<Return>>()
  
  return async (...args: Args): Promise<Return> => {
    const key = JSON.stringify(args)
    
    // Check for cached result
    const cached = cache.get(args)
    if (cached !== undefined) {
      return cached
    }
    
    // Check for pending request
    const pending = pendingCache.get(key)
    if (pending) {
      return pending
    }
    
    // Execute and cache
    const promise = fn(...args)
    pendingCache.set(key, promise)
    
    try {
      const result = await promise
      cache.set(args, result)
      return result
    } finally {
      pendingCache.delete(key)
    }
  }
}

/**
 * Debounce function calls
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number = OPTIMIZATION_CONSTANTS.DEBOUNCE_DELAY_MS
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Args): void => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }
}

/**
 * Throttle function calls
 */
export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  intervalMs: number
): (...args: Args) => void {
  let lastCall = 0
  
  return (...args: Args): void => {
    const now = Date.now()
    if (now - lastCall >= intervalMs) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Measure and log performance of operations
 */
export function measurePerformance<T>(
  operation: () => T,
  operationName: string
): T {
  const start = performance.now()
  const result = operation()
  const duration = performance.now() - start
  
  if (import.meta.env.DEV) {
    console.log(`Performance: ${operationName} took ${duration.toFixed(2)}ms`)
  }
  
  return result
}

/**
 * Measure async operations
 */
export async function measurePerformanceAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = performance.now()
  const result = await operation()
  const duration = performance.now() - start
  
  if (import.meta.env.DEV) {
    console.log(`Performance: ${operationName} took ${duration.toFixed(2)}ms`)
  }
  
  return result
}

/**
 * Batch operations to reduce frequency of expensive calls
 */
export class BatchProcessor<T> {
  private batch: T[] = []
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  
  constructor(
    private processor: (items: T[]) => void,
    private batchSize: number = 10,
    private maxWaitMs: number = 100
  ) {}
  
  add(item: T): void {
    this.batch.push(item)
    
    if (this.batch.length >= this.batchSize) {
      this.flush()
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.maxWaitMs)
    }
  }
  
  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    
    if (this.batch.length > 0) {
      const items = [...this.batch]
      this.batch = []
      this.processor(items)
    }
  }
}

// Pre-configured common caches
export const municipalityNameCache = new MemoCache<string, string>()
export const entityDisplayNameCache = new MemoCache<string, string>()