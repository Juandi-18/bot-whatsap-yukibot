const onlyowner = {
    command: ['onlyowner', 'modoprivado'],
    category: 'owner',
    // Mantenemos esto por seguridad del motor del bot
    isOwner: true, 
    run: async (client, m, args) => {
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const sender = m.sender;

        // 1. DEFINIR QUIÉNES SON LOS DUEÑOS (Igual que en tu main.js)
        const settings = global.db.data.settings[botJid] || {};
        const isOwners = [
            botJid, 
            ...(settings.owner ? [settings.owner] : []), 
            ...global.owner.map(num => num + '@s.whatsapp.net')
        ].includes(sender);

        const isBot = m.key.fromMe; // Verifica si el mensaje viene del propio bot

        // 2. VALIDACIÓN DE SEGURIDAD PERSONALIZADA
        if (!isOwners && !isBot) {
            return client.reply(m.chat, `❌ Solo el bot o el dueño pueden usar este comando`, m);
        }

        // 3. LÓGICA DEL COMANDO (Solo llega aquí si es dueño o el bot)
        if (!args || args.length === 0 || !args[0]) {
            return client.reply(m.chat, `🔒 *Estado actual:* ${settings.onlyOwnerMode ? 'ACTIVADO' : 'DESACTIVADO'}\n\nUso correcto:\n*!onlyowner on*\n*!onlyowner off*`, m);
        }

        const choice = args[0].toLowerCase();

        if (choice === 'on') {
            settings.onlyOwnerMode = true;
            await client.reply(m.chat, `✅ **Modo Privado ACTIVADO.**\nAhora el bot solo responderá a dueños.`, m);
        } else if (choice === 'off') {
            settings.onlyOwnerMode = false;
            await client.reply(m.chat, `✅ **Modo Privado DESACTIVADO.**\nEl bot ahora es público.`, m);
        } else {
            await client.reply(m.chat, `⚠️ Opción no válida. Usa *on* o *off*.`, m);
        }

        // Guardar cambios en la base de datos
        global.db.data.settings[botJid] = settings;
    }
};

export default onlyowner;
