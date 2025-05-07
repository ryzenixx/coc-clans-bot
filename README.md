# 🛡️ Bot Discord Clash Of Clans

> Un bot Discord moderne pour suivre les guerres et les membres d’un clan Clash of Clans — en temps réel.

---

## 🚀 Fonctionnalités

- ⚔️ Affiche l’état **en direct** des guerres de clan (préparation, active, terminée)
- 👥 Envoie un message complet des **membres du clan** avec infos triées par rôles
- 🔍 Permet la recherche d’un **profil joueur** via un bouton et un formulaire interactif
- 📡 Rafraîchissement automatique toutes les **30 secondes**
- 📊 Données affichées dans des **embeds** clairs et colorés

---

## ⚙️ Installation

1. **Clone** le projet :

```bash
git clone https://github.com/ryzenixx/coc-clans-bot.git
cd coc-clans-bot
```

2. **Installe les dépendances** :

```bash
npm install
```

3. **Configure les identifiants** :  
Remplace les valeurs suivantes dans le fichier `index.js` :

```js
const DISCORD_TOKEN = 'TON_TOKEN_DISCORD';
const COC_API_TOKEN = 'TON_TOKEN_COC_API';
const CLAN_TAG = 'TAG_DU_CLAN (sans le #)';
const CHANNEL_WARS_ID = 'ID_DU_SALON_DES_GUERRES';
const CHANNEL_MEMBERS_ID = 'ID_DU_SALON_DES_MEMBRES';
```

> 💡 Tu peux aussi utiliser un fichier `.env` si tu préfères stocker les variables d’environnement proprement.

---

## 🧪 Lancer le bot

```bash
node index.js
```

---

## 📸 Aperçu des fonctionnalités

- Embed des **guerres en cours**
- Embed des **membres du clan** classés par rôle
- Modal pour rechercher un joueur via son **tag Clash of Clans**
- Bouton vers **Clash of Stats** pour chaque joueur

---

## 🛠️ Technologies utilisées

- [discord.js](https://discord.js.org) (v14)
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- Clash of Clans Developer API

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Fork le repo, crée une branche, et propose une pull request.

---

## 👑 Auteur

Développé avec ❤️ par [ryzenixx](https://github.com/ryzenixx)