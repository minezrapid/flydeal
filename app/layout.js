import './globals.css'

export const metadata = {
  title: 'FlyDeal — Zbori inteligent din România',
  description: 'Monitorizare prețuri zboruri Ryanair, Wizz Air și 750+ companii aeriene. Alerte instant când prețul scade.',
  keywords: 'zboruri ieftine, ryanair, wizz air, bilete avion, oferte zbor, alerte pret zbor',
  openGraph: {
    title: 'FlyDeal — Zbori inteligent',
    description: 'Prinde ofertele înainte să dispară',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
