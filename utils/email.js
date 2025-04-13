const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (user, token) => {
  const url = `http://localhost:5000/api/auth/verify-email/${token}`;
  await transporter.sendMail({
    to: user.email,
    subject: "Verify Your University Email",
    html: `Please click this link to verify your email: <a href="${url}">${url}</a>`,
  });
};

module.exports = { sendVerificationEmail };
