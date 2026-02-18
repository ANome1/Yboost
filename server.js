var express = require('express')
var path = require('path')
var app = express()

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

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address
  var port = server.address().port
})