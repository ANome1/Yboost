# Configuration de l'authentification PostgreSQL

## ✅ Implémentation terminée

Le système d'authentification PostgreSQL a été intégré avec succès au projet YBoosters.

### Fonctionnalités

- **Inscription/Connexion** : Les utilisateurs peuvent créer un compte et se connecter
- **Sessions** : Les sessions utilisateur sont maintenues avec express-session
- **Stockage des skins** : Les skins sont sauvegardés dans PostgreSQL pour les utilisateurs connectés
- **Mode dégradé** : L'application fonctionne avec localStorage si PostgreSQL n'est pas disponible

### Architecture

#### Backend

1. **database.js** : Module de gestion PostgreSQL
   - Création des tables `users` et `user_skins`
   - Fonctions CRUD pour les utilisateurs et leurs skins
   - Hachage des mots de passe avec bcrypt
   - Gestion gracieuse de l'indisponibilité de la BDD

2. **server.js** : Routes d'authentification
   - `POST /api/register` - Inscription
   - `POST /api/login` - Connexion
   - `POST /api/logout` - Déconnexion
   - `GET /api/session` - Vérifier la session
   - `GET /api/user/skins` - Récupérer les skins de l'utilisateur
   - `POST /api/user/skins` - Sauvegarder des skins

#### Frontend

1. **src/components/auth.js** : Composant d'authentification
   - Modal de connexion/inscription
   - Vérification de session au chargement
   - Bouton de connexion dans le header
   - Gestion de la déconnexion

2. **src/script/boosters.js** : Sauvegarde des skins
   - Enregistre dans PostgreSQL si connecté
   - Fallback sur localStorage sinon

3. **src/script/collection.js** : Affichage de la collection
   - Charge depuis PostgreSQL si connecté
   - Charge depuis localStorage sinon

4. **src/assets/main.css** : Styles du modal d'authentification

### Installation de PostgreSQL (optionnel)

L'application fonctionne sans PostgreSQL en mode localStorage. Pour activer la base de données :

#### Linux (Ubuntu/Debian)
```bash
# Installer PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Démarrer le service
sudo service postgresql start

# Créer la base de données
sudo -u postgres createdb yboost

# (Optionnel) Créer un utilisateur dédié
sudo -u postgres psql
CREATE USER yboost_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE yboost TO yboost_user;
\q
```

#### macOS
```bash
# Avec Homebrew
brew install postgresql@14
brew services start postgresql@14
createdb yboost
```

#### Windows
1. Télécharger PostgreSQL depuis https://www.postgresql.org/download/windows/
2. Installer avec pgAdmin
3. Créer une base de données nommée `yboost`

### Configuration

Créer un fichier `.env` à la racine du projet :

```env
# URL de connexion PostgreSQL
DATABASE_URL=postgresql://localhost/yboost
# ou avec utilisateur/mot de passe :
# DATABASE_URL=postgresql://yboost_user:votre_mot_de_passe@localhost/yboost

# Secret pour les sessions (générez une chaîne aléatoire)
SESSION_SECRET=changez-cette-valeur-en-production

# Environnement
NODE_ENV=development
```

### Structure de la base de données

#### Table `users`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PRIMARY KEY | ID de l'utilisateur |
| pseudo | VARCHAR(50) UNIQUE | Pseudo (3-20 caractères) |
| mot_de_passe | VARCHAR(255) | Mot de passe haché (bcrypt) |
| date_creation | TIMESTAMP | Date de création du compte |

#### Table `user_skins`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PRIMARY KEY | ID de l'entrée |
| user_id | INTEGER | Référence à users(id) |
| skin_id | INTEGER | ID du skin |
| skin_name | VARCHAR(200) | Nom du skin |
| rarity | VARCHAR(20) | Rareté du skin |
| date_ajout | TIMESTAMP | Date d'obtention |

### Dépendances ajoutées

- `bcrypt` : Hachage des mots de passe
- `pg` : Client PostgreSQL
- `express-session` : Gestion des sessions
- `dotenv` : Variables d'environnement

### Mode de fonctionnement

1. **Avec PostgreSQL disponible** :
   - Les utilisateurs peuvent créer un compte
   - Les skins sont sauvegardés en BDD
   - La collection est persistante même après changement de navigateur

2. **Sans PostgreSQL** :
   - L'application démarre normalement
   - Les skins sont sauvegardés en localStorage
   - Message informatif affiché à l'utilisateur

### Sécurité

- ✅ Mots de passe hachés avec bcrypt (10 rounds)
- ✅ Sessions sécurisées avec express-session
- ✅ Protection CSRF via httpOnly cookies
- ✅ Validation des entrées côté serveur
- ✅ Contraintes SQL (pseudo unique, longueur min/max)

### Déploiement

Pour déployer sur Scalingo, Heroku ou autre plateforme :

1. La plateforme fournira automatiquement `DATABASE_URL`
2. Définir `SESSION_SECRET` dans les variables d'environnement
3. Définir `NODE_ENV=production`
4. Les tables seront créées automatiquement au premier démarrage

### Tests

1. Démarrer le serveur : `npm start`
2. Ouvrir http://localhost:3000
3. Cliquer sur "Connexion" dans le header
4. Tester l'inscription et la connexion
5. Ouvrir un booster
6. Vérifier que les skins s'affichent dans "Ma Collection"

### Notes

- Le bouton "Connexion" affiche le pseudo une fois connecté
- Cliquer sur le pseudo déconnecte l'utilisateur
- Les skins sont comptés avec leurs doublons
- Le localStorage est utilisé comme fallback en cas d'erreur
