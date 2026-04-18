import fs from 'fs'

export default {
    command: ['backup', 'respaldo'],
    category: 'owner',
    isOwner: true,
    run: async (client, m) => {
        const dbPath = './core/database.json'
        const backupPath = `./core/database_backup_${Date.now()}.json`
        
        fs.copyFileSync(dbPath, backupPath)
        m.reply(`「✿」 Respaldo creado con éxito: \`${backupPath}\` ꕤ`)
    }
}
