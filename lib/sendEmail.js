// lib/sendEmail.js
import nodemailer from 'nodemailer';

export async function sendEmail(to, subject, text) {
  // 1) Create a transporter using your environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,      // e.g. "smtp.gmail.com"
    port: Number(process.env.EMAIL_PORT), // e.g. 587
    secure: false, // For TLS on port 587
    auth: {
      user: process.env.EMAIL_USER,    // e.g. "your_email@gmail.com"
      pass: process.env.EMAIL_PASS     // 16-digit app password from Google
    },
  });

  // 2) Craft the email options
  const mailOptions = {
    from: "noreply@lifeguardingacademy.com", // The email you're sending from
    to,
    subject,
    text
    // You could also do html: "<strong>Hello world!</strong>"
  };

  // 3) Actually send the email
  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent:", info.messageId);
  
  return info;
}