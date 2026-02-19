# Yboost - Plateforme League of Legends

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
