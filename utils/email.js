const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('send email function called', options);
  // 1. Create a transporter

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Define the email options

  const mailOptions = {
    from: 'Natours Dev <natours@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Actually send the email with nodemailer

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
