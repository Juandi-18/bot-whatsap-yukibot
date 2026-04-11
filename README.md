> [!NOTE]
> **Este proyecto está en constante evolución. Estamos comprometidos en ofrecer a nuestra comunidad un Bot increíble. Te invitamos a instalarlo y para estar al tanto de todas las novedades. [¡Únete a nuestro nuevo canal!](https://stellarwa.xyz/channel/yuki)**


## 🪾 Descripción 

# 🪾 YukiBot-MD 
> **Este proyecto está en constante evolución. Estamos comprometidos en ofrecer a nuestra comunidad un Bot increíble. Te invitamos a instalarlo para estar al tanto de todas las novedades. [¡Únete a nuestro nuevo canal!](https://stellarwa.xyz/channel/yuki)**

<p align="center"> 
<img src="https://iili.io/qpPn1K7.gif" alt="YukiBot-MD" style="width: 75%; height: auto; max-width: 100px;">

<p align="center"> 
<a href="#"><img title="YukiBot-MD" src="https://img.shields.io/badge/¡Disfruta de un Bot totalmente gratuito, con múltiples funciones y de código abierto! -purple?colorA=%239b33b0&colorB=%231c007b&style=for-the-badge"></a> 
</p>

---

## 🪾 Descripción 

Yuki Bot es un bot de WhatsApp multifuncional basado en `baileys`. Este bot ofrece una variedad de características para mejorar tu experiencia en WhatsApp, optimizado para ser ligero y eficiente.

---

## 🥦 Características

- **Comandos Gacha:** Juegos interactivos y de azar.
- **Economía:** Sistema de niveles, bancos y monedas.
- **Gestión de Grupos:** Herramientas completas para administradores.
- **Multimedia:** Descarga de música (MP3) y video (MP4) de YouTube con múltiples APIs de respaldo.
- **IA Integrada:** Respuestas inteligentes y generación de contenido.

---

🍒 Instalación en Termux (Recomendado)
<details>
<summary><strong>Paso 1: Preparación del Entorno</strong> (Click para desplegar)</summary>

Primero, concede permisos de almacenamiento a Termux:

```bash 
termux-setup-storage
```
Luego, instala todas las dependencias necesarias del sistema:

```bash 
apt update && apt upgrade -y && pkg install -y git nodejs ffmpeg imagemagick yarn
```
</details>

<details>
<summary><strong>Paso 2: Instalación del Bot</strong> (Click para desplegar)</summary>

Clona el repositorio oficial:

```bash 
git clone https://github.com/Juandi-18/bot-whatsap-yukibot.git
```
Entra a la carpeta y descarga los módulos necesarios:

```bash 
cd bot-whatsap-yukibot && npm install && yarn install
```
</details>

<details>
<summary><strong>Paso 3: Ejecución y Mantenimiento</strong> (Click para desplegar)</summary>

Para iniciar el bot normalmente:

```bash 
npm start
```

> *Si aparece **(Y/I/N/O/D/Z) [default=N] ?** use la letra **"y"** y luego **"ENTER"** para continuar con la instalación.*

</details>

<details>
<summary><strong>🍒 Comandos para tener mas tiempo activo</strong> — el Bot</summary>

> *Ejecutar estos comandos dentro de la carpeta YukiBot-MD*
```bash 
termux-wake-lock && pm2 start npm --name "yukibot" -- start && pm2 save
``` 

#### Opciones Disponibles
> *Esto eliminará todo el historial que hayas establecido con PM2:*
```bash 
pm2 delete index
``` 

> *Si tienes cerrado Termux y quiere ver de nuevo la ejecución use:*
```bash 
pm2 logs 
``` 

> *Si desea detener la ejecución de Termux use:*
```bash 
pm2 stop index
``` 

> *Si desea iniciar de nuevo la ejecución de Termux use:*
```bash 
pm2 start index
```

--- 

### En caso de detenerse
> _Si despues que ya instalastes tu bot y termux te salta en blanco, se fue tu internet o reiniciaste tu celular, solo realizaras estos pasos:_
```bash
cd && cd YukiBot-MD && npm start
```
---

### Obtener nuevo inicio de Sessión 
> *Detén el bot, haz click en el símbolo (ctrl) [default=z] usar la letra "z" + "ENTER" hasta que salga algo verdes similar a: `YukiBot-MD $`*
 
```bash 
cd && cd YukiBot-MD && rm -rf Sessions/Owner && npm start
```
</details>

---

### Patrocinadores del Proyecto

<details>
<summary><strong>☁️ Yuki</strong> — API</summary>

<div align="center">
  <a href="https://api.yuki-wabot.my.id">
    <img src="https://api.yuki-wabot.my.id/favicon.ico" alt="Logo" height="125px">
  </a>
</div>

### 🌱 Enlaces Principales
| Servicio | Enlace |
|------------|-----------|
| Dashboard | [Abrir](https://api.yuki-wabot.my.id) |
| Store | [Abrir](https://api.yuki-wabot.my.id/store) 
| Soporte | [Visitar](https://api.yuki-wabot.my.id/ticket)  
| Estado de Servicios | [Ver](https://api.yuki-wabot.my.id/stats) |
| Canal | [Abrir](https://stellarwa.xyz/channel/yuki) 

</details>

<details>
<summary><strong>☁️ Stellar</strong> — API</summary>

<div align="center">
  <a href="https://api.stellarwa.xyz">
    <img src="https://api.stellarwa.xyz/favicon.ico" alt="Logo" height="125px">
  </a>
</div>

### 🐢 Enlaces Principales
| Servicio | Enlace |
|------------|-----------|
| Dashboard | [Abrir](https://api.stellarwa.xyz) |
| Store | [Abrir](https://api.stellarwa.xyz/store) 
| Soporte | [Visitar](https://api.stellarwa.xyz/ticket)  
| Estado de Servicios | [Ver](https://api.stellarwa.xyz/stats) |
| Canal | [Abrir](https://stellarwa.xyz/channel/api) 

</details>

<details>
<summary><strong>☁️ Akirax</strong> — Hosting</summary>

<div align="center">
  <a href="https://home.akirax.net">
    <img src="https://cdn2.sockywa.xyz/JG8PX.jpeg" alt="Logo" height="125px">
  </a>
</div>

### 🐋 Enlaces Principales
| Servicio | Enlace |
|------------|-----------|
| Sitio Web | [Visitar](https://docs.akirax.net) |
| Home | [Abrir](https://home.akirax.net) |
| Panel | [Abrir](https://console.akirax.net) | 
| Soporte (Matías) | [Contactar](https://wa.me/5491164123932) |
| Canal de WhatsApp | [Unirse](https://whatsapp.com/channel/0029VaYTBn3DZ4LaHbgzxw0B) |

</details>

<details>
<summary><strong>☁️ SkyUltraPlus</strong> — Hosting</summary>
  
[![YouTube](https://img.shields.io/badge/SkyUltraPlus-Host-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/fZbcCLpSH6Y?si=1sDen7Bzmb7jVpAI)

<div align="center">
  <a href="https://skyultraplus.com">
    <img src="https://stellar.evogb.org/evogb/skyultraplus%20(1).png" alt="Logo" height="125px">
  </a>
</div>

### 🌱 Enlaces Principales
| Servicio | Enlace |
|------------|-----------|
| Sitio Web | [Visitar](https://skyultraplus.com) |
| Dashboard | [Abrir](https://dash.skyultraplus.com) |
| Panel | [Abrir](https://panel.skyultraplus.com) |
| Canal de WhatsApp | [Unirse](https://whatsapp.com/channel/0029VakUvreFHWpyWUr4Jr0g) |
| Comunidad (WhatsApp) | [Unirse](https://chat.whatsapp.com/E6iWpvGuJ8zJNPbN3zOr0D?mode=ems_copy_c) |
| Soporte (Gata Dios) | [Contactar](https://wa.me/message/AIZ7TVNEI7M2P1) |
| Soporte (Russell) | [Contactar](https://api.whatsapp.com/send/?phone=15167096032&text&type=phone_number&app_absent=0) |
| Discord | [Unirse](https://discord.gg/XvvmFuDcEE) |

</details>

---

### 🦋 Colaboradores
<a href="https://api.yuki-wabot.my.id">
  <img src="https://contrib.rocks/image?repo=iamDestroy/YukiBot-MD" />
</a>

### 🌼 Agradecimientos
[![ZyxlJs](https://github.com/DevZyxlJs.png?size=100)](https://github.com/DevZyxlJs) [![Carlos](https://github.com/AzamiJs.png?size=100)](https://github.com/AzamiJs)

### 💐 Propietario
[![King](https://github.com/iamDestroy.png?size=120)](https://github.com/iamDestroy)
