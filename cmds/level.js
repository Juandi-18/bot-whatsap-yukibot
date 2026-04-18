const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75
const nuevoMultiplicador = 10 // Mantenemos tu dificultad Hard

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
    if (!user) return
    
    if (typeof user.exp !== 'number') user.exp = 0
    if (typeof user.level !== 'number') user.level = 0

    // Ganancia de XP
    user.exp += Math.floor(Math.random() * 11) + 10

    // Subida de nivel automática
    while (canLevelUp(user.level, user.exp, nuevoMultiplicador)) {
        user.level++
        const coinBonus = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000
        user.coins = (user.coins || 0) + coinBonus
    }
}
