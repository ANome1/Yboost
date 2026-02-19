const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuration PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/yboost_dev',
  ssl: process.env.DATABASE_URL ? {
    rejectUnauthorized: false
  } : false
});

// Variable pour savoir si la DB est disponible
let dbAvailable = false;

// Initialiser la base de données
async function initDatabase() {
  try {
    // Table users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        pseudo VARCHAR(50) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Table user_skins - stocke les skins possédés par chaque utilisateur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_skins (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skin_id INTEGER NOT NULL,
        date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, skin_id)
      )
    `);
    
    // Index pour améliorer les performances
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_skins_user_id ON user_skins(user_id)
    `);
    
    dbAvailable = true;
    console.log('✅ Base de données PostgreSQL initialisée');
    console.log('📊 Connecté à:', process.env.DATABASE_URL ? 'PostgreSQL (Scalingo)' : 'PostgreSQL (Local)');
  } catch (error) {
    console.error('⚠️  Base de données non disponible:', error.message);
    console.log('⚠️  Mode sans authentification - Les fonctionnalités utilisateur sont désactivées');
    dbAvailable = false;
    // Ne pas quitter le processus en mode dev sans DATABASE_URL
    if (process.env.DATABASE_URL) {
      console.error('❌ Erreur critique en production');
      process.exit(1);
    }
  }
}

// Initialiser au démarrage
initDatabase();

// Fonctions pour gérer les utilisateurs
const userDB = {
  // Créer un utilisateur
  createUser: async (pseudo, motDePasse) => {
    try {
      const hashedPassword = bcrypt.hashSync(motDePasse, 10);
      const result = await pool.query(
        'INSERT INTO users (pseudo, mot_de_passe) VALUES ($1, $2) RETURNING id',
        [pseudo, hashedPassword]
      );
      return { success: true, userId: result.rows[0].id };
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'Ce pseudo existe déjà' };
      }
      console.error('Erreur createUser:', error);
      return { success: false, error: 'Erreur lors de la création du compte' };
    }
  },

  // Vérifier les identifiants
  verifyUser: async (pseudo, motDePasse) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE pseudo = $1', [pseudo]);
      const user = result.rows[0];
      
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
    } catch (error) {
      console.error('Erreur verifyUser:', error);
      return { success: false, error: 'Erreur lors de la vérification' };
    }
  },

  // Obtenir un utilisateur par ID
  getUserById: async (id) => {
    try {
      const result = await pool.query(
        'SELECT id, pseudo, date_creation FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur getUserById:', error);
      return null;
    }
  },

  // Obtenir tous les utilisateurs (pour admin)
  getAllUsers: async () => {
    try {
      const result = await pool.query('SELECT id, pseudo, date_creation FROM users ORDER BY date_creation DESC');
      return result.rows;
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      return [];
    }
  },

  // ===== GESTION DES SKINS =====
  
  // Ajouter un skin à la collection d'un utilisateur
  addSkinToUser: async (userId, skinId) => {
    try {
      await pool.query(
        'INSERT INTO user_skins (user_id, skin_id) VALUES ($1, $2) ON CONFLICT (user_id, skin_id) DO NOTHING',
        [userId, skinId]
      );
      return { success: true };
    } catch (error) {
      console.error('Erreur addSkinToUser:', error);
      return { success: false, error: 'Erreur lors de l\'ajout du skin' };
    }
  },

  // Retirer un skin de la collection d'un utilisateur
  removeSkinFromUser: async (userId, skinId) => {
    try {
      await pool.query(
        'DELETE FROM user_skins WHERE user_id = $1 AND skin_id = $2',
        [userId, skinId]
      );
      return { success: true };
    } catch (error) {
      console.error('Erreur removeSkinFromUser:', error);
      return { success: false, error: 'Erreur lors de la suppression du skin' };
    }
  },

  // Obtenir tous les skins d'un utilisateur
  getUserSkins: async (userId) => {
    try {
      const result = await pool.query(
        'SELECT skin_id, date_ajout FROM user_skins WHERE user_id = $1 ORDER BY date_ajout DESC',
        [userId]
      );
      return result.rows.map(row => row.skin_id);
    } catch (error) {
      console.error('Erreur getUserSkins:', error);
      return [];
    }
  },

  // Vérifier si un utilisateur possède un skin
  userHasSkin: async (userId, skinId) => {
    try {
      const result = await pool.query(
        'SELECT 1 FROM user_skins WHERE user_id = $1 AND skin_id = $2',
        [userId, skinId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erreur userHasSkin:', error);
      return false;
    }
  }
};

module.exports = userDB;
module.exports.isDbAvailable = () => dbAvailable;
