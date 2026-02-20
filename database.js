const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuration PostgreSQL
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      // Configuration locale (utilise le socket Unix /var/run/postgresql)
      database: process.env.DB_NAME || 'ybooster',
      user: process.env.DB_USER || process.env.USER,
      port: parseInt(process.env.DB_PORT || '5432'),
      // Ajout du password seulement s'il est défini
      ...(process.env.DB_PASSWORD && { password: process.env.DB_PASSWORD }),
      // Ne pas spécifier 'host' pour utiliser le socket Unix local (peer auth)
    };

const pool = new Pool(poolConfig);

// Variable pour savoir si la DB est disponible
let dbAvailable = false;

// Initialiser la base de données
async function initDatabase() {
  try {
    // Tester la connexion d'abord
    await pool.query('SELECT NOW()');
    
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
        skin_name VARCHAR(200),
        rarity VARCHAR(20) DEFAULT 'kNoRarity',
        date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Index pour améliorer les performances
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_skins_user_id ON user_skins(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_skins_skin_id ON user_skins(user_id, skin_id)
    `);
    
    dbAvailable = true;
    console.log('✅ Base de données PostgreSQL initialisée');
  } catch (error) {
    console.error('❌ Base de données PostgreSQL non disponible:', error.message);
    console.log('⚠️  L\'application fonctionnera en mode dégradé (localStorage uniquement)');
    console.log('💡 Pour activer la BDD:');
    console.log('   1. Installez PostgreSQL: sudo apt-get install postgresql');
    console.log('   2. Créez la base de données: sudo -u postgres createdb yboost');
    console.log('   3. Configurez DATABASE_URL dans .env (optionnel)');
    dbAvailable = false;
  }
}

// Tester la connexion
async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    dbAvailable = true;
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    dbAvailable = false;
    return false;
  }
}

// Créer un utilisateur
async function createUser(pseudo, motDePasse) {
  if (!dbAvailable) {
    return { success: false, error: 'Base de données non disponible' };
  }
  
  try {
    // Vérifier si le pseudo existe déjà
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE pseudo = $1',
      [pseudo]
    );
    
    if (checkResult.rows.length > 0) {
      return { success: false, error: 'Ce pseudo est déjà utilisé' };
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    
    // Créer l'utilisateur
    const result = await pool.query(
      'INSERT INTO users (pseudo, mot_de_passe) VALUES ($1, $2) RETURNING id',
      [pseudo, hashedPassword]
    );
    
    return { success: true, userId: result.rows[0].id };
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return { success: false, error: 'Erreur lors de la création du compte' };
  }
}

// Vérifier les identifiants
async function verifyUser(pseudo, motDePasse) {
  if (!dbAvailable) {
    return { success: false, error: 'Base de données non disponible' };
  }
  
  try {
    const result = await pool.query(
      'SELECT id, pseudo, mot_de_passe FROM users WHERE pseudo = $1',
      [pseudo]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Pseudo ou mot de passe incorrect' };
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(motDePasse, user.mot_de_passe);
    
    if (!isValid) {
      return { success: false, error: 'Pseudo ou mot de passe incorrect' };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        pseudo: user.pseudo
      }
    };
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return { success: false, error: 'Erreur lors de la connexion' };
  }
}

// Obtenir les skins d'un utilisateur
async function getUserSkins(userId) {
  if (!dbAvailable) {
    return [];
  }
  
  try {
    const result = await pool.query(
      'SELECT skin_id, skin_name, rarity, date_ajout FROM user_skins WHERE user_id = $1 ORDER BY date_ajout DESC',
      [userId]
    );
    
    return result.rows.map(row => ({
      skinId: row.skin_id,
      skinName: row.skin_name,
      rarity: row.rarity,
      dateObtained: row.date_ajout
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des skins:', error);
    return [];
  }
}

// Ajouter plusieurs skins à un utilisateur
async function addSkinsToUser(userId, skins) {
  if (!dbAvailable) {
    return { success: false, error: 'Base de données non disponible' };
  }
  
  try {
    // Insérer tous les skins
    for (const skin of skins) {
      await pool.query(
        'INSERT INTO user_skins (user_id, skin_id, skin_name, rarity) VALUES ($1, $2, $3, $4)',
        [userId, skin.skinId, skin.skinName, skin.rarity]
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'ajout des skins:', error);
    return { success: false, error: 'Erreur lors de l\'ajout des skins' };
  }
}

// Exporter les fonctions
module.exports = {
  initDatabase,
  testConnection,
  createUser,
  verifyUser,
  getUserSkins,
  addSkinsToUser,
  isAvailable: () => dbAvailable
};
