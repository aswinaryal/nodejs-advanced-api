const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const { path, value } = err;
  const message = `Invalid ${path}: ${value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldDB = (err) => {
  const message = `Duplicate field value: ${JSON.stringify(
    err.keyValue
  )}, Please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid data: ${errors.join(', ')}`;
  return new AppError(message, 400);
};
const handleTokenExpiredError = () =>
  new AppError('Token Exipred, Please try again later', 401);

const sendError = (err, res) => {
  //operational, trusted error; send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log('💥 NOT OPERATIONAL ERROR 💥');
    //do not send the error to client, don't leak this error, since unexpected

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};
module.exports = (err, req, res, next) => {
  console.log('ERROR 💥', err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };

  if (err.name === 'CastError') error = handleCastErrorDB(error);
  if (err.code === 11000) error = handleDuplicateFieldDB(error);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

  sendError(error, res);
};
