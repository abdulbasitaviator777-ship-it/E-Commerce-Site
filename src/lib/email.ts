// Email delivery. If SMTP env vars are configured, this would send real mail.
// To keep the app free of paid services and runnable offline, when SMTP is not
// configured we log the verification/reset links to the server console (dev)
// so the flows remain fully testable. This is documented in the README.

const SMTP_CONFIGURED = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER,
);

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${baseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await deliver(
    email,
    "Verify your NovaStore email",
    `Welcome to NovaStore! Confirm your email: ${link}`,
    link,
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await deliver(
    email,
    "Reset your NovaStore password",
    `Reset your password (valid 1 hour): ${link}`,
    link,
  );
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  totalMinor: number,
  currency = "PKR",
): Promise<void> {
  const link = `${baseUrl()}/account/orders/${orderNumber}`;
  const major = (totalMinor / 100).toFixed(2);
  await deliver(
    email,
    `Order ${orderNumber} confirmed`,
    `Thanks for your order! Order ${orderNumber} for ${currency} ${major} is confirmed. Track it: ${link}`,
    link,
  );
}

async function deliver(
  to: string,
  subject: string,
  text: string,
  link: string,
): Promise<void> {
  if (SMTP_CONFIGURED) {
    // A production integration would use nodemailer here. We intentionally do
    // not hard-depend on a mail library; if you configure SMTP, install
    // nodemailer and uncomment the send below.
    // const nodemailer = await import("nodemailer");
    // const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    // await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
    console.info(`[email:SMTP-configured] To ${to}: ${subject} — ${link}`);
    return;
  }
  // Development fallback: surface the link so the flow can be completed locally.
  console.info("\n================= NovaStore email =================");
  console.info(`To:      ${to}`);
  console.info(`Subject: ${subject}`);
  console.info(text);
  console.info("====================================================\n");
}
