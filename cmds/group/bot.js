export default {
  command: ['bot'],
  category: 'grupo',
  isAdmin: true,
  run: async (client, m, args) => {
    const botJid = client.user.id.split(':')[0] + "@s.whatsapp.net";
    const chat = global.db.data.chats[m.chat];
    const settings = global.db.data.settings[botJid] || {};
    const estado = chat.isBanned ?? false;

    // --- LÓGICA DE PERMISOS (DUEÑO Y BOT) ---
    const isOwners = [
      botJid,
      ...(settings.owner ? [settings.owner] : []),
      ...global.owner.map(num => num + '@s.whatsapp.net')
    ].includes(m.sender);
    
    const isBot = m.key.fromMe;

    // Si no es dueño, ni el bot, ni admin del grupo, bloqueamos
    if (!isOwners && !isBot && !m.isGroupAdmins) {
      return m.reply('《✧》 Solo el *Dueño*, el *Bot* o *Administradores* pueden usar este comando.');
    }
    // ----------------------------------------

    if (args[0] === 'off') {
      if (estado) return m.reply('《✧》 El *Bot* ya estaba *desactivado* en este grupo.');
      chat.isBanned = true;
      return m.reply(`《✧》 Has *Desactivado* a *${settings.namebot}* en este grupo.`);
    }

    if (args[0] === 'on') {
      if (!estado) return m.reply(`《✧》 *${settings.namebot}* ya estaba *activado* en este grupo.`);
      chat.isBanned = false;
      return m.reply(`《✧》 Has *Activado* a *${settings.namebot}* en este grupo.`);
    }

    return m.reply(`*✿ Estado de ${settings.namebot} (｡•́‿•̀｡)*\n✐ *Actual ›* ${estado ? '✗ Desactivado' : '✓ Activado'}\n\n✎ Puedes cambiarlo con:\n> ● _Activar ›_ *bot on*\n> ● _Desactivar ›_ *bot off*`);
  },
};
