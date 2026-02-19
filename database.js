const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuration PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/yboost_dev',
  ssl: process.env.DATABASE_URL ? {
    rejectUnauthorized: false
  } : false
});

// Initialiser la base de données
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        pseudo VARCHAR(50) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Base de données PostgreSQL initialisée');
    console.log('📊 Connecté à:', process.env.DATABASE_URL ? 'PostgreSQL (Scalingo)' : 'PostgreSQL (Local)');
  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error.message);
    process.exit(1);
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
  }
};

module.exports = userDB;
