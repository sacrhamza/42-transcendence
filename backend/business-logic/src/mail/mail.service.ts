import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  // init my email service !
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    const options: SMTPTransport.Options = {
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.config.getOrThrow<string>('SMTP_PORT')),
      secure: this.config.getOrThrow<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    };

    this.transporter = nodemailer.createTransport(options);
  }
  // send wellcome email ...
  async sendWelcomeEmail(email: string, username: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.config.getOrThrow<string>('SMTP_FROM'),
        to: `${email}`,
        subject: 'Welcome to SUF',
        text: `
Hello ${username},

Welcome to SUF - StackUnderFlow!

We are happy to have you in our community.

Here, you can connect with creative people,
share your knowledge, ask questions,
and learn from developers around the world.

Best regards,
The SUF Team
`,
        html: `
            <h2>Welcome to SUF, ${username}!</h2>

            <p>We are happy to have you in our community.</p>

            <p>
            SUF - StackUnderFlow is a place where you can
            connect with creative people, share knowledge,
            ask questions, and learn from developers
            around the world.
            </p>

            <p>Best regards,<br><b>The SUF Team</b></p>
        `,
      });

      console.log('Message sent: %s', info.messageId);
      // Preview URL is only available when using an Ethereal test account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (err) {
      console.error('Error while sending mail:', err);
      throw err;
    }
  }

  async sendEmailVerefecation(email: string, username: string, token: string) {
    // creat valide URL ...
    const baseUrl = this.config.getOrThrow<string>('NEST_URL');
    const url = new URL('/api/auth/verify-email', baseUrl);
    url.searchParams.set('token', token);
    const verificationLink = url.toString();

    const info = await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: email,
      subject: 'Complete Your SUF Registration',
      text: `
Hello ${username},

Welcome to SUF - StackUnderFlow!

Thank you for joining our community of developers and technology enthusiasts.

To continue your registration, please verify your email address by clicking the link below:

${verificationLink}

This verification link will expire in 15 minutes.

If you did not request this registration, please ignore this email.

Best regards,
The SUF Team
`,
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #333;">

    <h1 style="color: #2563eb; text-align: center;">
      SUF - StackUnderFlow
    </h1>

    <h2>Verify Your Email Address</h2>

    <p>Hi ${username}, Welcome to SUF!</p>

    <p>
      Thank you for joining our community of developers
      and technology enthusiasts.
    </p>

    <p>
      To continue your registration, please verify
      your email address by clicking the button below.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}"
         style="background-color: #2563eb;
                color: #ffffff;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                font-weight: bold;">
        Verify My Email
      </a>
    </div>

    <p>
      This verification link will expire in
      <strong>15 minutes</strong>.
    </p>

    <p style="color: #777; font-size: 13px;">
      If you did not request this registration,
      please ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">

    <p>
      Best regards,<br>
      <strong>The SUF Team</strong>
    </p>

  </div>
`,
    });
  }

  async send_try_registreation(email: string, username: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: email,
      subject: 'Registration Failed - Please Try Again',
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Registration Failed</h2>

        <p>Hello ${username},</p>

        <p>
          Unfortunately, we couldn't complete your account
          registration due to a temporary server issue.
        </p>

        <p>
          Your previous verification link is no longer valid.
        </p>

        <p>
          Please wait a few minutes and register again
          to receive a new verification link.
        </p>

        <p>Best regards,<br>SUF Team</p>
      </div>
    `,
    });
  }
}
