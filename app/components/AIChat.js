'use client'
import { useState, useRef, useEffect } from 'react'

const QUICK_REPLIES = [
  'Vreau ceva ieftin oriunde în Europa',
  'Zbor din București săptămâna viitoare',
  'Destinație caldă în august, max 80€',
  'Cea mai ieftină opțiune disponibilă',
]

export default function AIChat({ onParamsReady }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [pulse, setPulse] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Stop pulsing after 6 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000)
    return () => clearTimeout(t)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open && !done) {
      setTimeout(() => inputRef.current?.focus(), 100)
      // Send initial greeting if no messages yet
      if (messages.length === 0) sendMessage(null, true)
    }
  }, [open])

  async function sendMessage(userText, isGreeting = false) {
    const text = userText || input.trim()
    if (!text && !isGreeting) return

    const newMessages = isGreeting
      ? []
      : [...messages, { role: 'user', content: text }]

    if (!isGreeting) {
      setMessages(newMessages)
      setInput('')
    }

    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()

      const updatedMessages = isGreeting
        ? [{ role: 'assistant', content: data.message }]
        : [...newMessages, { role: 'assistant', content: data.message }]

      setMessages(updatedMessages)

      // If agent extracted flight params, fill the form
      if (data.params) {
        setDone(true)
        setTimeout(() => {
          onParamsReady(data.params)
          // Close chat after short delay
          setTimeout(() => setOpen(false), 1200)
        }, 600)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Scuze, ceva nu a mers. Încearcă din nou sau folosește formularul direct.'
      }])
    }
    setLoading(false)
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
    setTimeout(() => sendMessage(null, true), 100)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--c-accent)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          zIndex: 300,
          boxShadow: '0 4px 20px rgba(232,68,10,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = open ? 'rotate(45deg) scale(1.1)' : 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(232,68,10,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = open ? 'rotate(45deg)' : 'rotate(0deg)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(232,68,10,0.4)' }}
        title="Asistent AI de călătorie"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Pulse ring */}
      {!open && pulse && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: '50%', border: '2px solid var(--c-accent)',
          zIndex: 299, pointerEvents: 'none',
          animation: 'chatPulse 1.5s ease-out infinite',
        }} />
      )}

      {/* Tooltip */}
      {!open && pulse && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24,
          background: 'var(--c-ink)', color: 'white',
          fontSize: 13, fontWeight: 500, padding: '8px 14px',
          borderRadius: 10, zIndex: 299, pointerEvents: 'none',
          whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}>
          Lasă-mă să caut pentru tine 🛫
          <div style={{
            position: 'absolute', bottom: -6, right: 20,
            width: 12, height: 12, background: 'var(--c-ink)',
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
          width: 'min(380px, calc(100vw - 48px))',
          height: 'min(520px, calc(100vh - 140px))',
          background: 'var(--c-card)',
          border: '1px solid var(--c-border)',
          borderRadius: 20,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          animation: 'chatOpen 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Header */}
          <div style={{
            background: 'var(--c-ink)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--c-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>✦</div>
              <div>
                <div style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
                  Asistent FlyDeal
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  Powered by Groq · Llama 3.1
                </div>
              </div>
            </div>
            {done && (
              <button onClick={reset}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: 11, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Resetează
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, padding: '20px 0' }}>
                Se inițializează...
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  background: msg.role === 'user'
                    ? 'var(--c-accent)'
                    : 'var(--c-paper)',
                  color: msg.role === 'user' ? 'white' : 'var(--c-ink)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  border: msg.role === 'assistant' ? '1px solid var(--c-border)' : 'none',
                  fontFamily: 'var(--font-body)',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  background: 'var(--c-paper)',
                  border: '1px solid var(--c-border)',
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
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

            {/* Success message */}
            {done && !loading && (
              <div style={{
                background: 'var(--c-success-bg)',
                border: '1px solid #a7d7b8',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--c-success)',
                fontWeight: 500,
                textAlign: 'center',
              }}>
                ✅ Formularul a fost completat! Căutarea pornește...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick replies - show only at start */}
          {messages.length <= 1 && !loading && !done && (
            <div style={{
              padding: '0 12px 8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              flexShrink: 0,
            }}>
              {QUICK_REPLIES.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  style={{
                    background: 'var(--c-paper)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 100,
                    padding: '5px 11px',
                    fontSize: 12,
                    cursor: 'pointer',
                    color: 'var(--c-ink)',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.15s',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-accent)'; e.currentTarget.style.color = 'var(--c-accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-ink)' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {!done && (
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--c-border)',
              display: 'flex',
              gap: 8,
              flexShrink: 0,
              background: 'var(--c-card)',
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
                  height: 40,
                  padding: '0 14px',
                  borderRadius: 20,
                  border: '1px solid var(--c-border)',
                  fontSize: 14,
                  background: 'var(--c-paper)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--c-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: input.trim() && !loading ? 'var(--c-accent)' : 'var(--c-border)',
                  border: 'none',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}>
                ↑
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.85) translateY(20px); transform-origin: bottom right; }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
