/**
 * Result type for functional error handling.
 * Inspired by Rust's Result<T, E> and functional programming patterns.
 * This type represents either a successful operation with data, or a failed operation with an error.
 *
 * @example
 * ```typescript
 * const result = validateInput(userInput);
 * if (result.success) {
 *   console.log(result.data); // Access successful data
 * } else {
 *   console.error(result.error); // Handle error
 * }
 * ```
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Represents a successful operation result.
 * Contains the success flag set to true and the resulting data.
 */
export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Represents a failed operation result.
 * Contains the success flag set to false and the error information.
 */
export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Creates a successful Result instance.
 * Use this function when an operation completes successfully and you want to return the result data.
 *
 * @param data - The successful result data to wrap
 * @returns A Success Result containing the provided data
 *
 * @example
 * ```typescript
 * const success = Ok("Operation completed");
 * console.log(success.success); // true
 * console.log(success.data); // "Operation completed"
 * ```
 */
export const Ok = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

/**
 * Creates a failed Result instance.
 * Use this function when an operation fails and you want to return error information.
 *
 * @param error - The error information to wrap
 * @returns A Failure Result containing the provided error
 *
 * @example
 * ```typescript
 * const failure = Err(new Error("Something went wrong"));
 * console.log(failure.success); // false
 * console.log(failure.error.message); // "Something went wrong"
 * ```
 */
export const Err = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});

/**
 * Checks if a Result represents a successful operation.
 * This function acts as a type guard, allowing TypeScript to narrow the type to Success.
 *
 * @param result - The Result to check
 * @returns True if the result is successful, false otherwise
 *
 * @example
 * ```typescript
 * const result = Ok("success");
 * if (isOk(result)) {
 *   console.log(result.data); // TypeScript knows this is Success<string>
 * }
 * ```
 */
export const isOk = <T, E>(result: Result<T, E>): result is Success<T> => result.success;

/**
 * Checks if a Result represents a failed operation.
 * This function acts as a type guard, allowing TypeScript to narrow the type to Failure.
 *
 * @param result - The Result to check
 * @returns True if the result is a failure, false otherwise
 *
 * @example
 * ```typescript
 * const result = Err(new Error("failed"));
 * if (isErr(result)) {
 *   console.error(result.error); // TypeScript knows this is Failure<Error>
 * }
 * ```
 */
export const isErr = <T, E>(result: Result<T, E>): result is Failure<E> => !result.success;

/**
 * Transforms the success value of a Result using a mapping function.
 * If the Result is an error, it passes through unchanged.
 * This is useful for chaining operations on successful values.
 *
 * @param fn - Function to transform the success value
 * @returns A function that takes a Result and returns a transformed Result
 *
 * @example
 * ```typescript
 * const result = Ok(5);
 * const doubled = map((x: number) => x * 2)(result);
 * // doubled is Ok(10)
 * ```
 */
export const map =
  <T, U, E>(fn: (value: T) => U) =>
  (result: Result<T, E>): Result<U, E> => {
    return isOk(result) ? Ok(fn(result.data)) : result;
  };

/**
 * Transforms the error value of a Result using a mapping function.
 * If the Result is successful, it passes through unchanged.
 * This is useful for converting error types or adding context to errors.
 *
 * @param fn - Function to transform the error value
 * @returns A function that takes a Result and returns a Result with transformed error
 *
 * @example
 * ```typescript
 * const result = Err("simple error");
 * const enhanced = mapErr((err: string) => new Error(err))(result);
 * // enhanced is Err(Error("simple error"))
 * ```
 */
export const mapErr =
  <T, E, F>(fn: (error: E) => F) =>
  (result: Result<T, E>): Result<T, F> => {
    return isErr(result) ? Err(fn(result.error)) : result;
  };

/**
 * Chains multiple Result-returning operations together (also known as flatMap).
 * If the input Result is successful, applies the function to its data.
 * If the input Result is an error, passes it through unchanged.
 *
 * @param fn - Function that takes a success value and returns a new Result
 * @returns A function that takes a Result and returns a chained Result
 *
 * @example
 * ```typescript
 * const result = Ok(5);
 * const chained = chain((x: number) => x > 0 ? Ok(x * 2) : Err("negative"))(result);
 * // chained is Ok(10)
 * ```
 */
export const chain =
  <T, U, E>(fn: (value: T) => Result<U, E>) =>
  (result: Result<T, E>): Result<U, E> => {
    return isOk(result) ? fn(result.data) : result;
  };

/**
 * Extracts the success value from a Result or throws the error.
 * Use this when you're confident the Result is successful, or when you want to propagate errors.
 *
 * @param result - The Result to unwrap
 * @returns The success value if the Result is successful
 * @throws The error if the Result is a failure
 *
 * @example
 * ```typescript
 * const success = Ok("value");
 * console.log(unwrap(success)); // "value"
 *
 * const failure = Err(new Error("oops"));
 * unwrap(failure); // throws Error("oops")
 * ```
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
};

/**
 * Extracts the success value from a Result or returns a default value.
 * This is a safe way to get a value from a Result without throwing errors.
 *
 * @param defaultValue - The value to return if the Result is a failure
 * @returns A function that takes a Result and returns either the success value or the default
 *
 * @example
 * ```typescript
 * const success = Ok("value");
 * console.log(unwrapOr("default")(success)); // "value"
 *
 * const failure = Err(new Error("oops"));
 * console.log(unwrapOr("default")(failure)); // "default"
 * ```
 */
export const unwrapOr =
  <T, E>(defaultValue: T) =>
  (result: Result<T, E>): T => {
    return isOk(result) ? result.data : defaultValue;
  };
