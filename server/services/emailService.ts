import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

let transporter: Transporter | null = null

function getTransporter() {
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || '587')
    const isPort25 = port === 25

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.lasseharm.space',
      port: port,
      secure: process.env.SMTP_SECURE === 'true',
      // Port 25 for internal relay typically doesn't need auth
      auth: isPort25 ? undefined : {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // TLS configuration for internal Docker network communication
      tls: {
        // Accept self-signed certificates and hostname mismatches for internal mail server
        rejectUnauthorized: false
      },
      // Add timeout and better error handling
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    })
  }
  return transporter
}

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@lasseharm.space'
const FROM_NAME = 'Katachi'
const APP_URL = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendBoardShareInvitation(
  toEmail: string,
  boardId: string,
  boardName: string,
  inviterName: string,
  permission: string
) {
  const transporter = getTransporter()
  const boardUrl = `${APP_URL}?board=${boardId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Katachi 形</h1>
    </div>
    <div class="content">
      <h2>You've been invited to collaborate!</h2>
      <p><strong>${inviterName}</strong> has shared a board with you on Katachi.</p>

      <p><strong>Board:</strong> ${boardName}</p>
      <p><strong>Permission:</strong> ${permission}</p>

      <p>Click the button below to view the board:</p>

      <a href="${boardUrl}" class="button">Open Board</a>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        If you don't have an account yet, you'll be prompted to create one.
      </p>
    </div>
    <div class="footer">
      <p>Katachi - Visual Workspace</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: toEmail,
    subject: `${inviterName} invited you to collaborate on "${boardName}"`,
    html
  })
}

export async function sendEmailVerification(toEmail: string, verificationToken: string) {
  const transporter = getTransporter()
  const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Katachi 形</h1>
    </div>
    <div class="content">
      <h2>Verify Your Email</h2>
      <p>Welcome to Katachi! Please verify your email address to complete your registration.</p>

      <a href="${verificationUrl}" class="button">Verify Email Address</a>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <code style="background: #e5e7eb; padding: 8px; display: inline-block; margin-top: 8px; border-radius: 4px; word-break: break-all;">
          ${verificationUrl}
        </code>
      </p>

      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        This link will expire in 24 hours.
      </p>
    </div>
    <div class="footer">
      <p>Katachi - Visual Workspace</p>
      <p>If you didn't create this account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Verify your Katachi account',
    html
  })
}

export async function sendPasswordReset(toEmail: string, resetToken: string) {
  const transporter = getTransporter()
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Katachi 形</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>

      <a href="${resetUrl}" class="button">Reset Password</a>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <code style="background: #e5e7eb; padding: 8px; display: inline-block; margin-top: 8px; border-radius: 4px; word-break: break-all;">
          ${resetUrl}
        </code>
      </p>

      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        This link will expire in 1 hour.
      </p>
    </div>
    <div class="footer">
      <p>Katachi - Visual Workspace</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Reset your Katachi password',
    html
  })
}

export async function sendActivityNotification(
  toEmail: string,
  actorName: string,
  boardName: string,
  action: string
) {
  const transporter = getTransporter()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Katachi 形</h1>
    </div>
    <div class="content">
      <h2>Activity on Shared Board</h2>
      <p><strong>${actorName}</strong> ${action} on <strong>"${boardName}"</strong></p>

      <a href="${APP_URL}" class="button">View Board</a>
    </div>
    <div class="footer">
      <p>Katachi - Visual Workspace</p>
      <p>You can adjust notification settings in your account preferences.</p>
    </div>
  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: toEmail,
    subject: `Activity on "${boardName}" - Katachi`,
    html
  })
}

export async function sendLoginCode(toEmail: string, code: string) {
  const transporter = getTransporter()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; text-align: center; }
    .code { font-size: 48px; font-weight: bold; color: #3B82F6; letter-spacing: 8px; margin: 30px 0; font-family: 'Courier New', monospace; background: white; padding: 20px; border-radius: 8px; display: inline-block; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Katachi 形</h1>
    </div>
    <div class="content">
      <h2>Your Login Code</h2>
      <p>Enter this code to sign in to Katachi:</p>

      <div class="code">${code}</div>

      <p style="color: #ef4444; font-weight: 600; margin-top: 20px;">
        ⏱️ This code expires in 2 minutes
      </p>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>Katachi - Visual Workspace</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: toEmail,
    subject: `Your Katachi login code: ${code}`,
    html
  })
}

export async function testEmailConnection() {
  try {
    const transporter = getTransporter()
    await transporter.verify()
    return { success: true, message: 'Email server connection verified' }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
