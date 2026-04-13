/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  env: {
    KIWI_API_KEY: process.env.KIWI_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    TRAVELPAYOUTS_TOKEN: process.env.TRAVELPAYOUTS_TOKEN,
    BOOKING_AFFILIATE_ID: process.env.BOOKING_AFFILIATE_ID,
  },
}

module.exports = nextConfig
