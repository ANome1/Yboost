const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Créer ou ouvrir la base de données
const db = new Database(path.join(__dirname, 'yboost.db'));

// Créer la table users si elle n'existe pas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Fonctions pour gérer les utilisateurs
const userDB = {
  // Créer un utilisateur
  createUser: (pseudo, motDePasse) => {
    try {
      const hashedPassword = bcrypt.hashSync(motDePasse, 10);
      const stmt = db.prepare('INSERT INTO users (pseudo, mot_de_passe) VALUES (?, ?)');
      const result = stmt.run(pseudo, hashedPassword);
      return { success: true, userId: result.lastInsertRowid };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { success: false, error: 'Ce pseudo existe déjà' };
      }
      return { success: false, error: 'Erreur lors de la création du compte' };
    }
  },

  // Vérifier les identifiants
  verifyUser: (pseudo, motDePasse) => {
    const stmt = db.prepare('SELECT * FROM users WHERE pseudo = ?');
    const user = stmt.get(pseudo);
    
    if (!user) {
      return { success: false, error: 'Pseudo ou mot de passe incorrect' };
    }
    
    const isValid = bcrypt.compareSync(motDePasse, user.mot_de_passe);
    
    if (isValid) {
      return { 
        success: true, 
        user: { 
          id: user.id, 
          pseudo: user.pseudo,
          date_creation: user.date_creation
        } 
      };
    } else {
      return { success: false, error: 'Pseudo ou mot de passe incorrect' };
    }
  },

  // Obtenir un utilisateur par ID
  getUserById: (id) => {
    const stmt = db.prepare('SELECT id, pseudo, date_creation FROM users WHERE id = ?');
    return stmt.get(id);
  },

  // Obtenir tous les utilisateurs (pour admin)
  getAllUsers: () => {
    const stmt = db.prepare('SELECT id, pseudo, date_creation FROM users');
    return stmt.all();
  }
};

module.exports = userDB;
