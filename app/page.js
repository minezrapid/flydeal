'use client'
import { useState, useEffect, useCallback } from 'react'
import AIChat from './components/AIChat'
import HotDeals from './components/HotDeals'

const AIRPORTS = [
  { code: 'OTP', city: 'București', flag: '🇷🇴' },
  { code: 'CLJ', city: 'Cluj-Napoca', flag: '🇷🇴' },
  { code: 'TSR', city: 'Timișoara', flag: '🇷🇴' },
  { code: 'IAS', city: 'Iași', flag: '🇷🇴' },
  { code: 'BCN', city: 'Barcelona', flag: '🇪🇸' },
  { code: 'MAD', city: 'Madrid', flag: '🇪🇸' },
  { code: 'LIS', city: 'Lisabona', flag: '🇵🇹' },
  { code: 'CDG', city: 'Paris', flag: '🇫🇷' },
  { code: 'AMS', city: 'Amsterdam', flag: '🇳🇱' },
  { code: 'FCO', city: 'Roma', flag: '🇮🇹' },
  { code: 'MXP', city: 'Milano', flag: '🇮🇹' },
  { code: 'LTN', city: 'Londra', flag: '🇬🇧' },
  { code: 'STN', city: 'Stansted', flag: '🇬🇧' },
  { code: 'BER', city: 'Berlin', flag: '🇩🇪' },
  { code: 'VIE', city: 'Viena', flag: '🇦🇹' },
  { code: 'ATH', city: 'Atena', flag: '🇬🇷' },
  { code: 'DUB', city: 'Dublin', flag: '🇮🇪' },
  { code: 'PRG', city: 'Praga', flag: '🇨🇿' },
  { code: 'BUD', city: 'Budapesta', flag: '🇭🇺' },
  { code: 'WAW', city: 'Varșovia', flag: '🇵🇱' },
  { code: 'anywhere', city: 'Oriunde ✈', flag: '🌍' },
]

const AFFILIATE = {
  travelpayouts: process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || 'DEMO',
  booking: process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || '123456',
}

function kiwiLink(from, to, date) {
  return `https://www.kiwi.com/ro/search/${from}/${to === 'anywhere' ? 'anywhere' : to}/${date || 'anytime'}/no-return?adults=1&currency=EUR&partner=${AFFILIATE.travelpayouts}`
}

function bookingLink(city, checkin, checkout) {
  return `https://www.booking.com/searchresults.ro.html?ss=${encodeURIComponent(city)}&checkin=${checkin || ''}&checkout=${checkout || ''}&group_adults=2&no_rooms=1&aid=${AFFILIATE.booking}&label=flydeal`
}

function wizzLink(from, to, date) {
  return `https://wizzair.com/ro-RO/booking/select-flight/${from}/${to}/${date || ''}/null/1/0/0/null`
}

function ryanairLink(from, to, date) {
  return `https://www.ryanair.com/ro/ro/trip/flights/select?adults=1&dateOut=${date || ''}&originIata=${from}&destinationIata=${to}&isConnectedFlight=false`
}

// Mock flight data for demo (used when API key not configured)
function getMockFlights(from, to) {
  const destinations = to === 'anywhere'
    ? ['BCN', 'MAD', 'LIS', 'CDG', 'AMS', 'FCO', 'BER', 'VIE', 'ATH', 'DUB', 'PRG', 'BUD']
    : [to]
  const cities = { BCN: 'Barcelona', MAD: 'Madrid', LIS: 'Lisabona', CDG: 'Paris', AMS: 'Amsterdam', FCO: 'Roma', BER: 'Berlin', VIE: 'Viena', ATH: 'Atena', DUB: 'Dublin', PRG: 'Praga', BUD: 'Budapesta', MXP: 'Milano', STN: 'Londra', LTN: 'Londra', WAW: 'Varșovia', TSR: 'Timișoara', CLJ: 'Cluj', IAS: 'Iași', OTP: 'București' }
  const airlines = ['W6', 'FR', 'VY', 'U2', 'F9']
  const airlineNames = { W6: 'Wizz Air', FR: 'Ryanair', VY: 'Vueling', U2: 'EasyJet', F9: 'Flybondi' }
  return destinations.slice(0, 8).map((dest, i) => ({
    id: `mock-${i}`,
    price: Math.round(15 + Math.random() * 120),
    currency: 'EUR',
    from: { code: from, city: cities[from] || from },
    to: { code: dest, city: cities[dest] || dest },
    departure: new Date(Date.now() + (i + 7) * 24 * 3600000).toISOString(),
    arrival: new Date(Date.now() + (i + 7) * 24 * 3600000 + 7200000).toISOString(),
    duration: 3600 + Math.round(Math.random() * 7200),
    stops: Math.random() > 0.7 ? 1 : 0,
    airlines: [airlines[i % airlines.length]],
    airlineName: airlineNames[airlines[i % airlines.length]],
    isVirtual: Math.random() > 0.7,
    isMock: true,
  }))
}

function FlightCard({ flight, onSaveAlert }) {
  const dep = new Date(flight.departure)
  const dur = flight.duration ? `${Math.floor(flight.duration / 3600)}h ${Math.floor((flight.duration % 3600) / 60)}m` : '—'
  const toCity = flight.to?.city || flight.to?.code || ''
  const fromCode = flight.from?.code || ''
  const toCode = flight.to?.code || ''
  const dateStr = dep.toISOString().split('T')[0]

  const isWizz = flight.airlines?.includes('W6') || flight.airlineName?.toLowerCase().includes('wizz')
  const isRyanair = flight.airlines?.includes('FR') || flight.airlineName?.toLowerCase().includes('ryanair')

  const directLink = isWizz
    ? wizzLink(fromCode, toCode, dateStr)
    : isRyanair
      ? ryanairLink(fromCode, toCode, dateStr)
      : `https://www.google.com/travel/flights/search?tfs=CBwQAhoeEgoyMDI2LTAxLTAxagcIARIDB1RQcgcIARIDYW55`

  const airlineLabel = isWizz ? 'Wizz Air' : isRyanair ? 'Ryanair' : (flight.airlineName || 'Caută zbor')
  const airlineColor = isWizz ? '#c4007f' : isRyanair ? '#073590' : 'var(--c-ink)'

  return (
    <div className="card fade-up" style={{ padding: '20px', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: flight.price < 15 ? 'var(--c-accent)' : 'var(--c-ink)' }}>
              €{flight.price}
            </span>
            {flight.price < 15 && <span className="badge badge-deal">ofertă excepțională</span>}
            {flight.isVirtual && <span className="badge badge-virtual">virtual</span>}
            {flight.stops === 0 && <span className="badge badge-direct">direct</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
            {flight.isMock ? 'Date demo' : (flight.airlineName || flight.airlines?.join(', '))}
          </div>
        </div>
        <button onClick={() => onSaveAlert(flight)}
          style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--c-muted)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-accent)'; e.currentTarget.style.color = 'var(--c-accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-muted)' }}>
          🔔 Alertă
        </button>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{fromCode}</div>
          <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{dep.toLocaleTimeString('ro', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>{dur} · {flight.stops === 0 ? 'direct' : `${flight.stops} escală`}</div>
          <div style={{ height: 1, background: 'var(--c-border)', position: 'relative' }}>
            <span style={{ position: 'absolute', right: 0, top: -5, fontSize: 10 }}>✈</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{toCode}</div>
          <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{new Date(flight.arrival).toLocaleTimeString('ro', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 14 }}>
        {dep.toLocaleDateString('ro', { weekday: 'short', day: 'numeric', month: 'short' })} · {flight.from?.city} → {toCity}
      </div>

      {/* Direct airline button — no affiliate */}
      <a href={directLink} target="_blank" rel="noopener noreferrer"
        style={{ display: 'block', textAlign: 'center', background: airlineColor, color: 'white', padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-display)', marginBottom: 7, transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        Rezervă pe {airlineLabel} ↗
      </a>

      {/* Booking cazare — affiliate OK */}
      <a href={bookingLink(toCity, dateStr, '')} target="_blank" rel="noopener noreferrer"
        style={{ display: 'block', textAlign: 'center', background: 'transparent', color: '#003580', padding: '9px', borderRadius: 11, fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-display)', border: '1px solid #ccd9f0', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f0f4fc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        🏨 Cazare în {toCity} — Booking.com ↗
      </a>
    </div>
  )
}

function AlertBell({ alerts, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 12, padding: '10px 16px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)' }}>
        🔔 <span style={{ fontWeight: 600 }}>{alerts.length}</span>
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: '110%', width: 320, zIndex: 100, padding: 16, maxHeight: 400, overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Alertele mele</div>
          {alerts.length === 0 && <div style={{ color: 'var(--c-muted)', fontSize: 14 }}>Nicio alertă activă</div>}
          {alerts.map(a => (
            <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{a.fromCode} → {a.toCode}</div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>Max €{a.maxPrice || '∞'} · Prag {a.threshold || 25}%</div>
              </div>
              <button onClick={() => onDelete(a.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AlertModal({ flight, onClose, onSave }) {
  const [email, setEmail] = useState('')
  const [maxPrice, setMaxPrice] = useState(flight?.price ? Math.round(flight.price * 0.8) : 50)
  const [threshold, setThreshold] = useState(25)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!email) return
    setSaving(true)
    const alert = {
      fromCode: flight?.from?.code || 'OTP',
      fromCity: flight?.from?.city || 'București',
      toCode: flight?.to?.code || 'anywhere',
      toCity: flight?.to?.city || 'Oriunde',
      maxPrice,
      threshold,
      tripType: 'oneway',
    }
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, alert }),
      })
      onSave({ ...alert, id: Date.now().toString(), email })
      setSaved(true)
      setTimeout(onClose, 1800)
    } catch {}
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 28 }}>
        {saved ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Alertă activată!</div>
            <div style={{ color: 'var(--c-muted)', fontSize: 14, marginTop: 8 }}>Vei primi email când prețul scade.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                🔔 Setează alertă
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--c-muted)' }}>×</button>
            </div>
            {flight && (
              <div style={{ background: 'var(--c-paper)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
                <strong>{flight.from?.city}</strong> → <strong>{flight.to?.city}</strong>
                <span style={{ color: 'var(--c-accent)', fontFamily: 'var(--font-display)', fontWeight: 700, marginLeft: 8 }}>€{flight.price}</span>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label>Email pentru notificări</label>
              <input type="email" placeholder="email@tau.ro" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Preț maxim dorit (€)</label>
              <input type="number" min={5} max={500} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label>Alertează când scade cu (%): <strong>{threshold}%</strong></label>
              <input type="range" min={10} max={60} step={5} value={threshold} onChange={e => setThreshold(Number(e.target.value))} style={{ padding: 0, borderRadius: 0, border: 'none', background: 'none' }} />
            </div>
            <button className="btn-primary" onClick={handleSave} disabled={!email || saving} style={{ width: '100%' }}>
              {saving ? 'Se salvează...' : 'Activează alerta'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [tab, setTab] = useState('search')
  const [from, setFrom] = useState('OTP')
  const [to, setTo] = useState('anywhere')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [anyYearFrom, setAnyYearFrom] = useState(false)
  const [anyYearTo, setAnyYearTo] = useState(false)
  const [maxPrice, setMaxPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [flights, setFlights] = useState([])
  const [searched, setSearched] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [alertFlight, setAlertFlight] = useState(null)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('price')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('flydeal_alerts') || '[]')
      setAlerts(saved)
    } catch {}
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const yearEnd = `${new Date().getFullYear()}-12-31`

  // Effective dates sent to API
  const effectiveDateFrom = anyYearFrom ? today : (dateFrom || today)
  const effectiveDateTo_dep = anyYearFrom ? yearEnd : (dateFrom || today)
  const effectiveDateTo = anyYearTo ? yearEnd : (dateTo || '')

  async function handleSearch() {
    setLoading(true)
    setError('')
    setFlights([])
    setSearched(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          dateFrom: effectiveDateFrom,
          dateTo: effectiveDateTo_dep,
          returnFrom: effectiveDateTo || undefined,
          returnTo: effectiveDateTo || undefined,
          maxPrice: maxPrice || undefined,
          mode: to === 'anywhere' ? 'everywhere' : 'route'
        }),
      })
      const data = await res.json()
      if (data.error || !data.flights?.length) {
        // Use mock data for demo
        setFlights(getMockFlights(from, to))
        if (data.error) setError('Demo mode (configurează KIWI_API_KEY pentru date reale)')
      } else {
        setFlights(data.flights)
      }
    } catch {
      setFlights(getMockFlights(from, to))
      setError('Demo mode — configurează API key pentru date reale')
    }
    setLoading(false)
  }

  function saveAlert(alert) {
    const newAlerts = [...alerts, { ...alert, id: Date.now().toString() }]
    setAlerts(newAlerts)
    localStorage.setItem('flydeal_alerts', JSON.stringify(newAlerts))
    setAlertFlight(null)
  }

  function deleteAlert(id) {
    const newAlerts = alerts.filter(a => a.id !== id)
    setAlerts(newAlerts)
    localStorage.setItem('flydeal_alerts', JSON.stringify(newAlerts))
  }

  // Called by AI agent when it extracts flight params from conversation
  function handleAgentParams(params) {
    if (params.from) setFrom(params.from)
    if (params.to) setTo(params.to)
    if (params.dateFrom) setDateFrom(params.dateFrom)
    if (params.dateTo) setDateTo(params.dateTo)
    if (typeof params.anyYearFrom === 'boolean') setAnyYearFrom(params.anyYearFrom)
    if (typeof params.anyYearTo === 'boolean') setAnyYearTo(params.anyYearTo)
    if (params.maxPrice) setMaxPrice(String(params.maxPrice))
    // Switch to search tab and trigger search
    setTab('search')
    setTimeout(() => handleSearch(), 300)
  }

  const sortedFlights = [...flights].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price
    if (sortBy === 'date') return new Date(a.departure) - new Date(b.departure)
    if (sortBy === 'duration') return (a.duration || 0) - (b.duration || 0)
    return 0
  })

  const fromAirport = AIRPORTS.find(a => a.code === from)
  const toAirport = AIRPORTS.find(a => a.code === to)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--c-border)', background: 'rgba(250,249,247,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Fly<span style={{ color: 'var(--c-accent)' }}>Deal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--c-border)', borderRadius: 100, padding: 4 }}>
              {[['search', '🔍 Caută'], ['alerts', '🔔 Alerte']].map(([t, label]) => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{label}</button>
              ))}
            </div>
            <AlertBell alerts={alerts} onDelete={deleteAlert} />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px' }}>

        {tab === 'search' && (
          <>
            {/* Hero */}
            <div style={{ padding: '48px 0 32px', textAlign: 'center' }}>
              <div className="fade-up fade-up-1" style={{ display: 'inline-block', background: 'var(--c-accent)', color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 14px', borderRadius: 100, marginBottom: 16, fontFamily: 'var(--font-display)' }}>
                RYANAIR · WIZZ AIR · 750+ COMPANII
              </div>
              <h1 className="fade-up fade-up-2 font-display" style={{ fontSize: 'clamp(32px, 8vw, 58px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
                Zboruri ieftine,<br />alerte instant.
              </h1>
              <p className="fade-up fade-up-3" style={{ color: 'var(--c-muted)', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
                Monitorizăm prețurile pentru tine. Când scad, te anunțăm.
              </p>
            </div>

            {/* Oferte de neratat — auto-loaded, no search needed */}
            <HotDeals />

            {/* Search form */}
            <div className="card fade-up" style={{ padding: '24px', marginBottom: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12, marginBottom: 12 }}>

                {/* De la */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>De la</label>
                  <select value={from} onChange={e => setFrom(e.target.value)}
                    style={{ height: 46, padding: '0 12px' }}>
                    {AIRPORTS.filter(a => a.code !== 'anywhere').map(a => (
                      <option key={a.code} value={a.code}>{a.flag} {a.city} ({a.code})</option>
                    ))}
                  </select>
                </div>

                {/* Către */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Către</label>
                  <select value={to} onChange={e => setTo(e.target.value)}
                    style={{ height: 46, padding: '0 12px' }}>
                    {AIRPORTS.map(a => (
                      <option key={a.code} value={a.code}>{a.flag} {a.city}{a.code !== 'anywhere' ? ` (${a.code})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Data plecare */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Data plecare</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 400, color: anyYearFrom ? 'var(--c-accent)' : 'var(--c-muted)', cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}
                      onClick={() => { setAnyYearFrom(!anyYearFrom); if (!anyYearFrom) setAnyYearTo(true) }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${anyYearFrom ? 'var(--c-accent)' : 'var(--c-border)'}`,
                        background: anyYearFrom ? 'var(--c-accent)' : 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {anyYearFrom && <span style={{ color: 'white', fontSize: 9, lineHeight: 1 }}>✓</span>}
                      </span>
                      Oricând
                    </span>
                  </label>
                  <input type="date" min={today} value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    disabled={anyYearFrom}
                    style={{ height: 46, padding: '0 12px', opacity: anyYearFrom ? 0.4 : 1, cursor: anyYearFrom ? 'not-allowed' : 'auto' }} />
                  {anyYearFrom && (
                    <div style={{ fontSize: 11, color: 'var(--c-accent)', marginTop: 4, fontWeight: 500 }}>
                      Oricând în {new Date().getFullYear()}
                    </div>
                  )}
                </div>

                {/* Data întoarcere */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Întoarcere</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 400, color: anyYearTo ? 'var(--c-accent)' : 'var(--c-muted)', cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}
                      onClick={() => setAnyYearTo(!anyYearTo)}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${anyYearTo ? 'var(--c-accent)' : 'var(--c-border)'}`,
                        background: anyYearTo ? 'var(--c-accent)' : 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {anyYearTo && <span style={{ color: 'white', fontSize: 9, lineHeight: 1 }}>✓</span>}
                      </span>
                      Oricând
                    </span>
                  </label>
                  <input type="date" min={dateFrom || today} value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    disabled={anyYearTo}
                    style={{ height: 46, padding: '0 12px', opacity: anyYearTo ? 0.4 : 1, cursor: anyYearTo ? 'not-allowed' : 'auto' }} />
                  {anyYearTo && (
                    <div style={{ fontSize: 11, color: 'var(--c-accent)', marginTop: 4, fontWeight: 500 }}>
                      Oricând în {new Date().getFullYear()}
                    </div>
                  )}
                </div>

                {/* Preț max */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Preț max (€)</label>
                  <input type="number" min={5} max={500} placeholder="Orice" value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    style={{ height: 46, padding: '0 12px' }} />
                </div>

              </div>
              <button className="btn-primary" onClick={handleSearch} disabled={loading} style={{ width: '100%', fontSize: 16 }}>
                {loading ? '✈ Se caută...' : `✈ Caută zboruri ${fromAirport?.flag || ''} → ${toAirport?.flag || '🌍'}`}
              </button>
            </div>

            {/* Quick destinations */}
            {!searched && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 12, fontWeight: 500 }}>Destinații populare din România</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { to: 'BCN', label: 'Barcelona', price: '~€25' },
                    { to: 'LIS', label: 'Lisabona', price: '~€35' },
                    { to: 'CDG', label: 'Paris', price: '~€40' },
                    { to: 'ATH', label: 'Atena', price: '~€20' },
                    { to: 'VIE', label: 'Viena', price: '~€15' },
                    { to: 'PRG', label: 'Praga', price: '~€18' },
                  ].map(d => (
                    <button key={d.to} onClick={() => { setTo(d.to); setTimeout(handleSearch, 100) }}
                      style={{ background: 'white', border: '1px solid var(--c-border)', borderRadius: 100, padding: '8px 16px', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s', display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--font-body)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}>
                      {d.label} <span style={{ color: 'var(--c-accent)', fontWeight: 600 }}>{d.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#7b5800' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 20, marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 40 }} />
                  </div>
                ))}
              </div>
            )}

            {/* Sort bar */}
            {!loading && flights.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 14, color: 'var(--c-muted)' }}>
                  <strong style={{ color: 'var(--c-ink)' }}>{flights.length}</strong> zboruri găsite
                  {flights[0]?.isMock && <span style={{ color: 'var(--c-accent)', marginLeft: 6 }}>(demo)</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--c-muted)', alignSelf: 'center' }}>Sortare:</span>
                  {[['price', 'Preț'], ['date', 'Dată'], ['duration', 'Durată']].map(([key, label]) => (
                    <button key={key} className={`tab ${sortBy === key ? 'active' : ''}`} style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setSortBy(key)}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {!loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {sortedFlights.map((flight, i) => (
                  <div key={flight.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                    <FlightCard flight={flight} onSaveAlert={setAlertFlight} />
                  </div>
                ))}
              </div>
            )}

            {searched && !loading && flights.length === 0 && !error && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--c-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✈️</div>
                <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Nu s-au găsit zboruri</div>
                <div style={{ fontSize: 14 }}>Încearcă date diferite sau destinația "Oriunde"</div>
              </div>
            )}
          </>
        )}

        {tab === 'alerts' && (
          <div style={{ paddingTop: 32 }}>
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Alertele mele</h2>
            <p style={{ color: 'var(--c-muted)', marginBottom: 32, fontSize: 15 }}>
              Primești email când prețul scade sub pragul setat.
            </p>

            {/* New alert form */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>+ Alertă nouă</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div>
                  <label>De la</label>
                  <select value={from} onChange={e => setFrom(e.target.value)}>
                    {AIRPORTS.filter(a => a.code !== 'anywhere').map(a => (
                      <option key={a.code} value={a.code}>{a.flag} {a.city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Către</label>
                  <select value={to} onChange={e => setTo(e.target.value)}>
                    {AIRPORTS.map(a => (
                      <option key={a.code} value={a.code}>{a.flag} {a.city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Max preț (€)</label>
                  <input type="number" min={5} max={500} placeholder="50" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                </div>
              </div>
              <button className="btn-primary" onClick={() => setAlertFlight({ from: { code: from, city: fromAirport?.city }, to: { code: to, city: toAirport?.city }, price: maxPrice || 100 })}>
                Configurează alertă
              </button>
            </div>

            {/* Alerts list */}
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--c-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>Nicio alertă activă încă</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Caută un zbor și apasă "Alertă" pe un rezultat</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {alerts.map(a => (
                  <div key={a.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                        {a.fromCity || a.fromCode} → {a.toCity || a.toCode}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 4 }}>
                        Max €{a.maxPrice || '∞'} · Alertă la -{a.threshold || 25}%
                        {a.email && ` · ${a.email}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={kiwiLink(a.fromCode, a.toCode, '')} target="_blank" rel="noopener"
                        style={{ background: '#ff6c2f', color: 'white', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
                        Caută ↗
                      </a>
                      <button onClick={() => deleteAlert(a.id)}
                        style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--c-muted)' }}>
                        Șterge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info box */}
            <div style={{ marginTop: 32, background: 'var(--c-paper)', border: '1px solid var(--c-border)', borderRadius: 16, padding: 20, fontSize: 14, color: 'var(--c-muted)' }}>
              <div style={{ fontWeight: 600, color: 'var(--c-ink)', marginBottom: 8 }}>Cum funcționează alertele</div>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Verificăm prețurile de 2x pe zi prin Kiwi.com API (Ryanair + Wizz + 750 companii)</li>
                <li>Când prețul scade sub pragul setat, primești email instant</li>
                <li>Link-urile din email au afiliat inclus automat — Kiwi.com + Booking.com</li>
                <li>Funcționează și pentru "Oriunde" — prinde orice deal din Europa</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--c-border)', padding: '24px 20px', textAlign: 'center', fontSize: 12, color: 'var(--c-muted)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          FlyDeal · Prețuri prin Kiwi.com · Cazări prin Booking.com
          <span style={{ margin: '0 8px' }}>·</span>
          Linkurile de rezervare pot conține ID-uri de afiliat prin care primim comision, fără cost suplimentar pentru tine.
        </div>
      </footer>

      {/* Alert modal */}
      {alertFlight && (
        <AlertModal flight={alertFlight} onClose={() => setAlertFlight(null)} onSave={saveAlert} />
      )}

      {/* AI Chat Agent */}
      <AIChat onParamsReady={handleAgentParams} />
    </div>
  )
}
