import { resolveLidToRealJid } from "../../core/utils.js";

export default {
    command: ['dox', 'doxeo', 'doxear'],
    category: 'utils', 
    run: async (client, m, args, usedPrefix, command) => {
        // 1. Verificar si hay alguien mencionado o citado
        const mentionedJid = m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null);
        
        if (!mentionedJid) {
            return m.reply(`《✧》 Por favor, menciona a la persona que deseas doxear. ♡\n\n➩ Ejemplo: *${usedPrefix + command} @usuario*`);
        }

        const who = await resolveLidToRealJid(mentionedJid, client, m.chat);
        
        if (who === client.user.id.split(':')[0] + '@s.whatsapp.net') {
            return m.reply("《✧》 ¿Intentas doxearme a mí? Soy una gatita virtual, no tengo casa física. ♡");
        }

        const user = who.split('@')[0];
        const userName = global.db.data.users[who]?.name || `@${user}`;

        // 2. Generador de IPs Aleatorias
        const ipPublica = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const ipLocal = `192.168.${Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 255)}`;
        const dns = `1.1.${Math.floor(Math.random() * 9)}.1`;
        const isp = ["Claro Perú", "Movistar", "Entel", "Bitel", "Win"][Math.floor(Math.random() * 5)];
        
        // 3. Animación de hackeo personalizada
        const { key } = await client.sendMessage(m.chat, { 
            text: `﹒⌗﹒🌿 .ৎ˚₊‧  *Comenzando a doxear a ${userName}...* ♡`, 
            mentions: [who] 
        }, { quoted: m });
        
        const pasos = [
            `✿ \`[ ▓░░░░░ ] 20%\` ➩ Localizando servidor de @${user}...`,
            `☘️ \`[ ▓▓▓░░░ ] 50%\` ➩ Vulnerando la red de ${userName}...`,
            `✨ \`[ ▓▓▓▓▓░ ] 80%\` ➩ Extrayendo datos privados de @${user}...`,
            `✅ \`[ ▓▓▓▓▓▓ ] 100%\` ➩ ¡Doxeo completado con éxito! ꕤ`
        ];

        for (let paso of pasos) {
            await new Promise(resolve => setTimeout(resolve, 1200));
            await client.sendMessage(m.chat, { text: paso, edit: key, mentions: [who] });
        }

        // 4. Resultado final con diseño de gatito
        let doxeoText = `﹒⌗﹒💻 .ৎ˚₊‧  *DATOS ENCONTRADOS* ♡\n\n`;
        doxeoText += `✿ *Objetivo:* ${userName}\n`;
        doxeoText += `🌐 *IP Pública:* ${ipPublica}\n`;
        doxeoText += `📍 *IP Local:* ${ipLocal}\n`;
        doxeoText += `📡 *ISP:* ${isp}\n`;
        doxeoText += `🛠️ *DNS:* ${dns}\n`;
        doxeoText += `🔋 *Batería:* ${Math.floor(Math.random() * 100)}%\n`;
        doxeoText += `📂 *Carpeta Privada:* 124.8 GB (Contenido sospechoso...) ꕤ\n\n`;
        doxeoText += `> Nota: Estos datos son generados al azar por Yuki Bot. ♡`;

        return client.sendMessage(m.chat, { text: doxeoText, edit: key, mentions: [who] });
    }
}
