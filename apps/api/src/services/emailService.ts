import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export class EmailService {
  static async sendOTP(email: string, otp: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'StockSense Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <h2 style="color: #D6536D;">StockSense Password Reset</h2>
          <p>You requested a password reset. Here is your One-Time Password (OTP):</p>
          <div style="font-size: 32px; font-weight: bold; padding: 20px; margin: 20px; background-color: #f4f4f4; border-radius: 8px; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  static async sendInvite(email: string, tempPassword: string, role: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'You have been invited to StockSense',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <h2 style="color: #D6536D;">Welcome to StockSense</h2>
          <p>You have been invited to join the warehouse team as a <strong>${role}</strong>.</p>
          <p>Here are your temporary login credentials:</p>
          <div style="padding: 20px; margin: 20px; background-color: #f4f4f4; border-radius: 8px; text-align: left;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${tempPassword}</p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; padding: 12px 24px; background-color: #D6536D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
            Log in to StockSense
          </a>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending invite email:', error);
      throw new Error('Failed to send invite email');
    }
  }
}
