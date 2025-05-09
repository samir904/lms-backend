// import nodemailer from "nodemailer"
// import dotenv from "dotenv";
// dotenv.config();
// //async await is not allowed in global scope ,must use wrapper
// const sendEmail=async function (email,subject,message) {
//     //create reusable transporter object using the default smtp transport
//     let transporter=nodemailer.createTransport({
//         host:process.env.SMTP_HOST,
//         port:process.env.SMTP_PORT,
//         secure:false,//true for 465,false for other ports
//         auth:{
//             user:process.env.SMTP_USERNAME,
//             pass:process.env.SMTP_PASSWORD,
//         }
//     })

//     //SEND mail with defined transport object
//     await transporter.sendMail({
//         from:process.env.SMTP_FROM_EMAIL,//SENDER ADDRESS
//         to:email,//user email
//         subject:subject,//suject line
//         html:message,//html body
//     })
// }

// export default sendEmail;
 

//********************/
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import validator from "validator";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
  "SMTP_FROM_EMAIL",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Debug environment variables
console.log({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  username: process.env.SMTP_USERNAME,
  from: process.env.SMTP_FROM_EMAIL,
});

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === "465", // false for 587
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  pool: true,
  maxConnections: 5,
});

// Verify SMTP connection at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP verification failed:", {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack,
    });
  } else {
    console.log("SMTP transporter ready");
  }
});

// Send email function
const sendEmail = async (email, subject, message) => {
  try {
    // Validate inputs
    if (!email || !validator.isEmail(email)) {
      throw new Error("Invalid or missing email address");
    }
    if (!subject || typeof subject !== "string" || subject.trim() === "") {
      throw new Error("Invalid or missing subject");
    }
    if (!message || typeof message !== "string" || message.trim() === "") {
      throw new Error("Invalid or missing message");
    }

    // Debug email details
    console.log("Sending email:", { to: email, subject });

    // Send email
    const info = await transporter.sendMail({
      from: `"LMS Support" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: message,
      text: message.replace(/<[^>]+>/g, ""),
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send email:", {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
      stack: error.stack,
    });
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

export default sendEmail;

/*
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import validator from "validator";

// Load environment variables
dotenv.config();

// Check required environment variables
const envVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"];
envVars.forEach((varName) => {
  if (!process.env[varName]) throw new Error(`Missing ${varName}`);
});

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify SMTP connection
transporter.verify((error) => {
  console.log(error ? `SMTP Error: ${error.message}` : "SMTP Ready");
});

// Send email function
const sendEmail = async (email, subject, message) => {
  try {
    // Validate inputs
    if (!validator.isEmail(email)) throw new Error("Invalid email");
    if (!subject || !message) throw new Error("Missing subject or message");

    // Send email
    const info = await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject,
      html: message,
      text: message.replace(/<[^>]+>/g, ""),
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email failed:", error.message);
    throw error;
  }
};

export default sendEmail;*/