import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { email, alert } = await req.json()

    if (!email || !alert) {
      return NextResponse.json({ error: 'Email și alertă obligatorii' }, { status: 400 })
    }

    // In productie, aici se salveaza in DB si se configureaza cron job
    // Pentru MVP, trimitem email de confirmare
    const subject = `Alertă activata: ${alert.fromCity} → ${alert.toCity}`
    const body = `
Alerta ta a fost activată!

Rută: ${alert.fromCity} (${alert.from}) → ${alert.toCity} (${alert.to})
Prag preț: €${alert.maxPrice || 'orice'}
Tip: ${alert.tripType === 'roundtrip' ? 'Dus-întors' : 'Dus'}

Vei primi notificări când prețul scade cu peste ${alert.threshold || 25}% față de media istorică.

FlyDeal — zbori inteligent 🛫
    `.trim()

    // Nodemailer in production
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject,
        text: body,
      })
    }

    return NextResponse.json({ success: true, message: 'Alertă salvată și email trimis!' })
  } catch (err) {
    console.error('Alert error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
