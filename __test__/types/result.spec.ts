import type { Result } from '@/types/result';
import { Err, Ok, chain, isErr, isOk, map, mapErr, unwrap, unwrapOr } from '@/types/result';
import { describe, expect, test } from 'vitest';

describe('Result type utilities', () => {
  describe('Ok and Err constructors', () => {
    test('Ok creates a successful result', () => {
      const result = Ok(42);

      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });

    test('Err creates a failed result', () => {
      const error = new Error('test error');
      const result = Err(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe('isOk and isErr type guards', () => {
    test('isOk correctly identifies successful results', () => {
      const success = Ok(42);
      const failure = Err('error');

      expect(isOk(success)).toBe(true);
      expect(isOk(failure)).toBe(false);
    });

    test('isErr correctly identifies error results', () => {
      const success = Ok(42);
      const failure = Err('error');

      expect(isErr(success)).toBe(false);
      expect(isErr(failure)).toBe(true);
    });
  });

  describe('map function', () => {
    test('maps over successful result', () => {
      const result = Ok(42);
      const mapped = map((x: number) => x * 2)(result);

      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.data).toBe(84);
      }
    });

    test('does not map over error result', () => {
      const result = Err('error');
      const mapped = map((x: number) => x * 2)(result);

      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe('error');
      }
    });
  });

  describe('mapErr function', () => {
    test('maps over error result', () => {
      const result = Err('original error');
      const mapped = mapErr((err: string) => `mapped: ${err}`)(result);

      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe('mapped: original error');
      }
    });

    test('does not map over successful result', () => {
      const result = Ok(42);
      const mapped = mapErr((err: string) => `mapped: ${err}`)(result);

      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.data).toBe(42);
      }
    });
  });

  describe('chain function', () => {
    test('chains successful operations', () => {
      const result = Ok(42);
      const chained = chain((x: number) => Ok(x.toString()))(result);

      expect(isOk(chained)).toBe(true);
      if (isOk(chained)) {
        expect(chained.data).toBe('42');
      }
    });

    test('stops chaining on error', () => {
      const result = Err('error');
      const chained = chain((x: number) => Ok(x.toString()))(result);

      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect(chained.error).toBe('error');
      }
    });

    test('propagates error from chained operation', () => {
      const result = Ok(42);
      const chained = chain((x: number) => Err(`error with ${x}`))(result);

      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect(chained.error).toBe('error with 42');
      }
    });
  });

  describe('unwrap function', () => {
    test('unwraps successful result', () => {
      const result = Ok(42);
      const value = unwrap(result);

      expect(value).toBe(42);
    });

    test('throws error for failed result', () => {
      const error = new Error('test error');
      const result = Err(error);

      expect(() => unwrap(result)).toThrow(error);
    });
  });

  describe('unwrapOr function', () => {
    test('unwraps successful result', () => {
      const result = Ok(42);
      const value = unwrapOr(0)(result);

      expect(value).toBe(42);
    });

    test('returns default value for failed result', () => {
      const result = Err('error');
      const value = unwrapOr(0)(result);

      expect(value).toBe(0);
    });
  });

  describe('composition and chaining', () => {
    test('can compose multiple operations successfully', () => {
      const doubleIfValid = (x: number): Result<number, string> => (x > 0 ? Ok(x * 2) : Err('negative number'));

      const numberToString = (x: number): Result<string, string> => Ok(x.toString());

      const initial = Ok(5);
      const step1 = chain(doubleIfValid)(initial);
      const result = chain(numberToString)(step1);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe('10');
      }
    });

    test('stops on first error in composition', () => {
      const doubleIfValid = (x: number): Result<number, string> => (x > 5 ? Ok(x * 2) : Err('too small'));

      const numberToString = (x: number): Result<string, string> => Ok(x.toString());

      const initial = Ok(2);
      const step1 = chain(doubleIfValid)(initial);
      const result = chain(numberToString)(step1);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('too small');
      }
    });
  });
});
