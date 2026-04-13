export default {
    command: ['restart', 'reiniciar'],
    category: 'owner',
    isOwner: true, 
    run: async (client, m) => {
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const sender = m.sender;

        // 1. SEGURIDAD: Solo Dueño o el propio Bot
        const settings = global.db.data.settings[botJid] || {};
        const isOwners = [
            botJid, 
            ...(settings.owner ? [settings.owner] : []), 
            ...global.owner.map(num => num + '@s.whatsapp.net')
        ].map(v => v.replace(/[^0-9]/g, '')).includes(sender.replace(/[^0-9]/g, ''));

        const isBot = m.key.fromMe;

        if (!isOwners && !isBot) {
            return client.reply(m.chat, `《✧》 *Acceso Denegado*\nSolo mi dueño o yo podemos reiniciar el sistema. ♡`, m);
        }

        // 2. AVISO DE REINICIO
        // Quitamos el 'return' de aquí para que el código siga ejecutándose abajo
        await client.reply(m.chat, `「✿」*Reiniciando Sistema* ◢\n\n➩ El Socket se reiniciará en 3 segundos...\n> *Espere un momento...* ꕤ`, m);

        // 3. LÓGICA DE REINICIO (Ejecución después de 3 segundos)
        setTimeout(() => {
            if (process.send) {
                process.send("restart");
            } else {
                process.exit(0);
            }
        }, 3000);
    },
};
