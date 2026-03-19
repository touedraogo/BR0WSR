# Browser-Electron-NordVPN

## Description

Navigateur Electron sécurisé avec intégration **NordVPN**.

Basé sur [BR0WSR](https://github.com/shashpicious/BR0WSR) - Modifié pour NordVPN.

## Fonctionnalités

| Fonctionnalité | Description |
|---------------|-------------|
| **Ad-blocker** | Bloqueur de pubs et traqueurs (@cliqz/adblocker) |
| **NordVPN** | Connexion VPN par pays |
| **TouchID** | Authentification biométrique macOS |
| **Screenshot** | Capture d'écran |
| **Webview** | Navigation sécurisée |

## Installation (macOS)

```bash
# 1. Installer les dépendances Node.js
npm install

# 2. Installer NordVPN CLI (si pas déjà fait)
# Via l'app NordVPN ou: brew install nordvpn

# 3. Lancer
npm start
```

## Commandes NordVPN

```bash
# Connexion rapide
nordvpn connect

# Connexion par pays
nordvpn connect us
nordvpn connect fr
nordvpn connect de

# Déconnexion
nordvpn disconnect

# Statut
nordvpn status

# Protocole
nordvpn set protocol UDP
nordvpn set protocol TCP

# Reconnecter
nordvpn reconnect
```

## API JavaScript

```javascript
// Statut VPN
const status = await browser.vpn.status()

// Connexion par pays
await browser.vpn.connect('us')

// Connexion rapide
await browser.vpn.quickConnect()

// Déconnexion
await browser.vpn.disconnect()

// Reconnecter
await browser.vpn.reconnect()

// Protocole
const proto = await browser.vpn.protocol()
await browser.vpn.setProtocol('UDP')

// Pays disponibles
const countries = await browser.vpn.countries()
```

## Structure

```
browser-electron-nordvpn/
├── main.js        # Backend Electron
├── preload.js    # API bridge
├── index.html    # Interface
├── package.json
└── README.md
```

## Prérequis macOS

- macOS 10.15+
- NordVPN installé et connecté
- Node.js 18+

---

*Document généré le 18 mars 2026*
