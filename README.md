# 🎮 Yboost - Ouverture de Boosters League of Legends

Site web d'ouverture de boosters de skins League of Legends avec système de raretés.

## ✨ Fonctionnalités

- 🎁 Ouverture de boosters de skins aléatoires
- ⭐ Système de raretés (Standard, Épique, Légendaire, Mythique, Ultimate)
- 🎨 Interface graphique moderne et animée
- 💾 Sauvegarde locale dans le navigateur (localStorage)
- 🚀 Aucune base de données requise

## 🚀 Installation

1. Cloner le repository
```bash
git clone https://github.com/ANome1/Yboost.git
cd Yboost
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer le serveur
```bash
npm start
```

4. Ouvrir le navigateur à l'adresse : `http://localhost:3000`

## 📁 Structure du Projet

```
Yboost/
├── index.html              # Page principale (boosters)
├── server.js               # Serveur Express simplifié
├── package.json            # Dépendances
├── src/
│   ├── assets/
│   │   └── main.css       # Styles CSS
│   ├── components/
│   │   ├── card.js        # Composant carte
│   │   ├── modal.js       # Composant modal
│   │   └── toast.js       # Notifications toast
│   ├── data/
│   │   ├── champion.json  # Données des champions
│   │   └── skins.json     # Données des skins
│   └── script/
│       └── boosters.js    # Logique d'ouverture de boosters
```

## 🎲 Comment ça marche ?

1. Cliquez sur "Ouvrir le Booster"
2. Les cartes apparaissent face cachée
3. Cliquez sur chaque carte pour la révéler
4. Ou utilisez le bouton "Tout Révéler"
5. Vos skins sont sauvegardés automatiquement dans le navigateur

## 🎨 Raretés

- ⚪ **Standard** (kNoRarity) - 40% de chance
- 🟣 **Épique** (kEpic) - 35% de chance
- 🟡 **Légendaire** (kLegendary) - 20% de chance
- 🔴 **Mythique** (kMythic) - 5% de chance
- 💎 **Ultimate** (kUltimate) - Très rare

## 🔧 Technologies

- Node.js + Express
- HTML5 / CSS3 / JavaScript
- LocalStorage pour la persistance
- Data Dragon API (images des skins)

## ⚠️ Note

Ce projet n'est pas affilié à Riot Games. League of Legends et tous les assets associés sont la propriété de Riot Games.

## 📝 License

ISC

## 👤 Auteur

PrettyFlacko - Plateforme League of Legends

Application web pour explorer les champions de League of Legends avec système d'authentification.

## 🎮 Fonctionnalités

- 🏆 Galerie des champions de League of Legends
- 🔍 Recherche et filtrage par rôle
- 👤 Système d'authentification (inscription/connexion)
- 💾 Base de données PostgreSQL
- 📱 Interface responsive

## 🚀 Installation locale

### Prérequis

- Node.js (v14+)
- PostgreSQL (v12+)
- npm

### 1. Cloner le projet

```bash
git clone https://github.com/ANome1/Yboost.git
cd Yboost
```

### 2. Installer PostgreSQL

**Ubuntu/Debian :**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS :**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 3. Créer la base de données

```bash
sudo -u postgres psql
CREATE DATABASE yboost_dev;
\q
```

### 4. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditer .env si nécessaire
```

### 5. Installer les dépendances et lancer

```bash
npm install
npm start
```

L'application sera accessible sur `http://localhost:3000`

## ☁️ Déploiement sur Scalingo

Voir [SCALINGO_SETUP.md](SCALINGO_SETUP.md) pour les instructions détaillées.

```bash
# Ajouter PostgreSQL
scalingo --app mon-app-tah-les-fous addons-add postgresql postgresql-starter-512

# Déployer
git push scalingo main
```

## 🗄️ Structure du projet

```
Yboost/
├── src/
│   ├── assets/
│   │   └── main.css        # Styles CSS
│   ├── components/
│   │   ├── auth.js         # Gestion authentification
│   │   ├── card.js         # Cartes des champions
│   │   └── modal.js        # Composant modal
│   ├── data/
│   │   ├── champion.json   # Données des champions
│   │   └── skins.json      # Données des skins
│   ├── pages/
│   │   ├── collection.html # Page collection
│   │   └── gallery.html    # Page galerie skins
│   └── script/
│       ├── app.js          # Application champions
│       ├── collection.js   # Script collection
│       └── gallery.js      # Script galerie
├── database.js             # Connexion PostgreSQL
├── server.js               # Serveur Express
├── index.html              # Page principale
└── package.json            # Dépendances

```

## 🛠️ Technologies utilisées

- **Frontend :** HTML, CSS, JavaScript vanilla
- **Backend :** Node.js, Express
- **Base de données :** PostgreSQL
- **Authentification :** bcrypt, express-session
- **Déploiement :** Scalingo

## 📦 Scripts disponibles

```bash
npm start       # Démarre le serveur
npm run dev     # Mode développement
```

## 🔐 Sécurité

- Mots de passe hashés avec bcrypt
- Sessions sécurisées
- Variables d'environnement (.env)
- Protection CSRF

## 📝 Licence

ISC

## 👤 Auteur

PrettyFlacko

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
