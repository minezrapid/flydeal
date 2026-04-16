import { NextResponse } from 'next/server'

const KIWI_API = 'https://api.tequila.kiwi.com'
const API_KEY = process.env.KIWI_API_KEY || ''

// Toate aeroporturile din Romania cu zboruri comerciale
const RO_AIRPORTS = ['OTP', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'OMR', 'SCV', 'TGM', 'ARW']

// Companii low-cost care opereaza in Romania
const AIRLINE_NAMES = {
  W6: 'Wizz Air', FR: 'Ryanair', VY: 'Vueling', U2: 'easyJet',
  TO: 'Transavia', HV: 'Transavia NL', PC: 'Pegasus', BT: 'airBaltic',
  LO: 'LOT Polish', RO: 'TAROM', '4U': 'Germanwings', FB: 'Bulgaria Air',
}

// Culori brand per companie
const AIRLINE_COLORS = {
  W6: '#c4007f', FR: '#073590', VY: '#e87722', U2: '#ff6600',
  TO: '#00a3e0', HV: '#009ee0', PC: '#ffcc00', BT: '#003087',
  LO: '#00509e', RO: '#002395', '4U': '#000000', FB: '#006db7',
}

// Link direct la companie (fara afiliat)
function getAirlineBookingLink(airlineCode, fromCode, toCode, dateStr) {
  const d = dateStr || ''
  switch (airlineCode) {
    case 'W6':
      return `https://wizzair.com/ro-RO/booking/select-flight/${fromCode}/${toCode}/${d}/null/1/0/0/null`
    case 'FR':
      return `https://www.ryanair.com/ro/ro/trip/flights/select?adults=1&dateOut=${d}&originIata=${fromCode}&destinationIata=${toCode}&isConnectedFlight=false`
    case 'VY':
      return `https://www.vueling.com/ro/rezerva-un-zbor/cautare-zboruri?iddeparture=${fromCode}&idarrival=${toCode}&departuredate=${d}&adults=1&children=0&infants=0&cabintype=N`
    case 'U2':
      return `https://www.easyjet.com/ro#/book/search?fromIata=${fromCode}&toIata=${toCode}&outboundDate=${d}&adults=1`
    case 'TO':
    case 'HV':
      return `https://www.transavia.com/ro-RO/book-a-flight/flights/search/?routeSelection.origin.codes=${fromCode}&routeSelection.destination.codes=${toCode}&dateSelection.outboundDate=${d}&passengers.adultCount=1`
    case 'PC':
      return `https://www.flypgs.com/en/cheap-flights/${fromCode}-${toCode}?departDate=${d}&paxType=1`
    default:
      return `https://www.google.com/travel/flights/search?tfs=CBwQAhoeEgoyMDI2LTAxLTAxagcIARIDT1RQcgcIARIDeVlZ`
  }
}

async function searchDealsFromAirport(fromCode, maxPrice = 15) {
  const today = new Date()
  const dateFrom = today.toLocaleDateString('ro', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('.').join('/')
  // Cauta in urmatoarele 60 zile
  const dateTo = new Date(today.getTime() + 60 * 24 * 3600000)
    .toLocaleDateString('ro', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('.').join('/')

  const params = new URLSearchParams({
    fly_from: fromCode,
    fly_to: 'europe',
    date_from: dateFrom,
    date_to: dateTo,
    adults: 1,
    curr: 'EUR',
    sort: 'price',
    limit: 5,
    price_to: maxPrice,
    partner: 'picky',
    one_for_city: 1,
  })

  const res = await fetch(`${KIWI_API}/v2/search?${params}`, {
    headers: { apikey: API_KEY },
    next: { revalidate: 14400 }, // cache 4 ore
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.data || []
}

function formatDeal(flight) {
  const airline = flight.route?.[0]?.airline || 'XX'
  const depDate = new Date(flight.local_departure)
  const dateStr = depDate.toISOString().split('T')[0]

  return {
    id: flight.id,
    price: Math.round(flight.price),
    priceRON: Math.round(flight.price * 4.97), // aproximativ RON
    currency: 'EUR',
    from: { code: flight.flyFrom, city: flight.cityFrom },
    to: { code: flight.flyTo, city: flight.cityTo, country: flight.countryTo?.name || '' },
    departure: flight.local_departure,
    arrival: flight.local_arrival,
    duration: flight.duration?.departure || 0,
    stops: (flight.route?.length || 1) - 1,
    airline,
    airlineName: AIRLINE_NAMES[airline] || airline,
    airlineColor: AIRLINE_COLORS[airline] || '#333',
    bookingLink: getAirlineBookingLink(airline, flight.flyFrom, flight.flyTo, dateStr),
    deepLink: flight.deep_link,
    isVirtual: flight.virtual_interlining || false,
  }
}

// Date mock realiste pentru demo (fara API key)
function getMockDeals() {
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + 7)

  return [
    {
      id: 'mock-1', price: 6, priceRON: 30, currency: 'EUR',
      from: { code: 'CRA', city: 'Craiova' },
      to: { code: 'MXP', city: 'Milano', country: 'Italia' },
      departure: new Date(baseDate.getTime()).toISOString(),
      arrival: new Date(baseDate.getTime() + 5400000).toISOString(),
      duration: 5400, stops: 0, airline: 'W6',
      airlineName: 'Wizz Air', airlineColor: '#c4007f',
      bookingLink: 'https://wizzair.com',
      isVirtual: false,
    },
    {
      id: 'mock-2', price: 9, priceRON: 45, currency: 'EUR',
      from: { code: 'OTP', city: 'București' },
      to: { code: 'STN', city: 'Londra', country: 'UK' },
      departure: new Date(baseDate.getTime() + 86400000).toISOString(),
      arrival: new Date(baseDate.getTime() + 86400000 + 9000000).toISOString(),
      duration: 9000, stops: 0, airline: 'FR',
      airlineName: 'Ryanair', airlineColor: '#073590',
      bookingLink: 'https://www.ryanair.com',
      isVirtual: false,
    },
    {
      id: 'mock-3', price: 11, priceRON: 55, currency: 'EUR',
      from: { code: 'CLJ', city: 'Cluj-Napoca' },
      to: { code: 'BCN', city: 'Barcelona', country: 'Spania' },
      departure: new Date(baseDate.getTime() + 172800000).toISOString(),
      arrival: new Date(baseDate.getTime() + 172800000 + 7200000).toISOString(),
      duration: 7200, stops: 0, airline: 'W6',
      airlineName: 'Wizz Air', airlineColor: '#c4007f',
      bookingLink: 'https://wizzair.com',
      isVirtual: false,
    },
    {
      id: 'mock-4', price: 13, priceRON: 65, currency: 'EUR',
      from: { code: 'TSR', city: 'Timișoara' },
      to: { code: 'VIE', city: 'Viena', country: 'Austria' },
      departure: new Date(baseDate.getTime() + 259200000).toISOString(),
      arrival: new Date(baseDate.getTime() + 259200000 + 3600000).toISOString(),
      duration: 3600, stops: 0, airline: 'W6',
      airlineName: 'Wizz Air', airlineColor: '#c4007f',
      bookingLink: 'https://wizzair.com',
      isVirtual: false,
    },
    {
      id: 'mock-5', price: 14, priceRON: 70, currency: 'EUR',
      from: { code: 'OTP', city: 'București' },
      to: { code: 'ATH', city: 'Atena', country: 'Grecia' },
      departure: new Date(baseDate.getTime() + 345600000).toISOString(),
      arrival: new Date(baseDate.getTime() + 345600000 + 5400000).toISOString(),
      duration: 5400, stops: 0, airline: 'FR',
      airlineName: 'Ryanair', airlineColor: '#073590',
      bookingLink: 'https://www.ryanair.com',
      isVirtual: false,
    },
    {
      id: 'mock-6', price: 7, priceRON: 35, currency: 'EUR',
      from: { code: 'IAS', city: 'Iași' },
      to: { code: 'BER', city: 'Berlin', country: 'Germania' },
      departure: new Date(baseDate.getTime() + 432000000).toISOString(),
      arrival: new Date(baseDate.getTime() + 432000000 + 5400000).toISOString(),
      duration: 5400, stops: 0, airline: 'W6',
      airlineName: 'Wizz Air', airlineColor: '#c4007f',
      bookingLink: 'https://wizzair.com',
      isVirtual: false,
    },
  ]
}

export async function GET() {
  // Fara API key — returneaza mock data
  if (!API_KEY) {
    return NextResponse.json({
      deals: getMockDeals(),
      isMock: true,
      fetchedAt: new Date().toISOString(),
    })
  }

  try {
    // Cauta in paralel din primele 4 aeroporturi mari (limitam ca sa nu depasim rate limit)
    const mainAirports = ['OTP', 'CLJ', 'TSR', 'IAS', 'CRA', 'CND']
    const results = await Promise.allSettled(
      mainAirports.map(code => searchDealsFromAirport(code, 15))
    )

    const allDeals = []
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        r.value.forEach(f => allDeals.push(formatDeal(f)))
      }
    })

    // Deduplicare pe ruta + data + pret
    const seen = new Set()
    const unique = allDeals.filter(d => {
      const key = `${d.from.code}-${d.to.code}-${d.departure?.slice(0, 10)}-${d.price}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sorteaza dupa pret
    unique.sort((a, b) => a.price - b.price)

    return NextResponse.json({
      deals: unique.slice(0, 12),
      isMock: false,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Deals fetch error:', err)
    return NextResponse.json({
      deals: getMockDeals(),
      isMock: true,
      fetchedAt: new Date().toISOString(),
    })
  }
}
