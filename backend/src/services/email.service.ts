import nodemailer from 'nodemailer';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendOTP(email: string, otp: string): Promise<void> {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Shipper Chat - Verify your email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Verify your email address</h2>
                    <p>Thank you for registering with Shipper Chat. Please use the following code to verify your account:</p>
                    <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1F2937;">${otp}</span>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p style="color: #6B7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`OTP sent to ${email}`);
        } catch (error) {
            console.error('Error sending OTP email:', error);
            throw new Error('Failed to send verification email');
        }
    }
}
