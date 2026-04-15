import { NextResponse } from 'next/server'

// Mapping orase/regiuni la cel mai apropiat aeroport IATA
const CITY_TO_AIRPORT = {
  // România
  'bucharest': { code: 'OTP', city: 'București', country: 'România' },
  'bucuresti': { code: 'OTP', city: 'București', country: 'România' },
  'ilfov':     { code: 'OTP', city: 'București', country: 'România' },
  'cluj':      { code: 'CLJ', city: 'Cluj-Napoca', country: 'România' },
  'cluj-napoca': { code: 'CLJ', city: 'Cluj-Napoca', country: 'România' },
  'timisoara': { code: 'TSR', city: 'Timișoara', country: 'România' },
  'timișoara': { code: 'TSR', city: 'Timișoara', country: 'România' },
  'iasi':      { code: 'IAS', city: 'Iași', country: 'România' },
  'iași':      { code: 'IAS', city: 'Iași', country: 'România' },
  'constanta': { code: 'CND', city: 'Constanța', country: 'România' },
  'constanța': { code: 'CND', city: 'Constanța', country: 'România' },
  'sibiu':     { code: 'SBZ', city: 'Sibiu', country: 'România' },
  'oradea':    { code: 'OMR', city: 'Oradea', country: 'România' },
  'suceava':   { code: 'SCV', city: 'Suceava', country: 'România' },
  'targu mures': { code: 'TGM', city: 'Târgu Mureș', country: 'România' },
  'craiova':   { code: 'CRA', city: 'Craiova', country: 'România' },
  'bacau':     { code: 'BCM', city: 'Bacău', country: 'România' },
  'bacău':     { code: 'BCM', city: 'Bacău', country: 'România' },
  'arad':      { code: 'ARW', city: 'Arad', country: 'România' },
  'pitesti':   { code: 'OTP', city: 'București', country: 'România' }, // cel mai aproape OTP
  'pitești':   { code: 'OTP', city: 'București', country: 'România' },
  'brasov':    { code: 'OTP', city: 'București', country: 'România' }, // fara aeroport propriu
  'brașov':    { code: 'OTP', city: 'București', country: 'România' },
  'ploiesti':  { code: 'OTP', city: 'București', country: 'România' },
  'ploiești':  { code: 'OTP', city: 'București', country: 'România' },
  'galati':    { code: 'OTP', city: 'București', country: 'România' },
  'galați':    { code: 'OTP', city: 'București', country: 'România' },
  // Alte tari europene
  'madrid':    { code: 'MAD', city: 'Madrid', country: 'Spania' },
  'barcelona': { code: 'BCN', city: 'Barcelona', country: 'Spania' },
  'paris':     { code: 'CDG', city: 'Paris', country: 'Franța' },
  'london':    { code: 'LTN', city: 'Londra', country: 'UK' },
  'berlin':    { code: 'BER', city: 'Berlin', country: 'Germania' },
  'vienna':    { code: 'VIE', city: 'Viena', country: 'Austria' },
  'amsterdam': { code: 'AMS', city: 'Amsterdam', country: 'Olanda' },
  'rome':      { code: 'FCO', city: 'Roma', country: 'Italia' },
  'milan':     { code: 'MXP', city: 'Milano', country: 'Italia' },
  'athens':    { code: 'ATH', city: 'Atena', country: 'Grecia' },
  'dublin':    { code: 'DUB', city: 'Dublin', country: 'Irlanda' },
  'prague':    { code: 'PRG', city: 'Praga', country: 'Cehia' },
  'budapest':  { code: 'BUD', city: 'Budapesta', country: 'Ungaria' },
  'warsaw':    { code: 'WAW', city: 'Varșovia', country: 'Polonia' },
  'lisbon':    { code: 'LIS', city: 'Lisabona', country: 'Portugalia' },
}

// Mapping tara -> aeroport principal
const COUNTRY_TO_AIRPORT = {
  'RO': { code: 'OTP', city: 'București', country: 'România' },
  'ES': { code: 'MAD', city: 'Madrid', country: 'Spania' },
  'FR': { code: 'CDG', city: 'Paris', country: 'Franța' },
  'GB': { code: 'LTN', city: 'Londra', country: 'UK' },
  'DE': { code: 'BER', city: 'Berlin', country: 'Germania' },
  'AT': { code: 'VIE', city: 'Viena', country: 'Austria' },
  'NL': { code: 'AMS', city: 'Amsterdam', country: 'Olanda' },
  'IT': { code: 'FCO', city: 'Roma', country: 'Italia' },
  'GR': { code: 'ATH', city: 'Atena', country: 'Grecia' },
  'IE': { code: 'DUB', city: 'Dublin', country: 'Irlanda' },
  'CZ': { code: 'PRG', city: 'Praga', country: 'Cehia' },
  'HU': { code: 'BUD', city: 'Budapesta', country: 'Ungaria' },
  'PL': { code: 'WAW', city: 'Varșovia', country: 'Polonia' },
  'PT': { code: 'LIS', city: 'Lisabona', country: 'Portugalia' },
  'BE': { code: 'BRU', city: 'Bruxelles', country: 'Belgia' },
  'CH': { code: 'ZRH', city: 'Zurich', country: 'Elveția' },
  'SE': { code: 'ARN', city: 'Stockholm', country: 'Suedia' },
  'NO': { code: 'OSL', city: 'Oslo', country: 'Norvegia' },
  'DK': { code: 'CPH', city: 'Copenhaga', country: 'Danemarca' },
  'FI': { code: 'HEL', city: 'Helsinki', country: 'Finlanda' },
  'TR': { code: 'IST', city: 'Istanbul', country: 'Turcia' },
  'UA': { code: 'KBP', city: 'Kiev', country: 'Ucraina' },
  'US': { code: 'JFK', city: 'New York', country: 'SUA' },
}

export async function GET(req) {
  try {
    // Obtinem IP-ul real din headerele Vercel/proxy
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp || '8.8.8.8'

    // Folosim ipapi.co - 1000 req/zi gratuit, fara API key
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'FlyDeal/1.0' },
      next: { revalidate: 3600 }, // cache 1h per IP
    })

    if (!geoRes.ok) throw new Error('GeoIP service unavailable')

    const geo = await geoRes.json()

    if (geo.error) throw new Error(geo.reason || 'GeoIP error')

    // Gasim aeroportul cel mai aproape
    const cityKey = (geo.city || '').toLowerCase().trim()
    const countryCode = geo.country_code || 'RO'

    const airport =
      CITY_TO_AIRPORT[cityKey] ||
      COUNTRY_TO_AIRPORT[countryCode] ||
      { code: 'OTP', city: 'București', country: 'România' }

    return NextResponse.json({
      ip,
      city: geo.city || null,
      region: geo.region || null,
      country: geo.country_name || null,
      countryCode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      airport,
    })
  } catch (err) {
    console.error('GeoIP error:', err.message)
    // Fallback la București dacă orice merge prost
    return NextResponse.json({
      ip: null,
      city: null,
      region: null,
      country: 'România',
      countryCode: 'RO',
      airport: { code: 'OTP', city: 'București', country: 'România' },
      fallback: true,
    })
  }
}
