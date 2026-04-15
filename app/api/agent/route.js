import { NextResponse } from 'next/server'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_KEY = process.env.GROQ_API_KEY || ''

const AIRPORT_LIST = `
OTP = București | CLJ = Cluj-Napoca | TSR = Timișoara | IAS = Iași |
BCN = Barcelona | MAD = Madrid | LIS = Lisabona | CDG = Paris |
AMS = Amsterdam | FCO = Roma | MXP = Milano | LTN = Londra |
STN = Londra Stansted | BER = Berlin | VIE = Viena | ATH = Atena |
DUB = Dublin | PRG = Praga | BUD = Budapesta | WAW = Varșovia |
anywhere = oriunde în Europa (cel mai ieftin zbor disponibil)
`

function buildSystemPrompt(locationContext) {
  const locLine = locationContext
    ? `Locatia detectata a utilizatorului: ${locationContext.city || ''}${locationContext.region ? ', ' + locationContext.region : ''}, ${locationContext.country || 'Romania'}. Cel mai apropiat aeroport: ${locationContext.airport.city} (${locationContext.airport.code}).`
    : `Nu s-a putut detecta locatia. Presupune ca utilizatorul se afla in Bucuresti (OTP).`

  const year = new Date().getFullYear()

  return `Esti un asistent de calatorie pentru FlyDeal — o aplicatie care gaseste cele mai ieftine zboruri din Europa, inclusiv oferte Ryanair si Wizz Air.

${locLine}

Vorbesti EXCLUSIV in limba romana cu diacritice corecte (ă, â, î, ș, ț). Tonul tau este cald, prietenos si profesional.

REGULI DE FORMATARE — respecta-le fara exceptie:
- Fiecare idee sau intrebare se afla pe o linie separata.
- Intre paragrafe exista un rand gol.
- Nu scriei mai mult de 4 randuri per mesaj.
- Gramatica este impecabila: diacritice corecte, punctuatie corecta, propozitii complete.
- Pui O SINGURA intrebare per mesaj.
- Nu folosi asteriscuri, liniute de lista sau markdown — doar text simplu structurat pe randuri.

FLUXUL CONVERSATIEI:

Pasul 1 — Salut si confirmare locatie:
Saluta utilizatorul si confirma aeroportul detectat automat.
Intreaba daca doreste sa plece din acel aeroport sau din altul.

Pasul 2 — Destinatie:
Intreaba unde doreste sa ajunga.
Daca este flexibil, sugereaza optiunea oriunde in Europa pentru cele mai mici preturi.

Pasul 3 — Perioada:
Intreaba in ce perioada doreste sa calatoreasca.
Daca nu are data fixa, mentioneaza ca poate cauta oricand in ${year}.

Pasul 4 — Buget:
Intreaba care este bugetul maxim per persoana in euro.
Daca ezita, sugereaza ca intre 30 si 100 euro se gasesc cele mai bune oferte low-cost.

EXTRAGEREA PARAMETRILOR:
Cand ai toate 4 informatii, trimite parametrii pe o linie separata la finalul mesajului:

FLYDEAL_PARAMS:{"from":"OTP","to":"BCN","dateFrom":"2026-05-01","dateTo":"2026-05-31","anyYearFrom":false,"anyYearTo":false,"maxPrice":80}

Reguli JSON:
- from: codul IATA al aeroportului de plecare
- to: codul IATA sau "anywhere" daca e flexibil
- dateFrom: prima zi a perioadei YYYY-MM-DD
- dateTo: ultima zi a perioadei YYYY-MM-DD
- anyYearFrom: true daca e complet flexibil la plecare
- anyYearTo: true daca e flexibil si la intoarcere
- maxPrice: numar intreg in euro sau null

Dupa linia cu parametrii adauga un mesaj scurt entuziast, de exemplu:
"Excelent! Caut acum cele mai bune oferte pentru tine. Formularul a fost completat automat."

AEROPORTURI DISPONIBILE:
${AIRPORT_LIST}`
}

export async function POST(req) {
  try {
    const { messages, location } = await req.json()

    if (!GROQ_KEY) {
      return NextResponse.json({
        message: getDemoResponse(messages, location),
        params: null,
      })
    }

    const systemPrompt = buildSystemPrompt(location)

    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error: ${res.status}`)
    }

    const data = await res.json()
    const rawContent = data.choices?.[0]?.message?.content || ''

    let params = null
    let message = rawContent

    const paramMatch = rawContent.match(/FLYDEAL_PARAMS:(\{[^\n]+\})/)
    if (paramMatch) {
      try {
        params = JSON.parse(paramMatch[1])
        message = rawContent.replace(/FLYDEAL_PARAMS:\{[^\n]+\}/, '').trim()
      } catch (e) {
        console.error('Failed to parse params:', e)
      }
    }

    return NextResponse.json({ message, params })
  } catch (err) {
    console.error('Agent error:', err)
    return NextResponse.json(
      {
        message: 'Îmi pare rău, am întâmpinat o problemă tehnică.\n\nPoți folosi formularul de căutare direct sau încearcă din nou în câteva secunde.',
        params: null,
      },
      { status: 500 }
    )
  }
}

function getDemoResponse(messages, location) {
  const count = messages.filter(m => m.role === 'user').length
  const airport = location?.airport || { code: 'OTP', city: 'București' }
  const city = location?.city || airport.city
  const year = new Date().getFullYear()

  const responses = [
    `Bună ziua! Sunt asistentul de călătorie FlyDeal. 👋\n\nAm detectat că te afli în ${city}. Cel mai apropiat aeroport este ${airport.city} (${airport.code}).\n\nDorești să pleci din ${airport.city}, sau preferi un alt aeroport?`,
    `Înțeles!\n\nUndeva anume ai în vedere, sau ești flexibil în privința destinației?\n\nDacă nu ai o preferință clară, pot căuta cele mai ieftine zboruri disponibile oriunde în Europa.`,
    `Bine!\n\nÎn ce perioadă ești disponibil pentru această călătorie?\n\nDacă nu ai date fixe, pot căuta oricând în ${year} pentru a găsi cele mai bune prețuri.`,
    `Aproape gata!\n\nCare este bugetul tău maxim pentru biletul de avion, per persoană?\n\nÎntre 30 € și 100 € se găsesc de obicei cele mai bune oferte low-cost.`,
    `Notă: pentru a activa asistentul AI complet, adaugă variabila GROQ_API_KEY în setările Vercel.\n\nÎntre timp, poți folosi formularul de căutare din pagină.`,
  ]

  return responses[Math.min(count, responses.length - 1)]
}
