var express = require('express')
var path = require('path')
var app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers statiques
app.use(express.static(__dirname))
app.use('/src', express.static(path.join(__dirname, 'src')))

// Routes pour les pages
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// Routes API pour les données
app.get('/api/champions', function (req, res) {
  res.sendFile(path.join(__dirname, 'src/data/champion.json'))
})

app.get('/api/skins', function (req, res) {
  res.sendFile(path.join(__dirname, 'src/data/skins.json'))
})

var server = app.listen(process.env.PORT || 3000, function () {
  var port = process.env.PORT || 3000
  console.log('✅ Yboost server listening on port', port)
})