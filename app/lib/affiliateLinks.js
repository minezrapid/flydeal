const TRAVELPAYOUTS_TOKEN = process.env.TRAVELPAYOUTS_TOKEN || 'YOUR_TOKEN'
const BOOKING_AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || 'YOUR_AID'

export function kiwiAffiliateLink({ from, to, dateFrom, dateTo, adults = 1 }) {
  const base = 'https://www.kiwi.com/ro/search'
  const params = new URLSearchParams({
    from,
    to,
    departure: dateFrom || '',
    return: dateTo || '',
    adults,
    affilid: TRAVELPAYOUTS_TOKEN,
    currency: 'EUR',
    source: 'flydeal-alert',
  })
  return `${base}/${from}/${to}/${dateFrom || 'anytime'}/${dateTo || 'anytime'}?${params}`
}

export function bookingAffiliateLink({ city, checkin, checkout, rooms = 1, adults = 2 }) {
  const base = 'https://www.booking.com/searchresults.ro.html'
  const params = new URLSearchParams({
    ss: city,
    checkin,
    checkout,
    group_adults: adults,
    no_rooms: rooms,
    aid: BOOKING_AFFILIATE_ID,
    label: 'flydeal-alert',
  })
  return `${base}?${params}`
}

export function ryanairLink({ from, to, date }) {
  return `https://www.ryanair.com/ro/ro/trip/flights/select?adults=1&teens=0&children=0&infants=0&dateOut=${date}&originIata=${from}&destinationIata=${to}&isConnectedFlight=false&discount=0&isReturn=false&promoCode=`
}

export function wizzairLink({ from, to, date }) {
  return `https://wizzair.com/ro-RO/booking/select-flight/${from}/${to}/${date}/null/1/0/0/null`
}

export function getyourguideLink({ city }) {
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(city)}&partner_id=FLYDEAL`
}

export function buildAffiliateBundle({ fromCode, toCode, toCity, departDate, returnDate }) {
  return {
    kiwi: kiwiAffiliateLink({ from: fromCode, to: toCode, dateFrom: departDate, dateTo: returnDate }),
    booking: bookingAffiliateLink({ city: toCity, checkin: departDate, checkout: returnDate }),
    ryanair: ryanairLink({ from: fromCode, to: toCode, date: departDate }),
    wizz: wizzairLink({ from: fromCode, to: toCode, date: departDate }),
    activities: getyourguideLink({ city: toCity }),
  }
}
