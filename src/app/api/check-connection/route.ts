import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const STALE_THRESHOLD_SECONDS = 30;

function buildHtml(disconnectedAt: string): string {
  const logoUrl = process.env.NEXT_PUBLIC_PYROLERT_LOGO_URL;
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Pyrolert Fire Alert Systems" style="display:block; max-width:220px; width:100%; height:auto; margin:0 auto;">`
    : `<h1 style="margin:0; font-size:22px; color:#ffffff; font-weight:700;">Pyrolert</h1>`;

  return `<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background-color:#ffffff; font-family: Arial, sans-serif;">
  <head>
    <meta charset="UTF-8" />
    <title>Pyrolert Device Disconnected</title>
  </head>
  <body style="margin:0; padding:0; background-color:#ffffff; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; padding:32px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:12px; border:1px solid #ececec; overflow:hidden;">
            <tr>
              <td align="center" style="background-color:#b00020; padding:20px 28px;">
                ${logoHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:28px; color:#333333;">
                <h2 style="font-size:20px; font-weight:600; margin:0 0 12px 0; color:#b00020;">Device Connection Lost</h2>
                <p style="font-size:15px; margin:0 0 16px 0; line-height:1.6;">
                  This is an automated notification. The Pyrolert device has not sent data for more than 30 seconds and may be <strong>offline</strong>. Kindly check the device.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:15px; line-height:1.6; margin-bottom:16px;">
                  <tr><td style="padding:6px 0 0; font-weight:700;">Disconnected at:</td></tr>
                  <tr><td style="padding:0 0 6px;">${disconnectedAt}</td></tr>
                </table>
                <p style="font-size:14px; margin:8px 0 0;">Sincerely,<br>Pyrolert Team</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f7f7f7; padding:16px; text-align:center; font-size:12px; color:#888888;">
                Pyrolert &copy; 2026. All Rights Reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendDisconnectEmails(recipients: string[], disconnectedAt: string) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const html = buildHtml(disconnectedAt);
  const subject = `Device Disconnected | ${disconnectedAt}`;

  for (const to of recipients) {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: `The Pyrolert device has not sent data for more than 30 seconds and may be offline.\n\nDisconnected at: ${disconnectedAt}`,
      html,
    });
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret if configured (set in Vercel env vars, not .env locally)
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get latest sensor reading
  const { data: latestReading } = await supabase
    .from('sensor_readings')
    .select('ts')
    .order('ts', { ascending: false })
    .limit(1)
    .single();

  const nowSeconds = Date.now() / 1000;
  const isConnected = latestReading
    ? (nowSeconds - latestReading.ts) < STALE_THRESHOLD_SECONDS
    : false;

  // Get persisted connection state
  const { data: state } = await supabase
    .from('device_connection_state')
    .select('*')
    .eq('id', 1)
    .single();

  const wasConnected = state?.is_connected ?? true;

  // Transition: connected → disconnected
  if (wasConnected && !isConnected) {
    const disconnectedAt = new Date().toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
      hour12: true,
    });

    // Fetch all active user emails
    const { data: usersData } = await supabase
      .from('users')
      .select('email')
      .eq('status', 'active');

    const recipients = (usersData ?? [])
      .map((u: { email: string }) => u.email)
      .filter((email: string) => email && !email.endsWith('@test.pyrolert.com'));

    if (recipients.length > 0) {
      await sendDisconnectEmails(recipients, disconnectedAt);
    }

    await supabase
      .from('device_connection_state')
      .update({
        is_connected: false,
        last_disconnected_at: new Date().toISOString(),
        last_alert_sent_at: new Date().toISOString(),
      })
      .eq('id', 1);

    return NextResponse.json({ status: 'disconnected', emailsSent: recipients.length });
  }

  // Transition: disconnected → connected (reset state)
  if (!wasConnected && isConnected) {
    await supabase
      .from('device_connection_state')
      .update({ is_connected: true })
      .eq('id', 1);

    return NextResponse.json({ status: 'reconnected' });
  }

  return NextResponse.json({ status: isConnected ? 'connected' : 'still_disconnected' });
}
