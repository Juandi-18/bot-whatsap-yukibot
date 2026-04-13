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

        // --- 1. BLOQUEO DE SEGURIDAD ---
        if (!isOwners && !m.key.fromMe) {
            return m.reply('《✧》 Este comando es exclusivo de mi *Creador*. ♡');
        }

        // --- 2. ACCESO A LA BASE DE DATOS DEL CHAT ---
        const chat = global.db.data.chats[m.chat] || {};
        
        if (!args[0]) return m.reply(`*¿Cómo usar?*\n${usedPrefix + command} on\n${usedPrefix + command} off`);

        // --- 3. LÓGICA DE ACTIVACIÓN ---
        if (args[0] === 'on' || args[0] === '1') {
            if (chat.familyFriendly) return m.reply('✅ El modo *Family Friendly* ya estaba activado en este grupo.');
            chat.familyFriendly = true;
            m.reply('✅ *Modo Family Friendly activado.*\n\n> Se han bloqueado los comandos NSFW y se ha activado el filtro de palabras en buscadores (TikTok, YT, etc.) para todos.');
            
        } else if (args[0] === 'off' || args[0] === '0') {
            if (!chat.familyFriendly) return m.reply('❌ El modo *Family Friendly* ya estaba desactivado.');
            chat.familyFriendly = false;
            m.reply('❌ *Modo Family Friendly desactivado.*\nAhora todos los comandos están disponibles nuevamente.');
            
        } else {
            m.reply(`⚠️ Opción inválida. Usa:\n> *${usedPrefix + command} on*\n> *${usedPrefix + command} off*`);
        }
    }
};
