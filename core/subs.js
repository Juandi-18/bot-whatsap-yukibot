import { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, jidDecode } from '@whiskeysockets/baileys';
import qrcode from "qrcode";
import NodeCache from 'node-cache';
import main from '../main.js';
import pino from 'pino';
import fs from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import { smsg } from './message.js';

if (!global.conns) global.conns = [];
const msgRetryCounterCache = new NodeCache();

export async function startSubBot(m, client, caption = '', isCode = false, phone = '', chatId = '', commandFlags = {}, isCommand = false) {
    const id = phone || (m?.sender || '').split('@')[0];
    const sessionFolder = `./Sessions/Subs/${id}`;
    const senderId = m?.sender;

    // Crear carpeta si no existe
    if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'), 
        auth: state,
        version,
        msgRetryCounterCache,
        syncFullHistory: false,
    });

    sock.isPairing = false;
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // --- LÓGICA PARA GENERAR VINCULACIÓN ---
        if (connection !== 'open' && commandFlags[senderId]?.active) {
            
            // CASO A: CÓDIGO DE 8 DÍGITOS
            if (isCode && phone) {
                if (sock.isPairing) return;
                sock.isPairing = true;

                // Esperamos a que el socket esté listo
                await new Promise(resolve => setTimeout(resolve, 8000)); 

                try {
                    console.log(chalk.yellow(`[ ! ] Solicitando código de vinculación para: ${phone}`));
                    
                    // Intento 1
                    let codeGen = await sock.requestPairingCode(phone).catch(err => {
                        console.log(chalk.red("Error Intento 1:"), err.message);
                        return null;
                    });

                    // Intento 2 (Si el primero falla)
                    if (!codeGen) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        codeGen = await sock.requestPairingCode(phone).catch(() => null);
                    }

                    if (codeGen) {
                        const finalCode = codeGen?.match(/.{1,4}/g)?.join("-") || codeGen;
                        
                        await client.sendMessage(chatId, { 
                            text: `*┏━━━━━━━━━━━━━━━━━━━┓*\n*┃ ❀ CÓDIGO DE VINCULACIÓN ❀ ┃*\n*┗━━━━━━━━━━━━━━━━━━━┛*\n\n*Número:* ${phone}\n*Código:* \`\`\`${finalCode}\`\`\`\n\n> _Cópialo y pégalo en la notificación de tu celular para activar el Sub-Bot._` 
                        }, { quoted: m });

                        delete commandFlags[senderId]; 
                    } else {
                        await client.sendMessage(chatId, { text: "⚠️ WhatsApp rechazó la petición del código. Intenta de nuevo en un minuto o usa QR." });
                        sock.isPairing = false;
                        delete commandFlags[senderId];
                    }
                } catch (err) {
                    console.error("Error en proceso de código:", err);
                    sock.isPairing = false;
                }

            // CASO B: CÓDIGO QR
            } else if (qr && !isCode) {
                try {
                    await client.sendMessage(chatId, { 
                        image: await qrcode.toBuffer(qr, { scale: 8 }), 
                        caption: `*┏━━━━━━━━━━━━━━━━━━━┓*\n*┃ ❀ ESCANEA PARA SER SUB-BOT ❀ ┃*\n*┗━━━━━━━━━━━━━━━━━━━┛*\n\n> _Escanea este QR desde 'Dispositivos vinculados' para activar tu sesión._` 
                    }, { quoted: m });
                    
                    delete commandFlags[senderId];
                } catch (e) {
                    console.error("Error enviando QR:", e);
                }
            }
        }

        // --- ESTADO DE LA CONEXIÓN ---
        if (connection === 'open') {
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            console.log(chalk.bgGreen.black(`[ SUCCESS ] SUB-BOT CONECTADO: ${botId}`));
            
            if (!global.conns.some(c => c.user?.id === sock.user.id)) {
                global.conns.push(sock);
            }
            
            await client.sendMessage(chatId, { text: `✅ *¡Sub-Bot activado correctamente!*\n\nID: @${botId.split('@')[0]}`, mentions: [botId] });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 0;
            console.log(chalk.red(`[ ! ] Conexión cerrada. Razón: ${reason}`));

            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.bgRed.white(" Sesión cerrada por el usuario. Eliminando archivos... "));
                fs.rmSync(sessionFolder, { recursive: true, force: true });
            } else {
                // Reconexión automática para errores temporales
                setTimeout(() => startSubBot(m, client, caption, isCode, phone, chatId, commandFlags, isCommand), 10000);
            }
        }
    });

    // --- PROCESAMIENTO DE MENSAJES DEL SUB-BOT ---
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (let raw of messages) {
            if (!raw.message || raw.key.remoteJid === 'status@broadcast') continue;
            try {
                const msg = await smsg(sock, raw);
                await main(sock, msg, messages);
            } catch (err) {
                console.error("Error procesando mensaje en Sub-Bot:", err);
            }
        }
    });

    return sock;
}
