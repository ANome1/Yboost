var express = require('express')
var path = require('path')
var session = require('express-session')
var userDB = require('./database')
var app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configuration des sessions
app.use(session({
  secret: 'yboost-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // mettre à true en production avec HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}))

// Servir les fichiers statiques
app.use(express.static(__dirname))
app.use('/src', express.static(path.join(__dirname, 'src')))

// Route pour la page principale
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// Route pour l'API des champions
app.get('/api/champions', function (req, res) {
  res.sendFile(path.join(__dirname, 'champion.json'))
})

// Routes d'authentification
app.post('/api/register', function (req, res) {
  const { pseudo, motDePasse } = req.body
  
  if (!pseudo || !motDePasse) {
    return res.status(400).json({ success: false, error: 'Pseudo et mot de passe requis' })
  }
  
  if (pseudo.length < 3) {
    return res.status(400).json({ success: false, error: 'Le pseudo doit contenir au moins 3 caractères' })
  }
  
  if (motDePasse.length < 6) {
    return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' })
  }
  
  const result = userDB.createUser(pseudo, motDePasse)
  
  if (result.success) {
    req.session.userId = result.userId
    req.session.pseudo = pseudo
    res.json({ success: true, pseudo: pseudo })
  } else {
    res.status(400).json(result)
  }
})

app.post('/api/login', function (req, res) {
  const { pseudo, motDePasse } = req.body
  
  if (!pseudo || !motDePasse) {
    return res.status(400).json({ success: false, error: 'Pseudo et mot de passe requis' })
  }
  
  const result = userDB.verifyUser(pseudo, motDePasse)
  
  if (result.success) {
    req.session.userId = result.user.id
    req.session.pseudo = result.user.pseudo
    res.json({ success: true, pseudo: result.user.pseudo })
  } else {
    res.status(401).json(result)
  }
})

app.post('/api/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la déconnexion' })
    }
    res.json({ success: true })
  })
})

app.get('/api/session', function (req, res) {
  if (req.session.userId) {
    res.json({ 
      authenticated: true, 
      pseudo: req.session.pseudo,
      userId: req.session.userId 
    })
  } else {
    res.json({ authenticated: false })
  }
})

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Yboost server listening on port', port)
})