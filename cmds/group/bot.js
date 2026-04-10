export default {
  command: ['bot'],
  category: 'grupo',
  isAdmin: true,
  run: async (client, m, args) => {
    const botJid = client.user.id.split(':')[0] + "@s.whatsapp.net";
    const chat = global.db.data.chats[m.chat];
    const settings = global.db.data.settings[botJid] || {};
    const estado = chat.isBanned ?? false;

    // --- LÓGICA DE PERMISOS RE-CORREGIDA ---
    const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];
    const admins = participants.filter(p => p.admin !== null).map(p => p.id);
    
    // Verificamos si el remitente es Admin del grupo
    const isAdmins = admins.includes(m.sender);
    
    // Verificamos si es Dueño
    const isOwners = [
      botJid,
      ...(settings.owner ? [settings.owner] : []),
      ...global.owner.map(num => num + '@s.whatsapp.net')
    ].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
    
    const isBot = m.key.fromMe;

    // LA CONDICIÓN FINAL: Si no es ninguna de las 3, afuera.
    if (!isOwners && !isBot && !isAdmins) {
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
