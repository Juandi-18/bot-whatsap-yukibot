const onlyowner = {
    command: ['onlyowner', 'modoprivado'],
    category: 'owner',
    isOwner: true, 
    run: async (client, m, args, usedPrefix, command, text) => {
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Verificación de seguridad para la base de datos
        if (!global.db.data.settings) global.db.data.settings = {};
        if (!global.db.data.settings[botJid]) global.db.data.settings[botJid] = {};
        
        const settings = global.db.data.settings[botJid];

        // Validamos si args existe y tiene contenido antes de leer el índice 0
        if (!args || args.length === 0 || !args[0]) {
            return client.reply(m.chat, `🔒 *Estado actual:* ${settings.onlyOwnerMode ? 'ACTIVADO' : 'DESACTIVADO'}\n\nUso correcto:\n*!onlyowner on*\n*!onlyowner off*`, m);
        }

        const choice = args[0].toLowerCase();

        if (choice === 'on') {
            settings.onlyOwnerMode = true;
            await client.reply(m.chat, `✅ **Modo Privado ACTIVADO.**\nSolo dueños pueden usar el bot ahora.`, m);
        } else if (choice === 'off') {
            settings.onlyOwnerMode = false;
            await client.reply(m.chat, `✅ **Modo Privado DESACTIVADO.**\nEl bot vuelve a ser público.`, m);
        } else {
            await client.reply(m.chat, `⚠️ Opción no válida. Usa *on* o *off*.`, m);
        }
    }
};

export default onlyowner;
