export default {
    command: ['groupimage', 'groupimg', 'setppgc'],
    category: 'grupo',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, { args, usedPrefix, command, text }) => { // Estructura run actualizada para main.js
        try {
            // 1. Verificamos si hay una imagen
            const q = m.quoted ? m.quoted : m;
            const mime = (q.msg || q).mimetype || q.mediaType || '';

            if (!/image/.test(mime)) {
                return m.reply(`《✧》 Responde a una imagen o envíala con el comando *${usedPrefix + command}* para cambiar el perfil del grupo. ♡`);
            }

            // 2. Descargamos la imagen
            const img = await q.download();
            if (!img) return m.reply('《✧》 Error: No se pudo procesar la imagen seleccionada. ♡');

            // 3. Enviamos la actualización al servidor de WhatsApp
            // Usamos m.chat (el JID del grupo) y el buffer de la imagen
            await client.updateProfilePicture(m.chat, img);

            // 4. Confirmación con Gatitos
            await m.reply('✿ ¡Perfecto! La imagen del grupo ha sido actualizada con éxito. ꕤ');

        } catch (e) {
            console.error("ERROR EN GROUPIMAGE:", e);
            
            // Error común: WhatsApp rechaza imágenes si no son cuadradas o son muy pesadas
            if (e.message.includes('bad-request')) {
                return m.reply('⚠️ Error: WhatsApp rechazó la imagen. Intenta con una imagen cuadrada o más pequeña. ♡');
            }

            // Mensaje de error genérico con gatito
            return m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists. ♡\n> [Error: *${e.message}*]`);
        }
    },
};
