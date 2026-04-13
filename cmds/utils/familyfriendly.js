export default {
    command: ['familyfriendly', 'ff'],
    category: 'owner', 
    run: async (client, m, args, usedPrefix, command, text) => {
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const owners = [
            botJid, 
            ...global.owner.map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        ];
        const isOwners = owners.map(v => client.decodeJid(v)).includes(client.decodeJid(m.sender));

        // --- BLOQUEO DE SEGURIDAD ---
        if (!isOwners && !m.key.fromMe) {
            return m.reply('《✧》 Este comando es exclusivo de mi *Creador*. ♡');
        }

        const chat = global.db.data.chats[m.chat] || {};
        
        if (!args[0]) return m.reply(`*¿Cómo usar?*\n${usedPrefix + command} on\n${usedPrefix + command} off`);

        if (args[0] === 'on') {
            chat.familyFriendly = true;
            m.reply('✅ *Modo Family Friendly activado.*\nLos comandos NSFW y de búsqueda de imágenes han sido desactivados para los usuarios.');
        } else if (args[0] === 'off') {
            chat.familyFriendly = false;
            m.reply('❌ *Modo Family Friendly desactivado.*');
        } else {
            m.reply('⚠️ Opción inválida. Usa `on` o `off`.');
        }
    }
};
