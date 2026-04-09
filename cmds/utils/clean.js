/**
 * COMANDO: !clean
 * CATEGORÍA: utils
 * REGLAS: 
 * 1. Si no hay cantidad, pide ayuda.
 * 2. Si hay cantidad, borra mensajes desde el último hacia atrás.
 * 3. Requiere que el bot sea admin.
 **/

let handler = async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin }) => {

    // REGLA: Si el usuario solo pone !clean sin número
    if (!text) {
        return conn.reply(m.chat, `ingrese la cantidad de mensajes a eliminar *${usedPrefix + command} + [cantidad]*`, m)
    }

    // Convertir el texto a número y validar
    let count = parseInt(text)
    if (isNaN(count) || count < 1) {
        return conn.reply(m.chat, `❌ El valor *"${text}"* no es un número válido.`, m)
    }
    
    // Límite de seguridad para evitar baneos o bloqueos de Render
    if (count > 100) {
        return conn.reply(m.chat, `❌ Por seguridad, solo puedes borrar hasta *100* mensajes a la vez.`, m)
    }

    // Validaciones de Grupo y Admin
    if (!m.isGroup) return conn.reply(m.chat, '《✧》 Este comando solo funciona en grupos.', m)
    if (!isAdmin) return conn.reply(m.chat, '《✧》 Solo los administradores pueden usar este comando.', m)
    if (!isBotAdmin) return conn.reply(m.chat, '《✧》 Necesito ser administrador para borrar mensajes de otros.', m)

    try {
        // Carga los mensajes (comenzando desde el último enviado)
        let messages = await conn.loadMessages(m.chat, count)
        
        // Ejecuta la eliminación
        for (let msg of messages) {
            await conn.sendMessage(m.chat, { delete: msg.key })
        }

        // Mensaje de confirmación que se borra solo después de 5 segundos
        let { key } = await conn.reply(m.chat, `✅ *Limpieza completada*\nSe eliminaron *${count}* mensajes con éxito.`, m)
        
        setTimeout(async () => {
            await conn.sendMessage(m.chat, { delete: key })
        }, 5000)

    } catch (e) {
        console.error(e)
        conn.reply(m.chat, `❌ Error al intentar borrar los mensajes. Asegúrate de que no sean mensajes muy antiguos.`, m)
    }
}

handler.help = ['clean <cantidad>']
handler.tags = ['utils'] // Aparecerá en la sección de herramientas
handler.command = ['clean', 'borrar'] // Se activa con !clean o !borrar
handler.group = true 
handler.admin = true
handler.botAdmin = true

export default handler
