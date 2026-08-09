import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxAttempts?: number;
  delay?: number;
  onRetry?: (attempt: number) => void;
}

export function useRetry(options: UseRetryOptions = {}) {
  const { maxAttempts = 3, delay = 1000, onRetry } = options;
  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      if (attempt >= maxAttempts) {
        throw new Error(`Max retry attempts (${maxAttempts}) exceeded`);
      }

      setIsRetrying(true);
      
      try {
        const result = await fn();
        setAttempt(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        setAttempt((prev) => prev + 1);
        
        if (attempt + 1 >= maxAttempts) {
          setIsRetrying(false);
          throw error;
        }

        if (onRetry) {
          onRetry(attempt + 1);
        }

        await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
        setIsRetrying(false);
        return retry(fn);
      }
    },
    [attempt, maxAttempts, delay, onRetry]
  );

  const reset = useCallback(() => {
    setAttempt(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    attempt,
    isRetrying,
    canRetry: attempt < maxAttempts,
  };
}
