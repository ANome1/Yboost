# 🎮 Yboost - Simulateur de Boosters League of Legends

Application web d'ouverture de boosters de skins League of Legends avec système de raretés et authentification.

## ✨ Fonctionnalités

- 🎁 **Ouverture de boosters** - 5 skins aléatoires par booster
- ⭐ **Système de raretés** - Standard, Épique, Légendaire, Mythique, Ultimate
- 🎨 **Interface moderne** - Animations fluides et design responsive
- 🔐 **Authentification sécurisée** - Inscription/connexion avec PostgreSQL
- 💾 **Sauvegarde en BDD** - Toutes les collections sont persistées
- 📊 **Statistiques** - Visualisation du nombre de skins par rareté
- 🧪 **Stress test** - Bouton pour générer 100 skins aléatoires (dev)
- 📝 **Logs structurés** - Winston + Morgan pour le monitoring

## 🚀 Installation Locale

### Prérequis

- **Node.js** v14+
- **PostgreSQL** v12+
- **npm** ou **yarn**

### 1. Cloner le projet

```bash
git clone https://github.com/ANome1/Yboost.git
cd Yboost
```

### 2. Installer PostgreSQL (si nécessaire)

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

### 3. Créer la base de données locale

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données
CREATE DATABASE ybooster;

# Créer un utilisateur (optionnel)
# CREATE USER votre_user WITH PASSWORD 'votre_mdp';
# GRANT ALL PRIVILEGES ON DATABASE ybooster TO votre_user;

\q
```

### 4. Configurer les variables d'environnement

Le fichier `.env` est déjà configuré pour le développement local :

```env
DB_NAME=ybooster
DB_PASSWORD=yboost2026
NODE_ENV=development
LOG_LEVEL=debug
```

**⚠️ IMPORTANT** : Ce fichier est pour le **développement local uniquement**. Ne pas utiliser en production.

### 5. Installer les dépendances

```bash
npm install
```

### 6. Démarrer le serveur

```bash
npm start
# ou
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

## 📁 Structure du Projet

```
Yboost/
├── src/
│   ├── assets/
│   │   └── main.css           # Styles CSS (1318 lignes)
│   ├── components/
│   │   ├── auth.js            # Modal authentification
│   │   ├── card.js            # Composant carte de skin
│   │   ├── modal.js           # Modal générique
│   │   └── toast.js           # Notifications toast
│   ├── data/
│   │   ├── champion.json      # Données des champions (~200 KB)
│   │   └── skins.json         # Données des skins (~5.2 MB, 15k+ skins)
│   ├── pages/
│   │   ├── boosters.html      # Page d'ouverture de boosters
│   │   ├── collection.html    # Page collection de skins
│   │   └── gallery.html       # Galerie des skins disponibles
│   └── script/
│       ├── app.js             # Script de la page champions
│       ├── boosters.js        # Logique d'ouverture de boosters
│       ├── collection.js      # Affichage de la collection + stress test
│       └── gallery.js         # Galerie de skins
├── database.js                # Connexion et opérations PostgreSQL
├── logger.js                  # Configuration Winston (logs structurés)
├── server.js                  # Serveur Express + routes API
├── index.html                 # Page principale (boosters)
├── package.json               # Dépendances
├── Procfile                   # Configuration Scalingo
├── .env                       # Variables locales (ne pas commiter)
├── .env.production.example    # Template pour production
├── AUTH_SETUP.md              # Documentation auth PostgreSQL
├── LOGGING.md                 # Documentation système de logs
├── LOCAL_DEV.md               # Configuration développement local
└── SCALINGO_SETUP.md          # Instructions déploiement Scalingo
```

## 🎲 Comment utiliser l'application

### 1. Créer un compte

- Ouvrir http://localhost:3000
- Cliquer sur **"Connexion"** en haut à droite
- Onglet **"Inscription"** : entrer pseudo + mot de passe
- Les identifiants sont hashés avec bcrypt

### 2. Ouvrir des boosters

- Page **Boosters** : cliquer sur **"Ouvrir le Booster"**
- 5 cartes face cachée apparaissent
- Cliquer sur chaque carte pour la révéler (animation progressive)
- Ou cliquer sur **"Tout Révéler"** pour dévoiler toutes les cartes
- Les skins sont automatiquement sauvegardés dans la BDD

### 3. Consulter sa collection

- Page **Collection** : visualiser tous les skins obtenus
- Statistiques par rareté affichées en haut
- Filtrage par rareté disponible
- Les duplicatas affichent un badge avec le nombre

### 4. Stress test (développement)

- Page **Collection** : bouton rouge **"Générer 100 Skins"**
- Génère 100 skins aléatoires côté **serveur**
- Utile pour tester les performances et l'affichage

## 🎨 Système de Raretés

| Rareté | Probabilité | Couleur | Valeur API |
|--------|------------|---------|------------|
| ⚪ **Standard** | 40% | Blanc | `kNoRarity` |
| 🟣 **Épique** | 35% | Violet | `kEpic` |
| 🟡 **Légendaire** | 20% | Or | `kLegendary` |
| 🔴 **Mythique** | 5% | Rouge | `kMythic` |
| 💎 **Ultimate** | Très rare | Arc-en-ciel | `kUltimate` |

## 🔧 Technologies

### Backend
- **Node.js** + **Express 5.2.1** - Serveur HTTP
- **PostgreSQL** - Base de données relationnelle
- **bcrypt** - Hashage des mots de passe (10 rounds)
- **express-session** - Gestion des sessions (7 jours)
- **Winston 3.17.0** - Logs structurés avec rotation
- **Morgan 1.10.0** - Logs HTTP

### Frontend
- **HTML5 / CSS3 / JavaScript** (vanilla, aucun framework)
- **Fetch API** - Communication avec le serveur
- **CSS Grid + Flexbox** - Layout responsive
- **Animations CSS** - Transitions fluides

### Base de données
- **PostgreSQL** - Connexion via socket Unix (local) ou DATABASE_URL (production)
- **Tables** :
  - `users` : id, pseudo, mot_de_passe, date_creation
  - `user_skins` : id, user_id, skin_id, name, rarity, obtained_at
- **Indexes** : `idx_user_skins_user_id`, `idx_user_skins_rarity`

## 📦 API Routes

### Authentification

```
POST   /api/register       # Inscription (pseudo, motDePasse)
POST   /api/login          # Connexion (pseudo, motDePasse)
POST   /api/logout         # Déconnexion
GET    /api/session        # Vérifier session active
```

### Skins

```
GET    /api/user/skins     # Récupérer la collection de l'utilisateur
POST   /api/user/skins     # Sauvegarder des skins
POST   /api/stress-test    # Générer 100 skins aléatoires (dev)
```

## 📝 Logs

### Développement Local (NODE_ENV=development)

- **Console uniquement** - Aucun fichier de log créé
- **Niveau** : DEBUG - Tous les détails affichés
- **Format** : Colorisé et horodaté

### Production (NODE_ENV=production)

- **Console + Fichiers**
- **Fichiers** :
  - `logs/combined.log` - Tous les logs (rotation 5 fichiers × 5MB)
  - `logs/error.log` - Erreurs uniquement (rotation 5 fichiers × 5MB)
- **Niveau** : INFO par défaut (configurable via `LOG_LEVEL`)

Voir [LOGGING.md](LOGGING.md) pour plus de détails.

## ☁️ Déploiement Scalingo

⚠️ **Le déploiement automatique est DÉSACTIVÉ**. Voir [LOCAL_DEV.md](LOCAL_DEV.md).

Pour déployer **manuellement** :

```bash
# 1. Vérifier la branche
git checkout main

# 2. Déployer sur Scalingo
git push scalingo main
```

### Variables d'environnement Scalingo

À configurer dans le dashboard Scalingo :

```env
NODE_ENV=production
DATABASE_URL=<fourni automatiquement par l'addon PostgreSQL>
SESSION_SECRET=<générer avec: openssl rand -base64 32>
LOG_LEVEL=info
```

Voir [.env.production.example](.env.production.example) et [SCALINGO_SETUP.md](SCALINGO_SETUP.md) pour les détails.

## 🔐 Sécurité

- ✅ **Mots de passe hashés** avec bcrypt (10 rounds)
- ✅ **Sessions sécurisées** avec cookies httpOnly
- ✅ **Variables d'environnement** (.env non commité)
- ✅ **Connexion PostgreSQL** via socket Unix (local) ou SSL (production)
- ⚠️ **Pas de localStorage** - Authentification obligatoire
- ⚠️ **Session secret** différent entre local et production

## 🧪 Développement

### Démarrer en mode développement

```bash
npm run dev
```

### Vérifier les logs

```bash
# Logs du serveur (console)
# Les logs s'affichent automatiquement avec des couleurs

# Vérifier la BDD
psql -d ybooster -c "SELECT COUNT(*) FROM users;"
psql -d ybooster -c "SELECT COUNT(*) FROM user_skins;"
```

### Réinitialiser la base de données

```bash
psql -d ybooster -c "DROP TABLE IF EXISTS user_skins, users CASCADE;"
# Redémarrer le serveur pour recréer les tables automatiquement
```

## ⚠️ Notes Importantes

- **LocalStorage désactivé** - L'authentification est **obligatoire**
- **Tests automatiques désactivés** - Pas de scripts de test configurés
- **Mode production local interdit** - Toujours utiliser `NODE_ENV=development` en local
- **Pas de CI/CD** - Déploiement manuel uniquement

## 📚 Documentation

- [AUTH_SETUP.md](AUTH_SETUP.md) - Configuration authentification PostgreSQL
- [LOGGING.md](LOGGING.md) - Système de logs Winston/Morgan
- [LOCAL_DEV.md](LOCAL_DEV.md) - Configuration développement local
- [SCALINGO_SETUP.md](SCALINGO_SETUP.md) - Déploiement sur Scalingo
- [.env.production.example](.env.production.example) - Template variables production

## ⚖️ Licence

ISC

## 👤 Auteur

**PrettyFlacko**

## ⚠️ Avertissement

Ce projet n'est **pas affilié** à Riot Games. League of Legends et tous les assets associés sont la propriété exclusive de **Riot Games**.
