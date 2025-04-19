const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;
  
  await transporter.sendMail({
    from: `"ProCode Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome to ProCode!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" style="color: #2563eb;">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `
  });
};

module.exports = { sendVerificationEmail };