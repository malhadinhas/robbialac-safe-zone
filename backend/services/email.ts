import nodemailer from 'nodemailer';

// Configuração do transporter usando variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, code: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Código de verificação - Robbialac Safe Zone',
    text: `Seu código de verificação é: ${code}`,
    html: `<p>Seu código de verificação é: <b>${code}</b></p>`
  };
  return transporter.sendMail(mailOptions);
} 