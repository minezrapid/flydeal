const KIWI_API = 'https://api.tequila.kiwi.com'
const API_KEY = process.env.KIWI_API_KEY || ''

export async function searchFlights({ from, to, dateFrom, dateTo, returnFrom, returnTo, maxPrice, adults = 1 }) {
  const params = new URLSearchParams({
    fly_from: from,
    fly_to: to || 'anywhere',
    date_from: dateFrom,
    date_to: dateTo || dateFrom,
    ...(returnFrom && { return_from: returnFrom }),
    ...(returnTo && { return_to: returnTo }),
    adults,
    curr: 'EUR',
    sort: 'price',
    limit: 20,
    partner: 'picky',
    ...(maxPrice && { price_to: maxPrice }),
  })

  const res = await fetch(`${KIWI_API}/v2/search?${params}`, {
    headers: { apikey: API_KEY },
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`Kiwi API error: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

export async function searchEverywhereFrom({ from, dateFrom, dateTo, maxPrice }) {
  const params = new URLSearchParams({
    fly_from: from,
    fly_to: 'anywhere',
    date_from: dateFrom,
    date_to: dateTo || dateFrom,
    curr: 'EUR',
    sort: 'price',
    limit: 30,
    partner: 'picky',
    ...(maxPrice && { price_to: maxPrice }),
  })

  const res = await fetch(`${KIWI_API}/v2/search?${params}`, {
    headers: { apikey: API_KEY },
    next: { revalidate: 600 },
  })

  if (!res.ok) throw new Error(`Kiwi API error: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

export async function getFlightCalendar({ from, to, year, month }) {
  const startDate = `01/${String(month).padStart(2, '0')}/${year}`
  const endDate = `${new Date(year, month, 0).getDate()}/${String(month).padStart(2, '0')}/${year}`

  const params = new URLSearchParams({
    fly_from: from,
    fly_to: to,
    date_from: startDate,
    date_to: endDate,
    curr: 'EUR',
    sort: 'price',
    limit: 50,
    partner: 'picky',
  })

  const res = await fetch(`${KIWI_API}/v2/search?${params}`, {
    headers: { apikey: API_KEY },
    next: { revalidate: 1800 },
  })

  if (!res.ok) throw new Error(`Kiwi API error: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

export function formatFlight(flight) {
  return {
    id: flight.id,
    price: Math.round(flight.price),
    currency: 'EUR',
    from: {
      code: flight.flyFrom,
      city: flight.cityFrom,
      airport: flight.flyFrom,
    },
    to: {
      code: flight.flyTo,
      city: flight.cityTo,
      airport: flight.flyTo,
    },
    departure: flight.local_departure,
    arrival: flight.local_arrival,
    duration: flight.duration?.departure,
    stops: flight.route?.length - 1 || 0,
    airlines: [...new Set(flight.route?.map(r => r.airline) || [])],
    deepLink: flight.deep_link,
    isVirtual: flight.virtual_interlining,
    nightsInDest: flight.nightsInDest,
  }
}
