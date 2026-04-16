'use client'
import { useState, useEffect } from 'react'

const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || '123456'

function bookingLink(city, checkin) {
  return `https://www.booking.com/searchresults.ro.html?ss=${encodeURIComponent(city)}&checkin=${checkin || ''}&group_adults=2&no_rooms=1&aid=${BOOKING_AID}&label=flydeal-hotdeal`
}

function formatDuration(seconds) {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function DealCard({ deal, index }) {
  const dep = new Date(deal.departure)
  const dateLabel = dep.toLocaleDateString('ro', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeLabel = dep.toLocaleTimeString('ro', { hour: '2-digit', minute: '2-digit' })
  const isUnder10 = deal.price <= 10

  return (
    <div
      className="fade-up"
      style={{
        animationDelay: `${index * 0.06}s`,
        opacity: 0,
        background: 'white',
        border: `1.5px solid ${isUnder10 ? '#f5c6c0' : 'var(--c-border)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'transform 0.18s, box-shadow 0.18s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Airline color strip + name */}
      <div style={{
        background: deal.airlineColor || '#333',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          color: 'white', fontSize: 12, fontWeight: 700,
          fontFamily: 'var(--font-display)', letterSpacing: '0.02em',
        }}>
          {deal.airlineName}
        </span>
        {isUnder10 && (
          <span style={{
            background: 'rgba(255,255,255,0.22)',
            color: 'white', fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 100,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.05em',
          }}>
            OFERTĂ EXCEPȚIONALĂ
          </span>
        )}
        {!isUnder10 && deal.stops === 0 && (
          <span style={{
            background: 'rgba(255,255,255,0.18)',
            color: 'white', fontSize: 10, fontWeight: 600,
            padding: '2px 8px', borderRadius: 100,
            fontFamily: 'var(--font-display)',
          }}>
            DIRECT
          </span>
        )}
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Price — big and proud */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 800,
            color: isUnder10 ? 'var(--c-accent)' : 'var(--c-ink)',
            lineHeight: 1,
          }}>
            €{deal.price}
          </span>
          <span style={{ fontSize: 13, color: 'var(--c-muted)', fontWeight: 400 }}>
            ≈ {deal.priceRON} lei · per persoană
          </span>
        </div>

        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
              {deal.from.code}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
              {deal.from.city}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--c-muted)', marginBottom: 3 }}>
              {formatDuration(deal.duration)}{deal.stops === 0 ? ' · direct' : ` · ${deal.stops} esc.`}
            </div>
            <div style={{ height: 1, background: 'var(--c-border)', position: 'relative' }}>
              <span style={{ position: 'absolute', right: -2, top: -6, fontSize: 11 }}>✈</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
              {deal.to.code}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
              {deal.to.city}
            </div>
          </div>
        </div>

        {/* Date + time */}
        <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 14 }}>
          {dateLabel} · {timeLabel}
          {deal.to.country ? ` · ${deal.to.country}` : ''}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {/* Direct airline button — primary */}
          <a
            href={deal.bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              background: deal.airlineColor || 'var(--c-ink)',
              color: 'white',
              padding: '11px 16px',
              borderRadius: 11,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.01em',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Rezervă pe {deal.airlineName} ↗
          </a>

          {/* Cazare Booking — secondary */}
          <a
            href={bookingLink(deal.to.city, deal.departure?.slice(0, 10))}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'transparent',
              color: '#003580',
              padding: '9px 16px',
              borderRadius: 11,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
              border: '1px solid #ccd9f0',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f4fc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            🏨 Cazare în {deal.to.city} — Booking.com ↗
          </a>
        </div>
      </div>
    </div>
  )
}

function DealSkeleton() {
  return (
    <div style={{ background: 'white', border: '1px solid var(--c-border)', borderRadius: 16, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 38 }} />
      <div style={{ padding: '14px 16px' }}>
        <div className="skeleton" style={{ height: 36, width: '45%', marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 20, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 42, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 38 }} />
      </div>
    </div>
  )
}

export default function HotDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [error, setError] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadDeals()
  }, [])

  async function loadDeals() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/deals')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setDeals(data.deals || [])
      setIsMock(data.isMock || false)
      setFetchedAt(data.fetchedAt)
    } catch {
      setError(true)
      setDeals([])
    }
    setLoading(false)
  }

  // Nu afisa sectiunea daca nu sunt oferte si nu se incarca
  if (!loading && !error && deals.length === 0) return null

  const visibleDeals = showAll ? deals : deals.slice(0, 6)
  const under10 = deals.filter(d => d.price <= 10).length

  return (
    <section style={{ marginBottom: 48 }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 4vw, 26px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              Oferte de neratat
            </h2>
            {!loading && under10 > 0 && (
              <span style={{
                background: 'var(--c-accent)', color: 'white',
                fontSize: 11, fontWeight: 700, padding: '3px 10px',
                borderRadius: 100, fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em',
              }}>
                {under10} sub 10 €
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: 'var(--c-muted)', margin: 0 }}>
            Zboruri din România sub 15 € · actualizat automat la fiecare 4 ore
            {isMock && <span style={{ color: 'var(--c-accent)', marginLeft: 6 }}>· date demo</span>}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {fetchedAt && (
            <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>
              Actualizat: {new Date(fetchedAt).toLocaleTimeString('ro', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={loadDeals}
            disabled={loading}
            style={{
              background: 'none', border: '1px solid var(--c-border)',
              borderRadius: 10, padding: '7px 14px', cursor: loading ? 'default' : 'pointer',
              fontSize: 12, color: 'var(--c-muted)', fontFamily: 'var(--font-body)',
              transition: 'all 0.15s', opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--c-ink)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)' }}
          >
            {loading ? 'Se actualizează...' : '↻ Actualizează'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div style={{
          background: '#fff8e1', border: '1px solid #ffe082',
          borderRadius: 12, padding: '14px 18px', fontSize: 14, color: '#7b5800',
        }}>
          Nu s-au putut încărca ofertele. Încearcă din nou.
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {loading
          ? [1, 2, 3, 4, 5, 6].map(i => <DealSkeleton key={i} />)
          : visibleDeals.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)
        }
      </div>

      {/* Show more */}
      {!loading && deals.length > 6 && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              background: 'none', border: '1px solid var(--c-border)',
              borderRadius: 12, padding: '10px 28px', cursor: 'pointer',
              fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--c-ink)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-ink)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--c-ink)' }}
          >
            {showAll ? `↑ Arată mai puțin` : `↓ Arată toate ${deals.length} ofertele`}
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 16, lineHeight: 1.6 }}>
        Prețurile sunt afișate per persoană, fără bagaj de cală. Linkurile duc direct pe site-ul companiei aeriene,
        fără comision intermediar. Cazările Booking.com pot conține link de afiliat.
        Prețurile se pot modifica în orice moment.
      </p>
    </section>
  )
}
