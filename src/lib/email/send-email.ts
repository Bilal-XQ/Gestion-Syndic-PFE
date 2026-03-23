import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type { ReactElement } from "react";

// Resend replaced by Nodemailer — see swap-resend-to-nodemailer.md

type SendEmailParams = {
  to: string;
  subject: string;
  react: ReactElement;
  from?: string;
};

type SendEmailResult =
  | { success: true }
  | { success: false; error: string };

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendEmail({
  to,
  subject,
  react,
  from,
}: SendEmailParams): Promise<SendEmailResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return {
      success: false,
      error: "Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variable",
    };
  }

  try {
    const html = await render(react);

    await getTransporter().sendMail({
      from: from ?? `Syndic <${gmailUser}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
