import { NextResponse } from 'next/server'
import { searchFlights, searchEverywhereFrom, formatFlight } from '../../lib/flightSearch'

export async function POST(req) {
  try {
    const body = await req.json()
    const { from, to, dateFrom, dateTo, returnFrom, returnTo, maxPrice, mode } = body

    let flights = []

    if (mode === 'everywhere' || to === 'anywhere') {
      flights = await searchEverywhereFrom({ from, dateFrom, dateTo, maxPrice })
    } else {
      flights = await searchFlights({ from, to, dateFrom, dateTo, returnFrom, returnTo, maxPrice })
    }

    const formatted = flights.map(formatFlight)
    return NextResponse.json({ flights: formatted, count: formatted.length })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json(
      { error: err.message || 'Eroare la căutare', flights: [], count: 0 },
      { status: 500 }
    )
  }
}
