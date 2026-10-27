import { Resend } from "resend";
import { env } from "./config";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  if (resendInstance) return resendInstance;
  if (env.isResendConfigured()) {
    resendInstance = new Resend(env.RESEND_API_KEY);
    return resendInstance;
  }
  return null;
}

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<{ success: boolean; id?: string; error?: string; devMode?: boolean }> {
  const client = getResendClient();

  if (!client) {
    // In local development before user adds Resend API Key, log clearly and return dev preview flag
    console.warn(`[Flowtake Auth DEV MODE] No RESEND_API_KEY set. In production, OTP would be sent to: ${toEmail}. Simulating delivery.`);
    return {
      success: true,
      devMode: true,
      id: "simulated_dev_id",
    };
  }

  try {
    const { data, error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to: [toEmail],
      subject: `Your Flowtake verification code is ${otpCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Flowtake Verification Code</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0e14; color: #f3f4f6; margin: 0; padding: 40px 20px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background: #131722; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <tr>
              <td style="padding: 32px 32px 20px 32px; text-align: center;">
                <div style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(135deg, #6366f1, #06b6d4); border-radius: 12px; line-height: 44px; color: #ffffff; font-weight: bold; font-size: 22px; margin-bottom: 12px;">F</div>
                <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.02em;">Flowtake Authentication</h1>
                <p style="color: #94a3b8; font-size: 14px; margin: 0;">Sign in to your Flowtake account</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 32px; text-align: center;">
                <p style="color: #cbd5e1; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                  Use this single-use code to complete your login. This code will expire in <strong>5 minutes</strong>.
                </p>
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 18px; letter-spacing: 10px; font-size: 32px; font-weight: 800; color: #38bdf8; font-family: monospace; display: inline-block; min-width: 220px; text-align: center;">
                  ${otpCode}
                </div>
                <p style="color: #64748b; font-size: 12px; margin: 24px 0 0 0; line-height: 18px;">
                  If you didn't request this code, you can safely ignore this email. Never share this code with anyone.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                <p style="color: #475569; font-size: 11px; margin: 0;">
                  Protected by Flowtake Secure Auth &bull; Shared session with Flowtake Flutter App
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Send email error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[Resend] Failed to send email:", message);
    return { success: false, error: message };
  }
}
