import { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason, jidDecode, } from '@whiskeysockets/baileys';
import qrcode from "qrcode"
import NodeCache from 'node-cache';
import main from '../main.js'
import events from '../cmds/events.js'
import pino from 'pino';
import fs from 'fs';
import chalk from 'chalk';
import { smsg } from './message.js';
import moment from 'moment-timezone';

if (!global.conns) global.conns = []
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const groupCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });
let reintentos = {}
const cleanJid = (jid = '') => jid.replace(/:\d+/, '').split('@')[0]

export async function startSubBot(m, client, caption = '', isCode = false, phone = '', chatId = '', commandFlags = {}, isCommand = false) {
    const id = phone || (m?.sender || '').split('@')[0]
    const sessionFolder = `./Sessions/Subs/${id}`
    const senderId = m?.sender

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Chrome'), // Necesario para que WhatsApp acepte el código
        auth: state,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async () => '',
        msgRetryCounterCache,
        userDevicesCache,
        cachedGroupMetadata: async (jid) => groupCache.get(jid),
        version,
        keepAliveIntervalMs: 60_000,
    })

    sock.isInit = false
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, isNewLogin, qr }) => {
        if (isNewLogin) sock.isInit = false
        
        if (connection === 'open') {
            sock.uptime = Date.now();
            sock.isInit = true
            sock.userId = cleanJid(sock.user?.id?.split('@')[0])
            const botDir = sock.userId + '@s.whatsapp.net'
            if (!global.db.data.settings[botDir]) global.db.data.settings[botDir] = {}
            global.db.data.settings[botDir].type = 'Sub'
            if (!global.conns.find((c) => c.userId === sock.userId)) global.conns.push(sock)

            delete reintentos[sock.userId || id]
            await joinChannels(sock)
            console.log(chalk.gray(`[ ✿ ] SUB-BOT conectado: ${sock.userId}`))
        }

        if (connection === 'close') {
            const botId = sock.userId || id
            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.reason || 0
            
            if (reason === DisconnectReason.loggedOut) {
                fs.rmSync(sessionFolder, { recursive: true, force: true })
                return
            }

            setTimeout(() => {
                startSubBot(m, client, caption, isCode, phone, chatId, commandFlags, isCommand)
            }, 5000)
        }

        // --- LÓGICA DE CÓDIGO DE 8 DÍGITOS ---
        if (qr && isCode && phone && commandFlags[senderId]) {
            try {
                // Esperamos un momento para que el socket esté listo para pedir el código
                await new Promise(resolve => setTimeout(resolve, 3000));
                let codeGen = await sock.requestPairingCode(phone);
                codeGen = codeGen?.match(/.{1,4}/g)?.join("-") || codeGen;

                const msgCode = await client.reply(chatId, `「✿」*CÓDIGO DE VINCULACIÓN* ◢\n\n➩ Tu código es: *${codeGen}*\n\n> ꕤ Úsalo en el número que solicitó la vinculación. ♡`, m);
                
                delete commandFlags[senderId];

                // Auto-borrado después de 2 minutos para seguridad
                setTimeout(async () => {
                    try { await client.sendMessage(chatId, { delete: msgCode.key }); } catch {}
                }, 120000);

            } catch (err) {
                console.error("[Error generando código]", err);
            }
        }

        // --- LÓGICA DE CÓDIGO QR ---
        if (qr && !isCode && commandFlags[senderId]) {
            try {
                const msgQR = await client.sendMessage(chatId, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption }, { quoted: m })
                
                delete commandFlags[senderId]

                setTimeout(async () => {
                    try { await client.sendMessage(chatId, { delete: msgQR.key }) } catch {}
                }, 120000)
            } catch (err) {
                console.error("[Error generando QR]", err)
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        for (let raw of messages) {
            if (!raw.message) continue
            let msg = await smsg(sock, raw)
            try { main(sock, msg, messages) } catch (err) { console.log(chalk.gray(`[ ✿ ] Sub » ${err}`)) }
        }
    })

    try { await events(sock, m) } catch (err) { console.log(chalk.gray(`[ BOT ] → ${err}`)) }
    
    return sock
}

async function joinChannels(client) {
    for (const value of Object.values(global.my)) {
        if (typeof value === 'string' && value.endsWith('@newsletter')) {
            await client.newsletterFollow(value).catch(() => {})
        }
    }
}
