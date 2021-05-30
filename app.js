const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mognoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//1. Middlewares

//set security http headers
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit requests from same API and IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour',
});

app.use('/api', limiter);

// BoydParser, reading data from body req.body
app.use(express.json({ limit: '10kb' }));

//Data sanitization against NoSQL query injection
//now operators like $ and . won't work
//  for eg: {
//     "email": {"$gt":""},
//     "password": "password@123"
// }
// if the first document password matched, we can get success login response without knowing email address in here

app.use(mognoSanitize());

//Data sanitization against Xss
// prevents from malicious html code
app.use(xss());

//Prvent http parameter pollution
//removes duplicate queryparams and resolves to last one only.
// for eg: {{url}}/api/v1/tours?sort=duration&sort=price, only sorted by price, not by duration.
app.use(
  hpp({
    //whitelisting duration so that multiple queryParams for duration works.
    whitelist: [
      'duration',
      'ratingsQuantity',
      'average',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//serving static files
app.use(express.static(`${__dirname}/public`));

//2. Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
