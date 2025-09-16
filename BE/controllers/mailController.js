const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Gửi email
export const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: `"No Reply" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email: %s", error);
        return { success: false, error: error.message };
    }
};

