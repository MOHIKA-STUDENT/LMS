/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Legacy Device Polyfills & Compatibility Layer
 * Ensures runtime compatibility for older iOS Safari (iOS 12-15) and older Android WebViews.
 */

if (typeof window !== 'undefined') {
  // 1. Polyfill crypto.randomUUID (Chrome < 92, Safari < 15.4)
  if (typeof window.crypto !== 'undefined' && !window.crypto.randomUUID) {
    try {
      window.crypto.randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
        // Prefer crypto.getRandomValues if available
        if (typeof window.crypto.getRandomValues === 'function') {
          const buf = new Uint8Array(16);
          window.crypto.getRandomValues(buf);
          buf[6] = (buf[6] & 0x0f) | 0x40; // RFC4122 version 4
          buf[8] = (buf[8] & 0x3f) | 0x80; // RFC4122 variant
          const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
          return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`;
        }
        // Fallback to Math.random for ancient WebViews
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }) as `${string}-${string}-${string}-${string}-${string}`;
      };
    } catch {
      // Ignore if crypto property is read-only
    }
  }

  // 2. Polyfill Object.hasOwn (Chrome < 93, Safari < 15.4)
  if (!Object.hasOwn) {
    Object.hasOwn = function (obj: object, prop: PropertyKey): boolean {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }

  // 3. Polyfill Array.prototype.at (Chrome < 92, Safari < 15.4)
  if (!Array.prototype.at) {
    Array.prototype.at = function (this: any[], n: number) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this[n];
    };
  }

  // 4. Polyfill structuredClone fallback (Safari < 15.4, Chrome < 98)
  if (typeof window.structuredClone !== 'function') {
    (window as any).structuredClone = function <T>(obj: T): T {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch {
        return obj;
      }
    };
  }

  // 5. Polyfill Promise.withResolvers (Safari < 17.4, Chrome < 119)
  if (typeof (Promise as any).withResolvers !== 'function') {
    (Promise as any).withResolvers = function <T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: any) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

export {};
