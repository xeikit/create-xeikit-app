/**
 * Result type for functional error handling
 * Inspired by Rust's Result<T, E> and functional programming patterns
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Creates a successful Result
 */
export const Ok = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

/**
 * Creates a failed Result
 */
export const Err = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});

/**
 * Checks if a Result is successful
 */
export const isOk = <T, E>(result: Result<T, E>): result is Success<T> => result.success;

/**
 * Checks if a Result is an error
 */
export const isErr = <T, E>(result: Result<T, E>): result is Failure<E> => !result.success;

/**
 * Maps over the success value of a Result
 */
export const map =
  <T, U, E>(fn: (value: T) => U) =>
  (result: Result<T, E>): Result<U, E> => {
    return isOk(result) ? Ok(fn(result.data)) : result;
  };

/**
 * Maps over the error value of a Result
 */
export const mapErr =
  <T, E, F>(fn: (error: E) => F) =>
  (result: Result<T, E>): Result<T, F> => {
    return isErr(result) ? Err(fn(result.error)) : result;
  };

/**
 * Chains Results together (flatMap)
 */
export const chain =
  <T, U, E>(fn: (value: T) => Result<U, E>) =>
  (result: Result<T, E>): Result<U, E> => {
    return isOk(result) ? fn(result.data) : result;
  };

/**
 * Unwraps a Result or throws the error
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
};

/**
 * Unwraps a Result or returns a default value
 */
export const unwrapOr =
  <T, E>(defaultValue: T) =>
  (result: Result<T, E>): T => {
    return isOk(result) ? result.data : defaultValue;
  };
