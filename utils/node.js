export function next(obj) {
  return {
    __type: "next",
    ...obj,
  };
}

export function repeat(obj) {
  return {
    __type: "repeat",
    ...obj,
  };
}

export class DataError extends Error {
  code = "DATA_ERROR";
  constructor(message, details = {}) {
    super(message);
    this.details = details;
  }
}

export class FatalError extends Error {
  code = "FATAL_ERROR";
  constructor(message) {
    super(message);
  }
}

export class TimeoutError extends Error {
  code = "TIMEOUT_ERROR";
  constructor(message) {
    super(message);
  }
}

export const throwError = {
  data: (message, details = {}) => {
    throw new DataError(message, details);
  },
  fatal: (message) => {
    throw new FatalError(message);
  },
  timeout: (message) => {
    throw new TimeoutError(message);
  },
};
