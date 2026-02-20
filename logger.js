const winston = require('winston');
const path = require('path');

// Définir le niveau de log basé sur l'environnement
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Configuration des transports
const transports = [
  // Console - toujours actif
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  })
];

// En production, ajouter des fichiers de logs
if (process.env.NODE_ENV === 'production') {
  // Log combiné (tous les logs)
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'combined.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  // Log d'erreurs uniquement
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Créer le logger
const logger = winston.createLogger({
  level: level,
  transports: transports
});

// Créer le dossier logs s'il n'existe pas (en production)
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
}

// Fonction helper pour logger les requêtes HTTP
logger.logRequest = (req, statusCode, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    status: statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('user-agent')
  };
  
  if (req.session?.user) {
    logData.user = req.session.user.pseudo;
  }
  
  const message = `${logData.method} ${logData.url} ${logData.status} - ${logData.responseTime}`;
  
  if (statusCode >= 500) {
    logger.error(message, logData);
  } else if (statusCode >= 400) {
    logger.warn(message, logData);
  } else {
    logger.info(message, logData);
  }
};

// Fonction helper pour logger les événements d'authentification
logger.logAuth = (action, pseudo, success, ip, details = '') => {
  const message = `AUTH ${action.toUpperCase()}: ${pseudo} - ${success ? 'SUCCESS' : 'FAILED'}`;
  const logData = { action, pseudo, success, ip, details };
  
  if (success) {
    logger.info(message, logData);
  } else {
    logger.warn(message, logData);
  }
};

// Fonction helper pour logger les erreurs de base de données
logger.logDbError = (operation, error) => {
  logger.error(`DATABASE ERROR [${operation}]: ${error.message}`, {
    operation,
    error: error.message,
    stack: error.stack
  });
};

module.exports = logger;
