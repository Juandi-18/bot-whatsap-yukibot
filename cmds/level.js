const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75
// Hemos fijado el multiplicador en 10 para quintuplicar la dificultad base
const nuevoMultiplicador = 10 

function xpRange(level, multiplier = nuevoMultiplicador) {
    if (level < 0) throw new TypeError('level cannot be negative value')
    level = Math.floor(level)
    const min = level === 0 ? 0 : Math.round(Math.pow(level, growth) * multiplier) + 1
    const max = Math.round(Math.pow(level + 1, growth) * multiplier)
    return { min, max, xp: max - min }
}

function findLevel(xp, multiplier = nuevoMultiplicador) {
    if (xp === Infinity) return Infinity
    if (isNaN(xp)) return NaN
    if (xp <= 0) return 0
    let level = 0
    while (xpRange(level, multiplier).min <= xp) { level++ }
    return --level
}

function canLevelUp(level, xp, multiplier = nuevoMultiplicador) {
    if (level < 0) return false
    if (xp === Infinity) return true
    if (isNaN(xp)) return false
    if (xp <= 0) return false
    return level < findLevel(xp, multiplier)
}

export default async (m) => {
    const db = global.db.data
    const user = db.users[m.sender]
    
    if (typeof user.exp !== 'number') user.exp = 0
    if (typeof user.level !== 'number') user.level = 0

    // Sigues ganando la misma XP (10-20), pero ahora los niveles piden 5 veces más
    const xpGanada = Math.floor(Math.random() * 11) + 10
    user.exp += xpGanada

    // Actualización silenciosa (sin mensajes)
    while (canLevelUp(user.level, user.exp, nuevoMultiplicador)) {
        user.level++
        
        // Bono de monedas por el esfuerzo extra
        const coinBonus = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000
        user.coins = (user.coins || 0) + coinBonus
    }

    const { min, max } = xpRange(user.level, nuevoMultiplicador)
    user.minxp = min
    user.maxxp = max
}
