import nodemailer from 'nodemailer';

async function main() {
  // 1. Create a temporary SMTP test account
  // const account = await nodemailer.createTestAccount();

  // 2. Configure the SMTP transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'synadesigner@gmail.com',
      pass: 'lqok mmco ybdf gcjj',
    },
  });

  // 3. Check the SMTP connection
  await transporter.verify();
  console.log('SMTP connection successful');

  const token: string = 'test123';
  // 4. Send a test email
  const info = await transporter.sendMail({
    from: 'welcom',
    to: `tekohar417@en2ch.com`,
    subject: 'Welcom',
    text: `
Hello ayoub,

Welcome to SUF - StackUnderFlow!

We are happy to have you in our community.

Here, you can connect with creative people,
share your knowledge, ask questions,
and learn from developers around the world.

Best regards,
The SUF Team
`,
    html: `
            <h2>Welcome to SUF, ayoub!</h2>

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

  console.log('Message ID:', info.messageId);
}

main().catch(console.error);
