require('dotenv').config()
var express = require('express')
var session = require('express-session')
var path = require('path')
var db = require('./database')
var app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'yboost-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 jours
  }
}))

// Servir les fichiers statiques
app.use(express.static(__dirname))
app.use('/src', express.static(path.join(__dirname, 'src')))

// Routes pour les pages
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// Routes API pour les données
app.get('/api/skins', function (req, res) {
  res.sendFile(path.join(__dirname, 'src/data/skins.json'))
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
      res.json({ success: true, user: req.session.user })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error) {
    console.error('Erreur inscription:', error)
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
      res.json({ success: true, user: result.user })
    } else {
      res.status(401).json({ error: result.error })
    }
  } catch (error) {
    console.error('Erreur connexion:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Route de déconnexion
app.post('/api/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      res.status(500).json({ error: 'Erreur lors de la déconnexion' })
    } else {
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
    res.json(skins)
  } catch (error) {
    console.error('Erreur récupération skins:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Route pour ajouter des skins à l'utilisateur
app.post('/api/user/skins', async function (req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  
  try {
    const { skins } = req.body
    
    if (!Array.isArray(skins) || skins.length === 0) {
      return res.status(400).json({ error: 'Données invalides' })
    }
    
    const result = await db.addSkinsToUser(req.session.user.id, skins)
    
    if (result.success) {
      res.json({ success: true })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    console.error('Erreur ajout skins:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Route de stress test - générer beaucoup de skins aléatoires
app.post('/api/stress-test', async function (req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Charger tous les skins disponibles
    const skinsPath = path.join(__dirname, 'src/data/skins.json')
    const skinsData = JSON.parse(fs.readFileSync(skinsPath, 'utf8'))
    const allSkins = Object.values(skinsData)
    
    // Générer 100 skins aléatoires
    const randomSkins = []
    const COUNT = 100
    
    for (let i = 0; i < COUNT; i++) {
      const randomSkin = allSkins[Math.floor(Math.random() * allSkins.length)]
      randomSkins.push({
        skinId: randomSkin.id,
        skinName: randomSkin.name,
        rarity: randomSkin.rarity || 'kNoRarity'
      })
    }
    
    // Ajouter tous les skins à la base de données
    const result = await db.addSkinsToUser(req.session.user.id, randomSkins)
    
    if (result.success) {
      console.log(`🚀 Stress test: ${COUNT} skins générés pour l'utilisateur ${req.session.user.pseudo}`)
      res.json({ success: true, count: COUNT })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    console.error('Erreur stress test:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Initialiser la base de données avant de démarrer le serveur
async function startServer() {
  await db.initDatabase()
  
  var server = app.listen(process.env.PORT || 3000, function () {
    var port = process.env.PORT || 3000
    console.log('✅ Yboost server listening on port', port)
  })
}

startServer()
