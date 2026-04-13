export const STORAGE_KEY = 'flydeal_alerts'
export const HISTORY_KEY = 'flydeal_price_history'

export function getAlerts() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function saveAlert(alert) {
  const alerts = getAlerts()
  const newAlert = { ...alert, id: Date.now().toString(), createdAt: new Date().toISOString(), active: true }
  alerts.push(newAlert)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
  return newAlert
}

export function deleteAlert(id) {
  const alerts = getAlerts().filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

export function toggleAlert(id) {
  const alerts = getAlerts().map(a => a.id === id ? { ...a, active: !a.active } : a)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

export function getPriceHistory(routeKey) {
  if (typeof window === 'undefined') return []
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
    return history[routeKey] || []
  } catch { return [] }
}

export function recordPrice(routeKey, price) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
    if (!history[routeKey]) history[routeKey] = []
    history[routeKey].push({ price, date: new Date().toISOString() })
    if (history[routeKey].length > 90) history[routeKey].shift()
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {}
}

export function getAveragePrice(routeKey) {
  const history = getPriceHistory(routeKey)
  if (!history.length) return null
  return Math.round(history.reduce((s, h) => s + h.price, 0) / history.length)
}

export function isPriceDrop(routeKey, currentPrice, threshold = 25) {
  const avg = getAveragePrice(routeKey)
  if (!avg) return false
  const drop = ((avg - currentPrice) / avg) * 100
  return drop >= threshold
}

export const POPULAR_AIRPORTS = [
  { code: 'OTP', city: 'București', country: 'România', flag: '🇷🇴' },
  { code: 'CLJ', city: 'Cluj-Napoca', country: 'România', flag: '🇷🇴' },
  { code: 'TSR', city: 'Timișoara', country: 'România', flag: '🇷🇴' },
  { code: 'IAS', city: 'Iași', country: 'România', flag: '🇷🇴' },
  { code: 'BCN', city: 'Barcelona', country: 'Spania', flag: '🇪🇸' },
  { code: 'MAD', city: 'Madrid', country: 'Spania', flag: '🇪🇸' },
  { code: 'LIS', city: 'Lisabona', country: 'Portugalia', flag: '🇵🇹' },
  { code: 'CDG', city: 'Paris', country: 'Franța', flag: '🇫🇷' },
  { code: 'AMS', city: 'Amsterdam', country: 'Olanda', flag: '🇳🇱' },
  { code: 'FCO', city: 'Roma', country: 'Italia', flag: '🇮🇹' },
  { code: 'MXP', city: 'Milano', country: 'Italia', flag: '🇮🇹' },
  { code: 'LTN', city: 'Londra', country: 'UK', flag: '🇬🇧' },
  { code: 'STN', city: 'Londra Stansted', country: 'UK', flag: '🇬🇧' },
  { code: 'BER', city: 'Berlin', country: 'Germania', flag: '🇩🇪' },
  { code: 'VIE', city: 'Viena', country: 'Austria', flag: '🇦🇹' },
  { code: 'ATH', city: 'Atena', country: 'Grecia', flag: '🇬🇷' },
  { code: 'DUB', city: 'Dublin', country: 'Irlanda', flag: '🇮🇪' },
  { code: 'PRG', city: 'Praga', country: 'Cehia', flag: '🇨🇿' },
  { code: 'BUD', city: 'Budapesta', country: 'Ungaria', flag: '🇭🇺' },
  { code: 'WAW', city: 'Varșovia', country: 'Polonia', flag: '🇵🇱' },
  { code: 'anywhere', city: 'Oriunde', country: 'Europa', flag: '🌍' },
]
