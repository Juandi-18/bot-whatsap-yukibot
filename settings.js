import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath } from 'url'

global.owner = ['573108615379'] 
global.botNumber = '573108615379'
global.pairingNumber = '573108615379'

global.sessionName = 'Sessions/Owner'
global.version = '^2.0 - Latest'
global.dev = "© ⍴᥆ᥕᥱrᥱძ ᑲᥡ ⁱᵃᵐ|𝔇ĕ𝐬†𝓻⊙γ𒆜"

global.links = {
  api: 'https://api.yuki-wabot.my.id',
  channel: "https://whatsapp.com/channel/0029Vb64nWqLo4hb8cuxe23n",
  github: "https://github.com/iamDestroy/YukiBot-MD",
  gmail: "thekingdestroy507@gmail.com"
}

global.my = {
  ch: '120363401404146384@newsletter',
  name: 'ೃ࿔ ყµҡเ ωαɓσƭร - σƒƒเ૮เαℓ ૮ɦαɳɳεℓ .ೃ࿐',
}

global.mess = {
  socket: '《✧》 Este comando solo puede ser ejecutado por un Socket.',
  admin: '《✧》 Este comando solo puede ser ejecutado por los Administradores del Grupo.',
  botAdmin: '《✧》 Este comando solo puede ser ejecutado si el Socket es Administrador del Grupo.'
}

global.APIs = {
  stellar: { url: "https://api.yuki-wabot.my.id", key: "YukiBot-MD" }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  import(`${file}?update=${Date.now()}`)
})
