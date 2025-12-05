import express from "express";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());

// --- CONFIGURE YOUR GMAIL ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kumarst5214@gmail.com",      // SENDER Gmail
    pass: "tvrk lnza eaia bdyf",        // App Password ONLY
  },
});

// --- ROUTE TO SEND MAIL ---
app.post("/send-mail", async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: "to, subject, text are required" });
  }

  try {
    const info = await transporter.sendMail({
      from: "kumarst5214@gmail.com",   // MUST match auth user
      to, 
      subject,
      text,
    });

    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send email", details: err.message });
  }
});

// --- START SERVER ---
app.listen(3000, () => console.log("Server running on port 3000"));
