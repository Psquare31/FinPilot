import nodemailer from "nodemailer";
import env from "../env/index.js";

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: env.SMTP_EMAIL,
    pass: env.SMTP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Mail Service Error:", error);
  } else {
    console.log("Mail Service Connected");
  }
});

export default transporter;