import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export class EmailService {
  static async sendVerificationEmail(to: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
      from: `"StockSense System" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Initialize StockSense Workspace',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #08111F; color: #F8FAFC; padding: 20px;">
          <h2 style="color: #38BDF8;">Verify Your Identity</h2>
          <p>Please confirm your email address to access the StockSense Command Center.</p>
          <a href="${link}" style="display: inline-block; padding: 10px 20px; background: #38BDF8; color: #08111F; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
      `
    });
  }

  static async sendOtp(to: string, otp: string) {
    await transporter.sendMail({
      from: `"StockSense Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your StockSense Access Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #08111F; color: #F8FAFC; padding: 20px;">
          <h2 style="color: #F59E0B;">Security Code</h2>
          <p>Your one-time access code is:</p>
          <h1 style="color: #38BDF8; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });
  }
}
