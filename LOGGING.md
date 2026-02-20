# Système de Logging - YBoosters

## 📊 Configuration

Le système de logging utilise **Winston** pour les logs applicatifs et **Morgan** pour les logs HTTP.

### Niveaux de log

- `error` - Erreurs critiques uniquement
- `warn` - Avertissements et erreurs
- `info` - Informations générales (recommandé pour la production)
- `debug` - Informations détaillées de débogage (développement)

### Configuration via .env

```env
# Niveau de logging
LOG_LEVEL=debug          # En développement
# LOG_LEVEL=info         # En production

# Environnement
NODE_ENV=development     # Les fichiers de logs sont créés en production uniquement
```

## 📁 Fichiers de logs (Production uniquement)

En production (`NODE_ENV=production`), les logs sont sauvegardés dans le dossier `logs/` :

- **`logs/combined.log`** - Tous les logs (rotation automatique, max 5 fichiers de 5MB)
- **`logs/error.log`** - Erreurs uniquement (rotation automatique, max 5 fichiers de 5MB)

En développement, les logs sont uniquement affichés dans la console.

## 🔍 Types de logs

### 1. Logs HTTP (Morgan)

Toutes les requêtes HTTP sont automatiquement loggées :

```
[2026-02-20 12:00:00] INFO: ::1 - - [20/Feb/2026:12:00:00 +0000] "GET /api/skins HTTP/1.1" 200 5242880
```

### 2. Logs d'authentification

Les événements d'authentification sont loggés avec détails :

```javascript
// Inscription réussie
[2026-02-20 12:01:00] INFO: AUTH REGISTER: john_doe - SUCCESS
[2026-02-20 12:01:00] INFO: Nouvel utilisateur inscrit: john_doe (ID: 1)

// Connexion échouée
[2026-02-20 12:02:00] WARN: AUTH LOGIN: john_doe - FAILED
```

### 3. Logs de base de données

Les opérations de base de données sont loggées :

```javascript
// Initialisation
[2026-02-20 12:00:00] INFO: ✅ Base de données PostgreSQL initialisée
[2026-02-20 12:00:00] DEBUG: Tables créées: users, user_skins

// Opérations
[2026-02-20 12:03:00] INFO: 5 skins ajoutés pour john_doe
[2026-02-20 12:04:00] DEBUG: Skins récupérés pour john_doe: 150 skins

// Erreurs
[2026-02-20 12:05:00] ERROR: DATABASE ERROR [createUser]: duplicate key value violates unique constraint
```

### 4. Logs de stress test

Les tests de charge sont loggés avec niveau WARN pour traçabilité :

```javascript
[2026-02-20 12:10:00] WARN: STRESS TEST: 100 skins générés pour john_doe (ID: 1)
```

### 5. Logs de déconnexion

```javascript
[2026-02-20 12:15:00] INFO: Utilisateur déconnecté: john_doe
```

## 🛠️ Utilisation du logger dans le code

### Import

```javascript
const logger = require('./logger');
```

### Méthodes de base

```javascript
// Logs standards
logger.error('Message d\'erreur', { context: 'data' });
logger.warn('Message d\'avertissement');
logger.info('Message informatif');
logger.debug('Message de débogage');
```

### Méthodes helper personnalisées

```javascript
// Log d'authentification
logger.logAuth('register', 'pseudo', true, '127.0.0.1', 'détails optionnels');
logger.logAuth('login', 'pseudo', false, '127.0.0.1', 'Mot de passe incorrect');

// Log d'erreur de base de données
logger.logDbError('createUser', error);

// Log de requête HTTP (utilisé automatiquement par Morgan)
logger.logRequest(req, 200, 45); // req, statusCode, responseTime
```

## 📈 Monitoring en production

### Visualiser les logs en temps réel

```bash
# Tous les logs
tail -f logs/combined.log

# Erreurs uniquement
tail -f logs/error.log

# Filtrer par niveau
grep "ERROR" logs/combined.log
grep "WARN" logs/combined.log
```

### Analyser les logs

```bash
# Compter les erreurs
grep "ERROR" logs/combined.log | wc -l

# Voir les dernières erreurs
grep "ERROR" logs/error.log | tail -20

# Authentifications échouées
grep "AUTH.*FAILED" logs/combined.log

# Stress tests effectués
grep "STRESS TEST" logs/combined.log
```

### Rotation des logs

La rotation est automatique :
- Taille maximale par fichier : 5 MB
- Nombre de fichiers conservés : 5
- Total d'espace disque : ~50 MB maximum (2 types × 5 fichiers × 5 MB)

Les anciens fichiers sont automatiquement supprimés.

## 🚀 Déploiement

### Variables d'environnement en production

Sur Scalingo, Heroku ou autre plateforme :

```bash
# Définir le niveau de log
scalingo env-set LOG_LEVEL=info

# Définir l'environnement
scalingo env-set NODE_ENV=production
```

### Points d'attention

1. **Espace disque** : Les logs en production peuvent consommer de l'espace. Le système de rotation limite à ~50 MB.

2. **Performances** : Le logging asynchrone de Winston n'impacte pas les performances.

3. **Données sensibles** : Les mots de passe ne sont **jamais** loggés. Seuls les pseudos et IDs sont enregistrés.

4. **IP tracking** : Les IPs sont loggées pour détecter les tentatives de connexion suspectes.

## 🔒 Sécurité

### Données loggées

✅ **Loggé** :
- Pseudos utilisateurs
- IDs utilisateurs
- IPs (pour sécurité)
- Timestamps
- Actions effectuées
- Résultats (succès/échec)

❌ **NON loggé** :
- Mots de passe (en clair ou hashés)
- Tokens de session
- Données personnelles sensibles

### Exemple de log d'authentification

```javascript
// ✅ Sécurisé
[2026-02-20 12:00:00] INFO: AUTH LOGIN: john_doe - SUCCESS
{ action: 'login', pseudo: 'john_doe', success: true, ip: '127.0.0.1' }

// ❌ JAMAIS loggé
// mot_de_passe: 'password123'  <- N'apparaît JAMAIS dans les logs
```

## 📝 Exemple de logs complets d'une session

```
[2026-02-20 12:00:00] INFO: ✅ Base de données PostgreSQL initialisée
[2026-02-20 12:00:00] DEBUG: Tables créées: users, user_skins
[2026-02-20 12:00:00] INFO: ✅ Yboost server listening on port 3000
[2026-02-20 12:00:00] INFO: Environment: development
[2026-02-20 12:00:00] INFO: Log level: debug
[2026-02-20 12:01:15] INFO: GET /api/session 200 - 12ms
[2026-02-20 12:01:30] INFO: AUTH REGISTER: alice - SUCCESS
[2026-02-20 12:01:30] INFO: Nouvel utilisateur inscrit: alice (ID: 1)
[2026-02-20 12:01:30] INFO: POST /api/register 200 - 145ms
[2026-02-20 12:02:00] INFO: 5 skins ajoutés pour alice
[2026-02-20 12:02:00] INFO: POST /api/user/skins 200 - 23ms
[2026-02-20 12:02:15] DEBUG: Skins récupérés pour alice: 5 skins
[2026-02-20 12:02:15] INFO: GET /api/user/skins 200 - 15ms
[2026-02-20 12:05:00] WARN: STRESS TEST: 100 skins générés pour alice (ID: 1)
[2026-02-20 12:05:00] INFO: POST /api/stress-test 200 - 234ms
[2026-02-20 12:10:00] INFO: Utilisateur déconnecté: alice
[2026-02-20 12:10:00] INFO: POST /api/logout 200 - 5ms
```

## 🛡️ Troubleshooting

### Logs non créés en production

Vérifier que `NODE_ENV=production` est bien défini :

```bash
echo $NODE_ENV
# Devrait afficher: production
```

### Permissions sur le dossier logs/

Si erreur de permissions :

```bash
chmod 755 logs/
chmod 644 logs/*.log
```

### Logs trop volumineux

Réduire le niveau de log en production :

```env
LOG_LEVEL=warn  # Au lieu de 'info' ou 'debug'
```

### Analyser les pics de trafic

```bash
# Requêtes par heure
grep "$(date '+%Y-%m-%d %H')" logs/combined.log | wc -l

# Top 10 des endpoints les plus appelés
grep "GET\|POST" logs/combined.log | awk '{print $4}' | sort | uniq -c | sort -nr | head -10
```

## 📚 Ressources

- [Documentation Winston](https://github.com/winstonjs/winston)
- [Documentation Morgan](https://github.com/expressjs/morgan)
