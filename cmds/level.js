const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75
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

    // 1. Ganancia de XP Silenciosa
    const xpGanada = Math.floor(Math.random() * 11) + 10
    user.exp += xpGanada

    // 2. Subida de Nivel Silenciosa
    while (canLevelUp(user.level, user.exp, nuevoMultiplicador)) {
        user.level++
        const coinBonus = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000
        user.coins = (user.coins || 0) + coinBonus
    }

    const { min, max } = xpRange(user.level, nuevoMultiplicador)
    user.minxp = min
    user.maxxp = max

    // --- 3. RESPUESTA VISUAL (Comando !lvl o !level) ---
    if (m.text.startsWith('!lvl') || m.text.startsWith('!level')) {
        const xpEnEsteNivel = user.exp - min
        const xpNecesariaEnEsteNivel = max - min
        
        // Evitamos división por cero o números negativos
        const porcentaje = Math.max(0, Math.min(100, (xpEnEsteNivel / xpNecesariaEnEsteNivel) * 100))
        const progresoCeldas = Math.min(10, Math.floor(porcentaje / 10))
        const progressBar = "▓".repeat(progresoCeldas) + "░".repeat(10 - progresoCeldas)
        
        // El cálculo que te salía negativo, ahora blindado:
        const faltaXp = Math.max(0, max - user.exp)

        let txt = `﹒⌗﹒🌿 .ৎ˚₊‧  *ESTADO DE NIVEL* ♡\n\n`
        txt += `✿ *Usuario:* @${m.sender.split('@')[0]}\n`
        txt += `✧ *Nivel:* ${user.level}\n`
        txt += `✩ *Exp Total:* ${user.exp}\n`
        txt += `✔ *Comandos:* ${user.usedcommands || 0}\n\n`
        txt += `➩ *Progreso:* [${progressBar}] ${Math.floor(porcentaje)}%\n`
        
        if (faltaXp > 0) {
            txt += `> Te faltan *${faltaXp}* puntos de XP para el nivel ${user.level + 1} ꕤ`
        } else {
            txt += `> ¡Estás a un mensaje de subir de nivel! ✨`
        }

        return m.reply(txt, null, { mentions: [m.sender] })
    }
}
