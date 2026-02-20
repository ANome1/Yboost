require('dotenv').config()
var express = require('express')
var session = require('express-session')
var morgan = require('morgan')
var path = require('path')
var db = require('./database')
var logger = require('./logger')
var app = express()

// Middleware de logging HTTP
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Trust proxy - nécessaire pour Scalingo/Heroku et autres plateformes avec reverse proxy
// Permet à Express de faire confiance aux headers X-Forwarded-* du proxy
app.set('trust proxy', 1)

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'yboost-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    sameSite: 'lax'
  }
}))

// Servir les fichiers statiques avec cache
app.use(express.static(__dirname, {
  maxAge: '1d', // Cache de 1 jour pour les fichiers statiques
  etag: true,
  lastModified: true
}))
app.use('/src', express.static(path.join(__dirname, 'src'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}))

// Routes pour les pages
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/collection', function (req, res) {
  res.sendFile(path.join(__dirname, 'src/pages/collection.html'))
})

app.get('/gallery', function (req, res) {
  res.sendFile(path.join(__dirname, 'src/pages/gallery.html'))
})

// Routes API pour les données
app.get('/api/skins', function (req, res) {
  try {
    const skinsData = require('./src/data/skins.json')
    const filtered = Object.fromEntries(
      Object.entries(skinsData).filter(([, skin]) =>
        !skin.name?.toLowerCase().includes('doom bot')
      )
    )
    res.json(filtered)
  } catch (err) {
    logger.error('Erreur chargement skins:', err)
    res.status(500).json({ error: 'Erreur chargement des skins' })
  }
})

// Route pour vérifier la session
app.get('/api/session', function (req, res) {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.user.id,
        pseudo: req.session.user.pseudo
      }
    })
  } else {
    res.json({ authenticated: false })
  }
})

// Route d'inscription
app.post('/api/register', async function (req, res) {
  try {
    const { pseudo, motDePasse } = req.body
    
    if (!pseudo || !motDePasse) {
      return res.status(400).json({ error: 'Pseudo et mot de passe requis' })
    }
    
    if (pseudo.length < 3 || pseudo.length > 20) {
      return res.status(400).json({ error: 'Le pseudo doit contenir entre 3 et 20 caractères' })
    }
    
    if (motDePasse.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    }
    
    const result = await db.createUser(pseudo, motDePasse)
    
    if (result.success) {
      req.session.user = {
        id: result.userId,
        pseudo: pseudo
      }
      logger.logAuth('register', pseudo, true, req.ip)
      logger.info(`Nouvel utilisateur inscrit: ${pseudo} (ID: ${result.userId})`)
      res.json({ success: true, user: req.session.user })
    } else {
      logger.logAuth('register', pseudo, false, req.ip, result.error)
      res.status(400).json({ error: result.error })
    }
  } catch (error) {
    logger.error('Erreur inscription:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Route de connexion
app.post('/api/login', async function (req, res) {
  try {
    const { pseudo, motDePasse } = req.body
    
    if (!pseudo || !motDePasse) {
      return res.status(400).json({ error: 'Pseudo et mot de passe requis' })
    }
    
    const result = await db.verifyUser(pseudo, motDePasse)
    
    if (result.success) {
      req.session.user = result.user
      logger.logAuth('login', pseudo, true, req.ip)
      logger.info(`Utilisateur connecté: ${pseudo} (ID: ${result.user.id})`)
      res.json({ success: true, user: result.user })
    } else {
      logger.logAuth('login', pseudo, false, req.ip, result.error)
      res.status(401).json({ error: result.error })
    }
  } catch (error) {
    logger.error('Erreur connexion:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Route de déconnexion
app.post('/api/logout', function (req, res) {
  const pseudo = req.session.user ? req.session.user.pseudo : 'unknown'
  req.session.destroy(function (err) {
    if (err) {
      logger.error('Erreur déconnexion:', err)
      res.status(500).json({ error: 'Erreur lors de la déconnexion' })
    } else {
      logger.info(`Utilisateur déconnecté: ${pseudo}`)
      res.json({ success: true })
    }
  })
})

// Route pour obtenir les skins de l'utilisateur
app.get('/api/user/skins', async function (req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  
  try {
    const skins = await db.getUserSkins(req.session.user.id)
    logger.debug(`Skins récupérés pour ${req.session.user.pseudo}: ${skins.length} skins`)
    res.json(skins)
  } catch (error) {
    logger.error('Erreur récupération skins:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Route pour ajouter des skins à l'utilisateur
app.post('/api/user/skins', async function (req, res) {
  if (!req.session.user) {
    logger.warn('❌ Tentative d\'ajout de skins sans authentification')
    return res.status(401).json({ error: 'Non authentifié' })
  }
  
  try {
    const { skins } = req.body
    
    if (!Array.isArray(skins) || skins.length === 0) {
      logger.warn(`❌ Données invalides reçues de ${req.session.user.pseudo}:`, { isArray: Array.isArray(skins), length: skins?.length })
      return res.status(400).json({ error: 'Données invalides' })
    }
    
    logger.debug(`Tentative d'ajout de ${skins.length} skins pour ${req.session.user.pseudo}`)
    
    const result = await db.addSkinsToUser(req.session.user.id, skins)
    
    if (result.success) {
      logger.info(`✅ ${skins.length} skins ajoutés pour ${req.session.user.pseudo}`)
      res.json({ success: true })
    } else {
      logger.error(`❌ Échec ajout skins pour ${req.session.user.pseudo}: ${result.error}`)
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    logger.error('Erreur ajout skins:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Initialiser la base de données avant de démarrer le serveur
async function startServer() {
  await db.initDatabase()
  
  var server = app.listen(process.env.PORT || 3000, function () {
    var port = process.env.PORT || 3000
    logger.info(`✅ Yboost server listening on port ${port}`)
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`Log level: ${logger.level}`)
  })
}

startServer()
