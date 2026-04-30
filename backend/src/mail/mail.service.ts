import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';

type TemplateKey = 'welcome' | 'resetPassword' | 'paymentApproved' | 'subscriptionActivated';

const baseLayout = (heroTitle: string, body: string, ctaLabel: string, ctaUrl: string) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>{{subject}}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:#0f172a;padding:24px;text-align:center;">
      <span style="display:inline-flex;align-items:center;gap:8px;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">
        <span style="display:inline-block;width:26px;height:26px;background:linear-gradient(135deg,#a78bfa,#7c5cf2);border-radius:7px;"></span>
        Elevva
      </span>
    </div>
    <div style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);padding:36px 32px;">
      <h1 style="margin:0;color:#1e1b4b;font-size:26px;font-weight:800;line-height:1.25;">${heroTitle}</h1>
    </div>
    <div style="padding:32px;color:#374151;line-height:1.65;font-size:15px;">
      ${body}
      <div style="text-align:center;margin:28px 0 12px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#7c5cf2;color:#ffffff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">${ctaLabel} →</a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px;text-align:center;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 6px;">Si tienes alguna duda, responde a este correo o visita nuestro <a href="{{frontendUrl}}/support" style="color:#7c5cf2;">centro de ayuda</a>.</p>
      <p style="margin:0;color:#9ca3af;">© {{year}} Elevva</p>
    </div>
  </div>
</body>
</html>`;

const summaryCard = (rows: { label: string; value: string }[]) => `
<table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:18px 20px;margin:24px 0;">
  <tr><td style="padding-bottom:12px;color:#6d28d9;font-weight:700;font-size:15px;">Resumen de tu compra</td></tr>
  ${rows.map(r => `
    <tr>
      <td style="padding:4px 0;color:#374151;font-size:14px;">
        <span style="color:#7c5cf2;font-weight:700;margin-right:6px;">•</span>
        <strong style="display:inline-block;min-width:80px;color:#374151;">${r.label}:</strong>
        <span style="color:#1f2937;">${r.value}</span>
      </td>
    </tr>`).join('')}
</table>`;

const templates: Record<TemplateKey, { subject: string; body: string }> = {
  welcome: {
    subject: '¡Bienvenido a Elevva, {{firstName}}!',
    body: baseLayout(
      '¡Bienvenido a Elevva!',
      `<p style="margin:0 0 12px;"><strong>Hola, {{firstName}}</strong></p>
       <p style="color:#7c5cf2;font-weight:600;margin:0 0 16px;">¡Gracias por sumarte a Elevva!</p>
       <p>Estamos felices de acompañarte en este camino de aprendizaje. Activa tu <strong>demo gratuita de 30 minutos</strong> para conocer todo el contenido disponible.</p>`,
      'Ir a mi cuenta',
      '{{frontendUrl}}/dashboard',
    ),
  },
  resetPassword: {
    subject: 'Restablecé tu contraseña · Elevva',
    body: baseLayout(
      'Recuperar contraseña',
      `<p>Hola <strong>{{firstName}}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
       <p>Este link expira en 1 hora. Si no lo solicitaste, ignorá este email.</p>`,
      'Restablecer contraseña',
      '{{resetUrl}}',
    ),
  },
  paymentApproved: {
    subject: '¡Gracias por tu compra en Elevva!',
    body: baseLayout(
      '¡Gracias por tu compra en Elevva!',
      `<p style="margin:0 0 12px;"><strong>Hola, {{firstName}}</strong></p>
       <p style="color:#7c5cf2;font-weight:600;margin:0 0 16px;">¡Gracias por confiar en Elevva!</p>
       <p>Tu compra de <strong>{{productName}}</strong> se ha confirmado correctamente. A partir de ahora puedes acceder a tu contenido desde tu cuenta y comenzar a aprender a tu ritmo.</p>
       ${summaryCard([
         { label: 'Producto', value: '{{productName}}' },
         { label: 'Tipo', value: '{{productType}}' },
         { label: 'Fecha', value: '{{date}}' },
         { label: 'Monto', value: '{{currency}} {{amount}}' },
       ])}
       <p>Gracias nuevamente por ser parte de Elevva. Estamos seguros de que este será el comienzo de una etapa de mucho crecimiento.</p>
       <p style="margin-bottom:0;">Con entusiasmo,<br><strong style="color:#7c5cf2;">Equipo Elevva</strong></p>`,
      'Ir a mi cuenta',
      '{{frontendUrl}}/my-courses',
    ),
  },
  subscriptionActivated: {
    subject: '¡Tu suscripción Elevva está activa!',
    body: baseLayout(
      '¡Gracias por tu compra en Elevva!',
      `<p style="margin:0 0 12px;"><strong>Hola, {{firstName}}</strong></p>
       <p style="color:#7c5cf2;font-weight:600;margin:0 0 16px;">¡Gracias por confiar en Elevva!</p>
       <p>Tu suscripción <strong>{{productType}}</strong> se ha confirmado correctamente. Este es un paso muy importante para avanzar hacia tus metas, fortalecer tus habilidades y seguir creciendo como emprendedor.</p>
       <p>A partir de ahora puedes acceder a todo el contenido desde tu cuenta y comenzar a aprender a tu ritmo. Estamos felices de acompañarte en este camino y ayudarte a convertir tus ideas en resultados reales.</p>
       ${summaryCard([
         { label: 'Producto', value: '{{productName}}' },
         { label: 'Tipo', value: '{{productType}}' },
         { label: 'Fecha', value: '{{date}}' },
         { label: 'Monto', value: '{{currency}} {{amount}}' },
       ])}
       <p>Gracias nuevamente por ser parte de Elevva. Estamos seguros de que este será el comienzo de una etapa de mucho crecimiento.</p>
       <p style="margin-bottom:0;">Con entusiasmo,<br><strong style="color:#7c5cf2;">Equipo Elevva</strong></p>`,
      'Ir a mi cuenta',
      '{{frontendUrl}}/my-courses',
    ),
  },
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', 'Elevva <no-reply@elevva.app>');
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
    const ctx = { frontendUrl, year: new Date().getFullYear(), ...vars };
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
