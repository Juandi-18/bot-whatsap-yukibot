// Constante de crecimiento matemático
const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75

function xpRange(level, multiplier = global.multiplier || 2) {
    if (level < 0) throw new TypeError('level cannot be negative value')
    level = Math.floor(level)
    const min = level === 0 ? 0 : Math.round(Math.pow(level, growth) * multiplier) + 1
    const max = Math.round(Math.pow(level + 1, growth) * multiplier)
    return { min, max, xp: max - min }
}

function findLevel(xp, multiplier = global.multiplier || 2) {
    if (xp === Infinity) return Infinity
    if (isNaN(xp)) return NaN
    if (xp <= 0) return 0
    let level = 0
    while (xpRange(level, multiplier).min <= xp) { level++ }
    return --level
}

function canLevelUp(level, xp, multiplier = global.multiplier || 2) {
    if (level < 0) return false
    if (xp === Infinity) return true
    if (isNaN(xp)) return false
    if (xp <= 0) return false
    return level < findLevel(xp, multiplier)
}

export default async (m) => {
    const db = global.db.data
    const user = db.users[m.sender]
    
    // 1. INICIALIZACIÓN (Si el usuario es nuevo)
    if (typeof user.exp !== 'number') user.exp = 0
    if (typeof user.level !== 'number') user.level = 0

    // 2. SUMA DE EXPERIENCIA (La gasolina que te faltaba)
    // Damos entre 10 y 20 de XP por cada mensaje/comando
    const xpGanada = Math.floor(Math.random() * 11) + 10
    user.exp += xpGanada

    let before = user.level
    
    // 3. VERIFICACIÓN DE SUBIDA DE NIVEL
    while (canLevelUp(user.level, user.exp, global.multiplier)) {
        user.level++
    }

    // 4. PREMIOS POR SUBIR DE NIVEL
    if (before !== user.level) {
        // Bono de monedas (Coins) y XP extra
        const coinBonus = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000
        const expBonus = Math.floor(Math.random() * (500 - 100 + 1)) + 100
        
        // Guardamos las monedas (asegurando que la variable existe)
        user.coins = (user.coins || 0) + coinBonus
        user.exp += expBonus

        const { min, max } = xpRange(user.level, global.multiplier)
        user.minxp = min
        user.maxxp = max

        // Mensaje de felicitación con gatitos
        let txt = `﹒⌗﹒🌿 .ৎ˚₊‧  ¡SUBISTE DE NIVEL! ♡\n\n`
        txt += `✿ \`Nivel anterior:\` ${before}\n`
        txt += `☘️ \`Nivel nuevo:\` ${user.level}\n`
        txt += `✨ \`Bono:\` +${coinBonus} Coins\n\n`
        txt += `> ¡Sigue así para desbloquear más funciones! ꕤ`
        
        m.reply(txt)
    }
}
