import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (toEmail: string, bodyContent: string) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: "Your Upcoming Festival Social Media Post Idea",
    text: bodyContent,
    html: `<div>${bodyContent}</div>`,
  };

  await transporter.sendMail(mailOptions);
};
