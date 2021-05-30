class AppError extends Error {
  constructor(message, statusCode) {
    super();
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
    this.message = message;

    //we set all AppError object as isOperational set to true
    this.isOperational = true;
  }
}

module.exports = AppError;
