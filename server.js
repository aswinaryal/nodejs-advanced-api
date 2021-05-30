const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('unhandledRejection', (err) => {
  //It's not important to shut down the server and node process when there is unhandledRejection.

  console.log(
    'Unhandled Rejection ❌ !!! Shutting down....',
    err.name,
    err.message
  );
});

process.on('uncaughtException', (err) => {
  //It's important to graceful shut down the server and node process when there is unCaughtException.
  console.log(
    'Uncaught Exception ❌ !!! Shutting down....',
    err.name,
    err.message
  );
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE_URL.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB CONNECTION SUCCESSFUL'))
  .catch((err) => {
    console.log('error while connecting db', err);
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`App running on port ${PORT} `);
});
