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
    return res.status(401).json({ error: 'Non authentifié' })
  }
  
  try {
    const { skins } = req.body
    
    if (!Array.isArray(skins) || skins.length === 0) {
      return res.status(400).json({ error: 'Données invalides' })
    }
    
    const result = await db.addSkinsToUser(req.session.user.id, skins)
    
    if (result.success) {
      logger.info(`${skins.length} skins ajoutés pour ${req.session.user.pseudo}`)
      res.json({ success: true })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    logger.error('Erreur ajout skins:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Route de stress test - MAXIMUM DE CONSOMMATION DE RESSOURCES
app.post('/api/stress-test', async function (req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  
  const startTime = Date.now()
  let totalOperations = 0
  
  try {
    const fs = require('fs')
    const crypto = require('crypto')
    const path = require('path')
    
    logger.warn(`🔥 STRESS TEST DÉMARRÉ pour ${req.session.user.pseudo} (ID: ${req.session.user.id})`)
    
    // 1. CHARGER ET PARSER LE FICHIER JSON PLUSIEURS FOIS (I/O intensif)
    const skinsPath = path.join(__dirname, 'src/data/skins.json')
    let allSkins = []
    for (let i = 0; i < 10; i++) {
      const skinsData = JSON.parse(fs.readFileSync(skinsPath, 'utf8'))
      allSkins = Object.values(skinsData)
      totalOperations += allSkins.length
      logger.debug(`Parsing iteration ${i+1}/10 - ${allSkins.length} skins chargés`)
    }
    
    // 2. GÉNÉRER 5000 SKINS ALÉATOIRES
    const COUNT = 5000
    const randomSkins = []
    logger.info(`Génération de ${COUNT} skins aléatoires...`)
    
    for (let i = 0; i < COUNT; i++) {
      const randomSkin = allSkins[Math.floor(Math.random() * allSkins.length)]
      randomSkins.push({
        skinId: randomSkin.id,
        skinName: randomSkin.name,
        rarity: randomSkin.rarity || 'kNoRarity'
      })
      totalOperations++
    }
    
    // 3. CALCULS CPU INTENSIFS - Hashing cryptographique
    logger.info('Calculs cryptographiques intensifs...')
    const hashes = []
    for (let i = 0; i < 1000; i++) {
      const hash = crypto.createHash('sha512')
      for (let j = 0; j < 100; j++) {
        hash.update(`${req.session.user.pseudo}-${i}-${j}-${Date.now()}`)
      }
      hashes.push(hash.digest('hex'))
      totalOperations += 100
    }
    
    // 4. MANIPULATION DE TABLEAUX MASSIFS (Mémoire intensive)
    logger.info('Manipulation de tableaux massifs...')
    const massiveArray = Array(100000).fill(0).map((_, i) => ({
      id: i,
      value: Math.random() * 1000000,
      hash: crypto.randomBytes(32).toString('hex')
    }))
    totalOperations += massiveArray.length
    
    // 5. TRI ET FILTRAGE RÉPÉTÉS (CPU intensif)
    logger.info('Tris et filtrages répétés...')
    for (let i = 0; i < 5; i++) {
      massiveArray.sort((a, b) => b.value - a.value)
      const filtered = massiveArray.filter(item => item.value > 500000)
      totalOperations += massiveArray.length * 2
      logger.debug(`Tri ${i+1}/5 - ${filtered.length} éléments filtrés`)
    }
    
    // 6. SÉRIALISATION/DÉSÉRIALISATION JSON MASSIVE
    logger.info('Sérialisations JSON massives...')
    for (let i = 0; i < 20; i++) {
      const jsonStr = JSON.stringify(massiveArray)
      const parsed = JSON.parse(jsonStr)
      totalOperations += parsed.length * 2
    }
    
    // 7. OPÉRATIONS MATHÉMATIQUES COMPLEXES
    logger.info('Calculs mathématiques complexes...')
    let mathResult = 0
    for (let i = 0; i < 1000000; i++) {
      mathResult += Math.sqrt(i) * Math.sin(i) * Math.cos(i) / (Math.log(i + 1) + 1)
      totalOperations++
    }
    
    // 8. GÉNÉRATION DE DONNÉES ALÉATOIRES MASSIVES
    logger.info('Génération de données aléatoires...')
    const randomData = []
    for (let i = 0; i < 50000; i++) {
      randomData.push({
        id: crypto.randomUUID(),
        data: crypto.randomBytes(256).toString('base64'),
        timestamp: Date.now(),
        random: Math.random()
      })
      totalOperations++
    }
    
    // 9. CONCATÉNATIONS DE STRINGS MASSIVES
    logger.info('Concaténations de strings massives...')
    let massiveString = ''
    for (let i = 0; i < 10000; i++) {
      massiveString += `User-${req.session.user.pseudo}-Iteration-${i}-Hash-${crypto.randomBytes(16).toString('hex')}\n`
      totalOperations++
    }
    
    // 10. INSERTIONS EN BASE DE DONNÉES PAR LOTS
    logger.info(`Insertion en base de données de ${COUNT} skins...`)
    const result = await db.addSkinsToUser(req.session.user.id, randomSkins)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    // 11. LECTURE MULTIPLE DE LA BASE DE DONNÉES
    logger.info('Lectures multiples de la base de données...')
    for (let i = 0; i < 10; i++) {
      const userSkins = await db.getUserSkins(req.session.user.id)
      totalOperations += userSkins.length
      logger.debug(`Lecture BDD ${i+1}/10 - ${userSkins.length} skins`)
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    const memUsage = process.memoryUsage()
    
    logger.warn(`🔥 STRESS TEST TERMINÉ pour ${req.session.user.pseudo}:`)
    logger.warn(`   - Durée: ${duration}s`)
    logger.warn(`   - Skins générés: ${COUNT}`)
    logger.warn(`   - Opérations totales: ${totalOperations.toLocaleString()}`)
    logger.warn(`   - Mémoire heap utilisée: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`)
    logger.warn(`   - Mémoire heap totale: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`)
    logger.warn(`   - Résultat calcul math: ${mathResult.toFixed(6)}`)
    logger.warn(`   - Hashes générés: ${hashes.length}`)
    logger.warn(`   - Taille tableau massif: ${massiveArray.length}`)
    logger.warn(`   - Données aléatoires: ${randomData.length}`)
    logger.warn(`   - Taille string massive: ${massiveString.length} caractères`)
    
    res.json({ 
      success: true, 
      count: COUNT,
      operations: totalOperations,
      duration: duration,
      memory: {
        heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB'
      }
    })
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    logger.error(`Erreur stress test après ${duration}s:`, error)
    res.status(500).json({ error: 'Erreur serveur durant le stress test' })
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
