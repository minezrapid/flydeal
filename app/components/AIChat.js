'use client'
import { useState, useRef, useEffect } from 'react'

const QUICK_REPLIES = [
  'Da, plec din acest aeroport',
  'Vreau oriunde ieftin în Europa',
  'Sunt flexibil la date',
  'Buget maxim 80 €',
]

// Redă textul cu \n ca rânduri noi vizibile
function MessageText({ content }) {
  const lines = content.split('\n')
  return (
    <span>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  )
}

export default function AIChat({ onParamsReady }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [pulse, setPulse] = useState(true)
  const [location, setLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const greetingSent = useRef(false)

  // Stop pulsing after 7s
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 7000)
    return () => clearTimeout(t)
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open && !done) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open, done])

  // Detect location + send greeting when chat opens for the first time
  useEffect(() => {
    if (open && messages.length === 0 && !greetingSent.current) {
      greetingSent.current = true
      detectLocationAndGreet()
    }
  }, [open])

  async function detectLocationAndGreet() {
    setLocationLoading(true)
    setLoading(true)

    let detectedLocation = null
    try {
      const res = await fetch('/api/geoip')
      if (res.ok) {
        detectedLocation = await res.json()
        setLocation(detectedLocation)
      }
    } catch {
      // silently ignore — fallback handled in API
    }
    setLocationLoading(false)

    // Trimite salutul cu locatia detectata
    await sendToAgent([], detectedLocation)
  }

  async function sendToAgent(conversationMessages, loc) {
    setLoading(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationMessages,
          location: loc || location,
        }),
      })
      const data = await res.json()

      setMessages(prev => [
        ...conversationMessages.filter(m => !prev.find(p => p === m)),
        ...prev.filter(m => conversationMessages.includes(m)),
        ...conversationMessages,
        { role: 'assistant', content: data.message },
      ])

      // Rebuild messages properly
      setMessages([
        ...conversationMessages,
        { role: 'assistant', content: data.message },
      ])

      if (data.params) {
        setDone(true)
        setTimeout(() => {
          onParamsReady(data.params)
          setTimeout(() => setOpen(false), 1500)
        }, 600)
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Îmi pare rău, am întâmpinat o problemă tehnică.\n\nPoți folosi formularul de căutare direct.',
        },
      ])
    }
    setLoading(false)
  }

  async function sendMessage(userText) {
    const text = (userText || input).trim()
    if (!text) return
    setInput('')

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)

    await sendToAgent(newMessages, location)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function reset() {
    setMessages([])
    setDone(false)
    setInput('')
    greetingSent.current = false
    setTimeout(() => detectLocationAndGreet(), 100)
  }

  // Quick replies — show only after first assistant message, before user replies
  const userCount = messages.filter(m => m.role === 'user').length
  const showQuickReplies = !done && !loading && messages.length > 0 && userCount === 0

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Asistent AI de călătorie"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: open ? 'var(--c-ink)' : 'var(--c-accent)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: open ? 20 : 22,
          zIndex: 300,
          boxShadow: open
            ? '0 4px 20px rgba(15,14,13,0.3)'
            : '0 4px 20px rgba(232,68,10,0.4)',
          transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          color: 'white',
          fontWeight: 700,
        }}
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Pulse ring */}
      {!open && pulse && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          border: '2px solid var(--c-accent)',
          zIndex: 299, pointerEvents: 'none',
          animation: 'chatPulse 1.8s ease-out infinite',
        }} />
      )}

      {/* Tooltip */}
      {!open && pulse && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24,
          background: 'var(--c-ink)', color: 'white',
          fontSize: 13, fontWeight: 500,
          padding: '9px 15px', borderRadius: 12,
          zIndex: 299, pointerEvents: 'none',
          whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          lineHeight: 1.4,
        }}>
          Lasă-mă să caut pentru tine ✈
          <div style={{
            position: 'absolute', bottom: -5, right: 22,
            width: 10, height: 10,
            background: 'var(--c-ink)',
            transform: 'rotate(45deg)', borderRadius: 2,
          }} />
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 92,
          right: 24,
          width: 'min(390px, calc(100vw - 48px))',
          height: 'min(540px, calc(100vh - 130px))',
          background: 'var(--c-card)',
          border: '1px solid var(--c-border)',
          borderRadius: 20,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          animation: 'chatOpen 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* ── Header ── */}
          <div style={{
            background: 'var(--c-ink)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--c-accent)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 17,
                flexShrink: 0, color: 'white', fontWeight: 700,
              }}>✦</div>
              <div>
                <div style={{
                  color: 'white', fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: 15, lineHeight: 1.2,
                }}>
                  Asistent FlyDeal
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
                  {location && !location.fallback
                    ? `📍 ${location.city || location.country} · ${location.airport.code}`
                    : 'Detectez locația ta...'}
                </div>
              </div>
            </div>
            {done && (
              <button onClick={reset} style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 11, padding: '5px 11px',
                borderRadius: 8, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}>
                Conversație nouă
              </button>
            )}
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {/* Loading skeleton la deschidere */}
            {messages.length === 0 && loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 4 }}>
                  {locationLoading ? '📍 Detectez locația ta...' : '💬 Pregătesc răspunsul...'}
                </div>
                {[80, 95, 60].map((w, i) => (
                  <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 7 }} />
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '11px 15px',
                  borderRadius: msg.role === 'user'
                    ? '18px 18px 4px 18px'
                    : '4px 18px 18px 18px',
                  background: msg.role === 'user'
                    ? 'var(--c-accent)'
                    : 'var(--c-paper)',
                  color: msg.role === 'user' ? 'white' : 'var(--c-ink)',
                  fontSize: 14,
                  lineHeight: 1.65,
                  border: msg.role === 'assistant'
                    ? '1px solid var(--c-border)'
                    : 'none',
                  fontFamily: 'var(--font-body)',
                }}>
                  <MessageText content={msg.content} />
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {loading && messages.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '4px 18px 18px 18px',
                  background: 'var(--c-paper)',
                  border: '1px solid var(--c-border)',
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--c-muted)',
                      animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Success */}
            {done && !loading && (
              <div style={{
                background: '#e6f4ec',
                border: '1px solid #a7d7b8',
                borderRadius: 12,
                padding: '11px 15px',
                fontSize: 13,
                color: '#1a7a4a',
                fontWeight: 500,
                lineHeight: 1.5,
                textAlign: 'center',
              }}>
                ✅ Formularul a fost completat automat.<br />
                <span style={{ fontWeight: 400, fontSize: 12 }}>Căutarea pornește în câteva momente...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Quick replies ── */}
          {showQuickReplies && (
            <div style={{
              padding: '4px 12px 8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              flexShrink: 0,
              borderTop: '1px solid var(--c-border)',
            }}>
              <div style={{ width: '100%', fontSize: 11, color: 'var(--c-muted)', padding: '6px 2px 2px', fontWeight: 500 }}>
                Răspunsuri rapide:
              </div>
              {QUICK_REPLIES.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  style={{
                    background: 'var(--c-paper)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 100,
                    padding: '6px 13px',
                    fontSize: 12,
                    cursor: 'pointer',
                    color: 'var(--c-ink)',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.15s',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--c-accent)'
                    e.currentTarget.style.color = 'var(--c-accent)'
                    e.currentTarget.style.background = 'white'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--c-border)'
                    e.currentTarget.style.color = 'var(--c-ink)'
                    e.currentTarget.style.background = 'var(--c-paper)'
                  }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          {!done && (
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--c-border)',
              display: 'flex',
              gap: 8,
              flexShrink: 0,
              background: 'var(--c-card)',
              alignItems: 'center',
            }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Scrie un mesaj..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                style={{
                  flex: 1,
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 21,
                  border: '1px solid var(--c-border)',
                  fontSize: 14,
                  background: 'var(--c-paper)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.15s',
                  color: 'var(--c-ink)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--c-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: input.trim() && !loading
                    ? 'var(--c-accent)'
                    : 'var(--c-border)',
                  border: 'none',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18, color: 'white',
                  transition: 'background 0.15s, transform 0.1s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                ↑
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatPulse {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.88) translateY(16px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
