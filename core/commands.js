// --- ./core/commands.js ---

export const bodyMenu = ""; // Dejamos esto vacío ya que el encabezado lo manejamos en menu.js

export const menuObject = {
economia: `» ˚୨•(=^●ω●^=)• ⊹ \`Economía\` ⊹
> ✐ Comandos de *Economía* para ganar dinero y divertirte con tus amigos.

✧ \`$prefixbalance\` \`$prefixbal\` \`$prefixcoins\` _<usuario>_
> Ver cuantos coins tienes.
✧ \`$prefixcoinflip\` \`$prefixflip\` \`$prefixcf\` _[cantidad] <cara/cruz>_
> Apostar coins en un cara o cruz.
✧ \`$prefixcrime\`
> Ganar coins rapido.
✧ \`$prefixdaily\`
> Reclamar tu recompensa diaria.
✧ \`$prefixdeposit\` \`$prefixdep\` \`$prefixd\` _[cantidad] | all_
> Depositar tus coins en el banco.
✧ \`$prefixeconomyboard\` \`$prefixbaltop\`
> Ver el ranking de usuarios con más coins.
✧ \`$prefixroulette\` \`$prefixrt\` _[red/black] [cantidad]_
> Apostar coins en una ruleta.
✧ \`$prefixslut\`
> Ganar coins prostituyéndote.
✧ \`$prefixsteal\` \`$prefixrob\` _[@mencion]_
> Intentar robar coins a un usuario.
✧ \`$prefixwithdraw\` \`$prefixwith\` _[cantidad] | all_
> Retirar tus coins en el banco.
✧ \`$prefixwork\` \`$prefixw\`
> Ganar coins trabajando.`,

gacha: `\n» ˚୨•(=^●ω●^=)• ⊹ \`Gacha\` ⊹
> ✐ Comandos de *Gacha* para reclamar y intercambiar personajes.

✧ \`$prefixbuycharacter\` \`$prefixbuyc\` _[nombre]_
> Comprar un personaje en venta.
✧ \`$prefixcharinfo\` \`$prefixwinfo\` _[nombre]_
> Ver información de un personaje.
✧ \`$prefixclaim\` \`$prefixc\` _[citar personaje]_
> Reclamar un personaje.
✧ \`$prefixharem\` \`$prefixwaifus\` _<@usuario>_
> Ver tus personajes reclamados.
✧ \`$prefixharemshop\` \`$prefixwshop\`
> Ver los personajes en venta.
✧ \`$prefixrollwaifu\` \`$prefixroll\`
> Waifu o husbando aleatorio.
✧ \`$prefixsell\` \`$prefixvender\` _[precio] [nombre]_
> Poner un personaje a la venta.
✧ \`$prefixtrade\` _[Tu personaje] / [Personaje 2]_
> Intercambiar un personaje con otro usuario.`,

downloads: `\n» ˚୨•(=^●ω●^=)• ⊹ \`Descargas\` ⊹
> ✐ Comandos de *Descargas* de varias fuentes.

✧ \`$prefixfacebook\` \`$prefixfb\` _[Link]_
> Descargar un video de Facebook.
✧ \`$prefixmediafire\` \`$prefixmf\`
> Descargar un archivo de MediaFire.
✧ \`$prefixmp4\` \`$prefixytmp4\` _[Canción/Link]_
> Descargar un video de YouTube.
✧ \`$prefixplay\` \`$prefixyt\` _[Canción/Link]_
> Descargar una canción de YouTube.
✧ \`$prefixreel\` \`$prefixig\` _[Link]_
> Descargar un reel de Instagram.
✧ \`$prefixtiktok\` \`$prefixtt\`
> Descargar un video de TikTok.`,

stickers: `\n» ˚୨•(=^●ω●^=)• ⊹ \`Stickers\` ⊹
> ✐ Comandos de *Stickers* para crear y gestionar.

✧ \`$prefixsticker\` \`$prefixs\` _{citar una imagen/video}_
> Convertir una imagen/video a sticker.
✧ \`$prefixstickeradd\` \`$prefixaddsticker\` _[paquete]_
> Agrega un sticker a un paquete.
✧ \`$prefixstickerpacks\` \`$prefixpacklist\`
> Lista de tus paquetes de stickers.
✧ \`$prefixbrat\` \`$prefixqc\` _[texto]_
> Crear stickers con texto.`,

utils: `\n» ˚୨•(=^●ω●^=)• ⊹ \`Utilidades\` ⊹
> ✐ Comandos de herramientas útiles.

✧ \`$prefixping\` \`$prefixp\`
> Medir tiempo de respuesta.
✧ \`$prefixstatus\` \`$prefixestado\`
> Ver estado del bot.
✧ \`$prefixia\` \`$prefixchatgpt\` _[pregunta]_
> Realizar peticiones a la IA.
✧ \`$prefixtoimage\` \`$prefixtoimg\` _{citar sticker}_
> Convertir sticker a imagen.
✧ \`$prefixhd\` \`$prefixremini\` _{citar imagen}_
> Mejorar calidad de imagen.`,

grupo: `\n» ˚୨•(=^●ω●^=)• ⊹ \`Administración\` ⊹
> ✐ Comandos para administradores de grupos.

✧ \`$prefixantilink\` \`$prefixantienlaces\` _[on/off]_
> Activar/desactivar el antienlace.
✧ \`$prefixbot\` _[on/off]_
> Activar/desactivar al bot en el grupo.
✧ \`$prefixkick\` _<@usuario>_
> Expulsar a un usuario.
✧ \`$prefixpromote\` _<@usuario>_
> Ascender a administrador.
✧ \`$prefixdemote\` _<@usuario>_
> Descender de administrador.
✧ \`$prefixnsfw\` _[on/off]_
> Activar/desactivar el contenido +18.
✧ \`$prefixwelcome\` \`$prefixbienvenida\` _[on/off]_
> Activar/desactivar la bienvenida.
✧ \`$prefixtagall\` \`$prefixhidetag\` _[mensaje]_
> Mencionar a todos los miembros.`,

nsfw: `\n» ˚୨•(=^●ω●^=)• ⊹ \`NSFW\` ⊹
> ✐ Comandos *NSFW* (Contenido para adultos).

✧ \`$prefixanal\` \`$prefixviolar\` _<mencion>_
✧ \`$prefixblowjob\` \`$prefixmamada\` _<mencion>_
✧ \`$prefixcum\` _<mencion>_
✧ \`$prefixfuck\` \`$prefixcoger\` _<mencion>_
✧ \`$prefixrule34\` \`$prefixr34\` _[Tags]_
✧ \`$prefixundress\` \`$prefixencuerar\` _<mencion>_
✧ \`$prefixyuri\` \`$prefixtijeras\` _<mencion>_`,

anime: `\n» ˚୨•(=^●ω●^=)• ⊹ \`Anime\` ⊹
> ✐ Comandos de reacciones de anime.

✧ \`$prefixkill\` \`$prefixmatar\` _<mencion>_
✧ \`$prefixkiss\` \`$prefixbeso\` _<mencion>_
✧ \`$prefixpat\` \`$prefixacariciar\` _<mencion>_
✧ \`$prefixhug\` \`$prefixabrazar\` _<mencion>_
✧ \`$prefixhappy\` \`$prefixfeliz\` _<mencion>_
✧ \`$prefixcry\` \`$prefixllorar\` _<mencion>_`
};
