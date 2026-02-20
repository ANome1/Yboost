# Configuration Locale - Tests et Développement

## ⚠️ IMPORTANT : Déploiement Désactivé en Local

Ce projet est configuré pour le **développement local uniquement**. Le déploiement automatique est **désactivé**.

## 🚫 Tests Désactivés

Aucun script de test n'est configuré pour éviter les erreurs lors du développement local.

## 🔧 Configuration Locale

### Variables d'environnement (.env)

```env
NODE_ENV=development          # Mode développement FORCÉ
LOG_LEVEL=debug               # Logs détaillés en console uniquement
DB_NAME=ybooster              # Base de données locale
DB_PASSWORD=yboost2026        # Mot de passe local
```

### Comportements en Mode Développement

✅ **Actifs** :
- Logs en console (pas de fichiers)
- Base de données PostgreSQL locale
- Sessions avec cookie non-sécurisé (pas de HTTPS requis)
- Hot reload manuel (redémarrer le serveur après modifications)

❌ **Désactivés** :
- Création de fichiers de logs
- SSL/HTTPS pour les cookies
- Déploiement automatique sur Scalingo
- Scripts de tests automatiques
- Mode production

## 📦 Déploiement Manuel (si nécessaire)

### Déployer sur Scalingo

```bash
# 1. S'assurer d'être sur la branche main
git checkout main

# 2. Commit et push vers GitHub (optionnel)
git add .
git commit -m "Updates"
git push origin main

# 3. Déployer sur Scalingo MANUELLEMENT
git push scalingo main
```

### Variables d'environnement Scalingo

Sur Scalingo, définir :
```bash
NODE_ENV=production
DATABASE_URL=<fourni automatiquement par Scalingo>
SESSION_SECRET=<générer une clé aléatoire sécurisée>
LOG_LEVEL=info
```

## 🛠️ Développement Local

### Démarrer le serveur

```bash
npm start
# ou
npm run dev
```

### Accès

- Application : http://localhost:3000
- Base de données : ybooster (PostgreSQL local)

### Logs

Tous les logs s'affichent uniquement dans la console. Aucun fichier n'est créé.

## ✅ Checklist Configuration Locale

- [x] NODE_ENV=development dans .env
- [x] PostgreSQL installé localement
- [x] Base de données "ybooster" créée
- [x] Utilisateur PostgreSQL configuré
- [x] Déploiement automatique désactivé
- [x] Tests automatiques désactivés
- [x] Logs en console uniquement

## 🔐 Sécurité

**Ne jamais** :
- Mettre NODE_ENV=production en local
- Commiter le fichier .env
- Pousser automatiquement vers Scalingo
- Utiliser les mêmes secrets en local et en production

## 📝 Notes

- La branche `main` a été synchronisée avec `TestBooster`
- Le déploiement se fait uniquement manuellement
- Pas de CI/CD automatique configuré
- Logs de production désactivés en local
