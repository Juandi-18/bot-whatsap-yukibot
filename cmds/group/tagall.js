export default {
  command: ['todos', 'invocar', 'tagall'],
  category: 'grupo',
  isAdmin: true,
  run: async (client, m, args) => {
    const botJid = client.user.id.split(':')[0] + "@s.whatsapp.net";
    const settings = global.db.data.settings[botJid] || {};
    
    // --- LÓGICA DE PERMISOS (DUEÑO Y BOT) ---
    const isOwners = [
      botJid,
      ...(settings.owner ? [settings.owner] : []),
      ...global.owner.map(num => num + '@s.whatsapp.net')
    ].includes(m.sender);
    
    const isBot = m.key.fromMe;

    // Validación: Dueño, Bot o Admin del grupo
    if (!isOwners && !isBot && !m.isGroupAdmins) {
      return m.reply('《✧》 Solo el *Dueño*, el *Bot* o *Administradores* pueden usar este comando.');
    }
    // ----------------------------------------

    const groupInfo = await client.groupMetadata(m.chat)
    const participants = groupInfo.participants
    const pesan = args.join(' ')
    
    // Usamos global.version o el nombre del bot de tus settings para el pie de mensaje
    const botVersion = global.version || settings.namebot || 'YukiBot';

    let teks = `﹒⌗﹒🌱 .ৎ˚₊‧  ${pesan || 'Revivan 🪴'}\n\n𐚁 ֹ ִ \`GROUP TAG\` ! ୧ ֹ ִ🍃\n\n🍄 \`Miembros :\` ${participants.length}\n🌿 \`Solicitado por :\` @${m.sender.split('@')[0]}\n\n` +
      `╭┄ ꒰ \`Lista de usuarios:ׄ\` ꒱ ┄\n`
    
    for (const mem of participants) {
      teks += `┊ꕥ @${mem.id.split('@')[0]}\n`
    }
    
    teks += `╰⸼ ┄ ┄ ꒰ \`${botVersion}\` ꒱ ┄ ┄⸼`

    return client.reply(m.chat, teks, m, { mentions: [m.sender, ...participants.map(p => p.id)] })
  }
}
