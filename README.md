# FlyDeal ✈️

Monitor de prețuri zboruri cu alerte instant — Ryanair, Wizz Air, și 750+ companii prin Kiwi.com.

## Features

- Căutare zboruri live (Kiwi.com API — virtual interlining, rute ascunse)
- Căutare "Oriunde" — găsește cel mai ieftin zbor din orice aeroport
- Alerte de preț via email când prețul scade sub un prag
- Link-uri afiliate automate: Kiwi.com + Booking.com + Ryanair direct + Wizz Air direct
- Mobile-first, responsive
- Demo mode cu date simulate când API key lipsește

## Deploy rapid pe Vercel

### 1. Fork/clone
```bash
git clone https://github.com/tu/flydeal
cd flydeal
```

### 2. Deploy pe Vercel
```bash
npm i -g vercel
vercel
```

### 3. Adaugă environment variables în Vercel Dashboard

| Variabilă | Descriere | Unde obții |
|---|---|---|
| `KIWI_API_KEY` | API key Kiwi/Tequila | [tequila.kiwi.com](https://tequila.kiwi.com) — gratuit |
| `TRAVELPAYOUTS_TOKEN` | Token afiliat (comision 3% zboruri) | [travelpayouts.com](https://www.travelpayouts.com) |
| `BOOKING_AFFILIATE_ID` | ID afiliat Booking (comision 4% cazări) | [booking.com/affiliate-program](https://www.booking.com/affiliate-program) |
| `SMTP_HOST` | Server SMTP pentru emailuri | Gmail: smtp.gmail.com |
| `SMTP_PORT` | Port SMTP | 587 |
| `SMTP_USER` | Email sender | email@gmail.com |
| `SMTP_PASS` | Parolă app Gmail | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |

### 4. Pentru alertele automate (cron job)

Adaugă în `vercel.json` un cron job:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0 7,18 * * *"
    }
  ]
}
```

Sau folosește un serviciu extern (cron-job.org — gratuit) care face POST la `/api/alerts/check` de 2x pe zi.

## Monetizare

### Surse de venit implementate:
1. **Kiwi.com** via Travelpayouts — 3% per rezervare confirmată
2. **Booking.com** — 4% per cazare rezervată  
3. **Activități** — GetYourGuide 8-9% (de adăugat)
4. **Asigurare** — SafetyWing/Ekta 20-30% (de adăugat)

### Cum funcționează affiliate tracking:
- Toate link-urile generate în aplicație conțin automat affiliate ID-urile tale
- Cookie window: 30 zile Kiwi, sesiune Booking.com
- Nu există cost suplimentar pentru utilizator

## Structura proiect

```
app/
  page.js              — UI principal (search + alerts)
  globals.css          — Design system custom
  layout.js            — Root layout + metadata SEO
  api/
    search/route.js    — Kiwi.com flight search API
    alerts/route.js    — Salvare alerte + email confirmare
  lib/
    flightSearch.js    — Kiwi/Tequila API wrapper
    affiliateLinks.js  — Generator link-uri afiliate
    storage.js         — LocalStorage helpers + airports list
vercel.json            — Vercel deployment config
```

## Development local

```bash
npm install
cp .env.example .env.local
# Editează .env.local cu cheile tale
npm run dev
# Deschide http://localhost:3000
```

## Extinderi viitoare

- [ ] Baza de date (Vercel Postgres / PlanetScale) pentru alerte persistente
- [ ] Cron job automat pentru verificare prețuri
- [ ] Notificări push (PWA)
- [ ] Telegram bot integration
- [ ] Calendar de prețuri (cel mai ieftin zbor per zi)
- [ ] AI agent pentru sugestii personalizate
- [ ] Multi-user cu autentificare (NextAuth)
