import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';

type TemplateKey = 'welcome' | 'resetPassword' | 'paymentApproved' | 'subscriptionActivated';

const templates: Record<TemplateKey, { subject: string; body: string }> = {
  welcome: {
    subject: '¡Bienvenido a MIACCESS, {{firstName}}!',
    body: `<h1>Hola {{firstName}} 👋</h1>
      <p>Gracias por unirte a <strong>MIACCESS</strong>. Ya podés explorar nuestro catálogo.</p>
      <p>Activá tu <strong>demo gratuita de 30 minutos</strong> para acceder a todo el contenido.</p>
      <p><a href="{{frontendUrl}}/dashboard" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Ir al Dashboard</a></p>`,
  },
  resetPassword: {
    subject: 'Restablecé tu contraseña · MIACCESS',
    body: `<h1>Recuperar contraseña</h1>
      <p>Hola {{firstName}}, recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="{{resetUrl}}" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Restablecer contraseña</a></p>
      <p>Este link expira en 1 hora. Si no lo solicitaste, ignorá este email.</p>`,
  },
  paymentApproved: {
    subject: 'Pago aprobado · MIACCESS',
    body: `<h1>¡Gracias {{firstName}}!</h1>
      <p>Tu pago de <strong>\${{amount}}</strong> fue aprobado. Ya podés acceder al contenido.</p>
      <p><a href="{{frontendUrl}}/dashboard">Ir al Dashboard</a></p>`,
  },
  subscriptionActivated: {
    subject: 'Suscripción activada · MIACCESS',
    body: `<h1>Tu suscripción está activa 🎉</h1>
      <p>Hola {{firstName}}, ya tenés acceso ilimitado a todos los cursos de MIACCESS.</p>
      <p><a href="{{frontendUrl}}/catalog">Explorar catálogo</a></p>`,
  },
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', 'MIACCESS <no-reply@miaccess.dev>');
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get<string>('SMTP_PORT', '587')),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    } else {
      this.logger.warn('SMTP no configurado — los emails se loguean a consola');
    }
  }

  async send(to: string, template: TemplateKey, vars: Record<string, any> = {}) {
    const tpl = templates[template];
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const ctx = { frontendUrl, ...vars };
    const subject = Handlebars.compile(tpl.subject)(ctx);
    const html = Handlebars.compile(tpl.body)(ctx);

    if (!this.transporter) {
      this.logger.log(`[MAIL:${template}] to=${to} subject="${subject}"`);
      this.logger.debug(html);
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email enviado (${template}) a ${to}`);
    } catch (err) {
      this.logger.error(`Error enviando email a ${to}: ${(err as Error).message}`);
    }
  }
}
