export async function handleParticipantsUpdate(client, anu) {
    const { id, participants, action } = anu;
    const db = global.db.data;
    const chat = db.chats[id] || {};

    // Si el chat no tiene la bienvenida activada en la base de datos, ignorar
    if (!chat.welcome) return;

    try {
        const metadata = await client.groupMetadata(id);
        
        for (let user of participants) {
            let pp = 'https://i.ibb.co/3S8f9m8/avatar-contact.png'; // Imagen por defecto
            try {
                pp = await client.profilePictureUrl(user, 'image');
            } catch (e) {}

            if (action === 'add') {
                let text = `﹒⌗﹒🌿 .ৎ˚₊‧  ¡Bienvenido/a al grupo! ♡\n\n✿ @${user.split('@')[0]}\n☘️ *Grupo:* ${metadata.subject}\n\n> Lee las reglas para evitar problemas en el grupo. ꕤ`;
                
                await client.sendMessage(id, { 
                    image: { url: pp }, 
                    caption: text, 
                    mentions: [user] 
                });

            } else if (action === 'remove') {
                let text = `﹒⌗﹒🍂 .ৎ˚₊‧  Un usuario ha dejado el grupo. ♡\n\n✿ @${user.split('@')[0]}\n> ¡Esperamos que le vaya bien en su camino! ꕤ`;
                
                await client.sendMessage(id, { 
                    image: { url: pp }, 
                    caption: text, 
                    mentions: [user] 
                });
            }
        }
    } catch (e) {
        console.error("Error en el manejador de grupos:", e);
    }
}
