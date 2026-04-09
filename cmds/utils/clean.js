/**
 * COMANDO: !clean
 * DESCRIPCIÓN: Elimina mensajes del grupo
 * REGLAS: Si no hay texto, pide cantidad. Si hay texto, borra esa cantidad.
 **/

let handler = async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin }) => {

    // REGLA 1: Si el usuario solo pone !clean sin número
    if (!text) {
        return conn.reply(m.chat, `⚠️ *Uso Incorrecto*\n\nIngrese la cantidad de mensajes a eliminar:\n*${usedPrefix + command} [cantidad]*\n\nEjemplo: *${usedPrefix + command} 10*`, m)
    }

    // REGLA 2: Validar que sea un número y esté en un rango seguro
    let count = parseInt(text)
    if (isNaN(count) || count < 1) {
        return conn.reply(m.chat, `❌ El valor *"${text}"* no es un número válido.`, m)
    }
    
    if (count > 100) {
        return conn.reply(m.chat, `❌ Por seguridad, solo puedes borrar hasta *100* mensajes a la vez.`, m)
    }

    // REGLA 3: Verificar permisos de Administrador
    if (!m.isGroup) return conn.reply(m.chat, '《✧》 Este comando solo funciona en grupos.', m)
    if (!isAdmin) return conn.reply(m.chat, '《✧》 Solo los administradores pueden usar este comando.', m)
    if (!isBotAdmin) return conn.reply(m.chat, '《✧》 Necesito ser administrador para borrar mensajes de otros.', m)

    try {
        // Obtenemos los mensajes (loadMessages es compatible con Baileys)
        let messages = await conn.loadMessages(m.chat, count)
        
        // Filtramos para no intentar borrar mensajes del sistema si diera error
        for (let msg of messages) {
            await conn.sendMessage(m.chat, { delete: msg.key })
        }

        // Mensaje de éxito que se auto-elimina para no dejar rastro
        let { key } = await conn.reply(m.chat, `✅ *Limpieza completada*\nSe eliminaron *${count}* mensajes.`, m)
        
        setTimeout(async () => {
            await conn.sendMessage(m.chat, { delete: key })
        }, 5000)

    } catch (e) {
        console.error(e)
        conn.reply(m.chat, `❌ Error al intentar borrar los mensajes. Intenta con una cantidad menor.`, m)
    }
}

handler.help = ['clean <cantidad>']
handler.tags = ['group']
handler.command = ['clean', 'borrar', 'del'] // Puedes usar !clean o !borrar
handler.group = true 
handler.admin = true
handler.botAdmin = true

export default handler
