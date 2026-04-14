import { NextResponse } from 'next/server'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_KEY = process.env.GROQ_API_KEY || ''

const AIRPORT_LIST = `
OTP = București, CLJ = Cluj-Napoca, TSR = Timișoara, IAS = Iași,
BCN = Barcelona, MAD = Madrid, LIS = Lisabona, CDG = Paris,
AMS = Amsterdam, FCO = Roma, MXP = Milano, LTN = Londra,
STN = Londra Stansted, BER = Berlin, VIE = Viena, ATH = Atena,
DUB = Dublin, PRG = Praga, BUD = Budapesta, WAW = Varșovia,
anywhere = oriunde / orice destinație
`

const SYSTEM_PROMPT = `Ești un asistent de călătorie prietenos pentru FlyDeal, o aplicație românească de monitorizare zboruri ieftine. Vorbești DOAR în română, într-un ton cald și entuziast.

Scopul tău: ajuți utilizatorul să găsească cel mai bun zbor punând maxim 3-4 întrebări scurte, una câte una. Nu pune mai multe întrebări deodată.

Aeroporturi disponibile:
${AIRPORT_LIST}

Întrebările pe care le pui (în ordine, câte una):
1. De unde pleacă (oraș sau aeroport din România)
2. Unde vrea să ajungă — dacă e flexibil, sugerează "oriunde" pentru cele mai ieftine oferte
3. Când e disponibil — dacă e flexibil, explică că poți căuta "oricând în 2026"
4. Care e bugetul maxim per persoană în euro (dacă nu știe, sugerează 50-100€)

Când ai toate informațiile necesare, răspunde cu un JSON special în acest format EXACT (pe o linie separată, după mesajul tău):
FLYDEAL_PARAMS:{"from":"OTP","to":"BCN","dateFrom":"2026-05-01","dateTo":"2026-05-31","anyYearFrom":false,"anyYearTo":false,"maxPrice":80}

Reguli pentru JSON:
- "from": codul IATA din lista de mai sus (implicit OTP dacă nu specifică)
- "to": codul IATA sau "anywhere" dacă e flexibil
- "dateFrom": data de start în format YYYY-MM-DD (prima zi din luna menționată dacă spune o lună)
- "dateTo": data de end în format YYYY-MM-DD (ultima zi din luna menționată)
- "anyYearFrom": true dacă e complet flexibil la plecare
- "anyYearTo": true dacă e flexibil la întoarcere sau dacă anyYearFrom e true
- "maxPrice": număr întreg în euro, null dacă nu are limită

După ce trimiți parametrii, adaugă un mesaj entuziast scurt de genul "Caut cele mai bune oferte pentru tine! 🛫"

Dacă utilizatorul menționează o destinație vagă (ex: "ceva cald", "o capitală europeană", "undeva ieftin"), alege "anywhere" și menționează că vei găsi cele mai ieftine opțiuni.

Fii concis — mesajele tale să fie scurte, max 2-3 propoziții.`

export async function POST(req) {
  try {
    const { messages } = await req.json()

    if (!GROQ_KEY) {
      // Fallback simplu fără AI când nu e configurat key-ul
      return NextResponse.json({
        message: getDemoResponse(messages),
        params: null,
      })
    }

    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    const rawContent = data.choices?.[0]?.message?.content || ''

    // Extract FLYDEAL_PARAMS from response if present
    let params = null
    let message = rawContent

    const paramMatch = rawContent.match(/FLYDEAL_PARAMS:(\{[^\n]+\})/)
    if (paramMatch) {
      try {
        params = JSON.parse(paramMatch[1])
        // Remove the JSON line from the displayed message
        message = rawContent.replace(/FLYDEAL_PARAMS:\{[^\n]+\}/, '').trim()
      } catch {}
    }

    return NextResponse.json({ message, params })
  } catch (err) {
    console.error('Agent error:', err)
    return NextResponse.json(
      { message: 'Îmi pare rău, am o problemă tehnică momentan. Poți folosi formularul de căutare direct.', params: null },
      { status: 500 }
    )
  }
}

// Simple rule-based fallback when no API key configured
function getDemoResponse(messages) {
  const count = messages.filter(m => m.role === 'user').length
  const responses = [
    'Salut! Sunt asistentul tău de călătorie FlyDeal 👋 De unde pleci? (ex: București, Cluj, Timișoara)',
    'Super! Și unde vrei să ajungi? Dacă ești flexibil, pot căuta cele mai ieftine destinații din Europa.',
    'Când ești disponibil? Poți da o lună (ex: "mai", "august") sau bifează "Oricând" pentru maxim flexibilitate.',
    'Care e bugetul tău maxim per bilet, în euro? (ex: 50€, 100€)',
    'Notă: Configurează GROQ_API_KEY în Vercel pentru un agent AI real! Între timp, folosește formularul de mai sus.',
  ]
  return responses[Math.min(count, responses.length - 1)]
}
