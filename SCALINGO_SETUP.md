# Configuration PostgreSQL pour Yboost

## 🚀 Migration totale vers PostgreSQL

L'application utilise maintenant **PostgreSQL uniquement** (local et production).

---

## 📋 Configuration en local

### 1. Installer PostgreSQL

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

### 2. Créer la base de données locale

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données
CREATE DATABASE yboost_dev;

# Créer un utilisateur (optionnel)
CREATE USER yboost_user WITH PASSWORD 'votre_password';
GRANT ALL PRIVILEGES ON DATABASE yboost_dev TO yboost_user;

# Quitter
\q
```

### 3. Configurer les variables d'environnement

```bash
# Copier le fichier exemple
cp .env.example .env

# Éditer .env avec votre configuration
# DATABASE_URL=postgresql://localhost/yboost_dev
# ou avec utilisateur/mot de passe :
# DATABASE_URL=postgresql://yboost_user:votre_password@localhost/yboost_dev
```

### 4. Lancer l'application

```bash
npm install
npm start
```

Vous devriez voir :
```
✅ Base de données PostgreSQL initialisée
📊 Connecté à: PostgreSQL (Local)
✅ Yboost server listening on port 3000
```

---

## ☁️ Configuration sur Scalingo

### 1. Ajouter l'addon PostgreSQL

**Via le dashboard :**
1. Allez sur https://dashboard.scalingo.com
2. Sélectionnez votre app `mon-app-tah-les-fous`
3. Onglet "Addons"
4. Cliquez sur "PostgreSQL"
5. Choisissez "Starter 512MB" (gratuit)
6. Cliquez sur "Provision"

**Via la CLI :**
```bash
scalingo --app mon-app-tah-les-fous addons-add postgresql postgresql-starter-512
```

### 2. Vérifier la configuration

```bash
# Lister les addons
scalingo --app mon-app-tah-les-fous addons

# Voir les variables d'environnement (DATABASE_URL ajoutée automatiquement)
scalingo --app mon-app-tah-les-fous env | grep DATABASE_URL
```

### 3. Déployer l'application

```bash
git add .
git commit -m "Migration complète PostgreSQL"
git push scalingo main
```

### 4. Vérifier le déploiement

```bash
# Voir les logs en temps réel
scalingo --app mon-app-tah-les-fous logs --lines 100

# Vous devriez voir :
# ✅ Base de données PostgreSQL initialisée
# 📊 Connecté à: PostgreSQL (Scalingo)
# ✅ Yboost server listening on port XXXX
```

---

## 🗄️ Structure de la base de données

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  pseudo VARCHAR(50) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Gestion de la base de données

### En local

```bash
# Se connecter à la base
psql yboost_dev

# Commandes utiles
\dt                          # Lister les tables
\d users                     # Décrire la table users
SELECT * FROM users;         # Voir tous les utilisateurs
SELECT COUNT(*) FROM users;  # Compter les utilisateurs
\q                           # Quitter
```

### Sur Scalingo

```bash
# Ouvrir une console PostgreSQL
scalingo --app mon-app-tah-les-fous pgsql-console

# Commandes
\dt                          # Lister les tables
SELECT * FROM users;         # Voir les utilisateurs
\q                           # Quitter
```

---

## 📦 Dépendances

```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "dotenv": "^17.3.1",
    "express": "^5.2.1",
    "express-session": "^1.19.0",
    "pg": "^8.18.0"
  }
}
```

---

## ✅ Avantages de PostgreSQL

- ✅ Base unique pour dev et prod (pas de différences SQLite/PostgreSQL)
- ✅ Données persistantes sur Scalingo
- ✅ Transactions ACID complètes
- ✅ Excellent pour la scalabilité
- ✅ Support JSON natif
- ✅ Gratuit sur Scalingo (plan Starter)

---

## 🆘 Troubleshooting

### Erreur de connexion locale

```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql  # Linux
brew services list               # macOS

# Tester la connexion
psql -d yboost_dev
```

### Erreur "database does not exist"

```bash
# Créer la base
sudo -u postgres createdb yboost_dev
```

### Erreur sur Scalingo

```bash
# Vérifier que l'addon est provisionné
scalingo --app mon-app-tah-les-fous addons

# Redémarrer l'app
scalingo --app mon-app-tah-les-fous restart

# Voir les logs détaillés
scalingo --app mon-app-tah-les-fous logs --lines 200
```

---

## 🔐 Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Sessions sécurisées
- ✅ Variables d'environnement pour les credentials
- ✅ SSL en production (Scalingo)
- ⚠️ Ne jamais committer `.env` (dans `.gitignore`)

