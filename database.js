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
    // Table users - ajout des colonnes pour la monnaie
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        pseudo VARCHAR(50) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        blue_essence INTEGER DEFAULT 5000,
        riot_points INTEGER DEFAULT 1350,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ajouter les colonnes de monnaie si elles n'existent pas (pour migration)
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS blue_essence INTEGER DEFAULT 5000,
      ADD COLUMN IF NOT EXISTS riot_points INTEGER DEFAULT 1350
    `).catch(() => {}); // Ignorer l'erreur si les colonnes existent déjà
    
    // Table user_skins - stocke les skins possédés par chaque utilisateur avec rareté
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_skins (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skin_id INTEGER NOT NULL,
        skin_name VARCHAR(200),
        rarity VARCHAR(20) DEFAULT 'kNoRarity',
        date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ajouter les colonnes rarity et skin_name si elles n'existent pas (migration)
    await pool.query(`
      ALTER TABLE user_skins
      ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'kNoRarity',
      ADD COLUMN IF NOT EXISTS skin_name VARCHAR(200)
    `).catch(() => {}); // Ignorer erreur si existe déjà
    
    // Supprimer l'ancien constraint UNIQUE si nécessaire
    await pool.query(`
      ALTER TABLE user_skins
      DROP CONSTRAINT IF EXISTS user_skins_user_id_skin_id_key
    `).catch(() => {});
    
    // Table user_champions - stocke les champions possédés par chaque utilisateur avec leur rareté
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_champions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        champion_id VARCHAR(50) NOT NULL,
        champion_name VARCHAR(100),
        rarity VARCHAR(20) DEFAULT 'COMMON',
        date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, champion_id, date_ajout)
      )
    `);
    
    // Ajouter la colonne rarity si elle n'existe pas (migration)
    await pool.query(`
      ALTER TABLE user_champions
      ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'COMMON',
      ADD COLUMN IF NOT EXISTS champion_name VARCHAR(100)
    `).catch(() => {}); // Ignorer erreur si existe déjà
    
    // Index pour améliorer les performances
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_skins_user_id ON user_skins(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_champions_user_id ON user_champions(user_id)
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
  
  // Ajouter des skins à la collection d'un utilisateur
  addSkinsToUser: async (userId, skins) => {
    try {
      for (const skin of skins) {
        await pool.query(
          'INSERT INTO user_skins (user_id, skin_id, skin_name, rarity) VALUES ($1, $2, $3, $4)',
          [userId, skin.skinId, skin.skinName, skin.rarity]
        );
      }
      return { success: true };
    } catch (error) {
      console.error('Erreur addSkinsToUser:', error);
      return { success: false, error: 'Erreur lors de l\'ajout des skins' };
    }
  },
  
  // Ajouter un skin à la collection d'un utilisateur (fonction unique)
  addSkinToUser: async (userId, skinId) => {
    try {
      await pool.query(
        'INSERT INTO user_skins (user_id, skin_id) VALUES ($1, $2)',
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

  // Obtenir tous les skins d'un utilisateur avec leurs raretés
  getUserSkins: async (userId) => {
    try {
      const result = await pool.query(
        'SELECT skin_id, skin_name, rarity, date_ajout FROM user_skins WHERE user_id = $1 ORDER BY date_ajout DESC',
        [userId]
      );
      return result.rows.map(row => ({
        skinId: row.skin_id,
        skinName: row.skin_name,
        rarity: row.rarity,
        dateAjout: row.date_ajout
      }));
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
  },

  // ===== GESTION DE LA MONNAIE =====
  
  // Obtenir la monnaie d'un utilisateur
  getUserCurrency: async (userId) => {
    try {
      const result = await pool.query(
        'SELECT blue_essence, riot_points FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length > 0) {
        return {
          blueEssence: result.rows[0].blue_essence || 5000,
          riotPoints: result.rows[0].riot_points || 1350
        };
      }
      
      return { blueEssence: 5000, riotPoints: 1350 };
    } catch (error) {
      console.error('Erreur getUserCurrency:', error);
      return { blueEssence: 5000, riotPoints: 1350 };
    }
  },

  // Mettre à jour la monnaie d'un utilisateur
  updateUserCurrency: async (userId, blueEssence, riotPoints) => {
    try {
      await pool.query(
        'UPDATE users SET blue_essence = $1, riot_points = $2 WHERE id = $3',
        [blueEssence, riotPoints, userId]
      );
      return { success: true };
    } catch (error) {
      console.error('Erreur updateUserCurrency:', error);
      return { success: false, error: 'Erreur lors de la mise à jour de la monnaie' };
    }
  },

  // ===== GESTION DES CHAMPIONS =====
  
  // Obtenir tous les champions d'un utilisateur avec leurs raretés
  getUserChampions: async (userId) => {
    try {
      const result = await pool.query(
        'SELECT champion_id, champion_name, rarity, date_ajout FROM user_champions WHERE user_id = $1 ORDER BY date_ajout DESC',
        [userId]
      );
      return result.rows.map(row => ({
        championId: row.champion_id,
        championName: row.champion_name,
        rarity: row.rarity,
        dateAjout: row.date_ajout
      }));
    } catch (error) {
      console.error('Erreur getUserChampions:', error);
      return [];
    }
  },

  // Ajouter des champions à la collection d'un utilisateur avec leur rareté
  addChampionsToUser: async (userId, champions) => {
    try {
      for (const champion of champions) {
        await pool.query(
          'INSERT INTO user_champions (user_id, champion_id, champion_name, rarity) VALUES ($1, $2, $3, $4)',
          [userId, champion.championId, champion.championName, champion.rarity]
        );
      }
      return { success: true };
    } catch (error) {
      console.error('Erreur addChampionsToUser:', error);
      return { success: false, error: 'Erreur lors de l\'ajout des champions' };
    }
  }
};

module.exports = userDB;
module.exports.isDbAvailable = () => dbAvailable;
