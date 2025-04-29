const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true
});

const sendVerificationEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"ProCode Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome to ProCode!</h2>
        <p>Your 4-digit verification code is:</p>
        <h3 style="color: #2563eb;">${otp}</h3>
        <p>This code will expire in 10 minutes. Do not share it with anyone.</p>
        <p>If you didn't create an account, you can ignore this email.</p>
      </div>
    `
  });
};

module.exports = { sendVerificationEmail };