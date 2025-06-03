# ==========================================
# ARQUIVO: server/utils/logger.js
# ==========================================

const winston = require('winston');
const path = require('path');

// Definir níveis customizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Definir cores para cada nível
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Formato customizado para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Transportes (onde os logs serão salvos/exibidos)
const transports = [
  // Console para desenvolvimento
  new winston.transports.Console(),
  
  // Arquivo para todos os logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/all.log'),
    level: 'debug'
  }),
  
  // Arquivo específico para erros
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error'
  }),
  
  // Arquivo para logs da API do Facebook
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/facebook-api.log'),
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  
  // Não sair do processo em caso de erro
  exitOnError: false
});

// Em produção, não logar no console
if (process.env.NODE_ENV === 'production') {
  logger.remove(winston.transports.Console);
}

// Criar diretório de logs se não existir
const fs = require('fs');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Função especializada para logs da API do Facebook
logger.facebookAPI = (message, data = {}) => {
  logger.info(message, { 
    type: 'facebook_api',
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Função para logs de sincronização
logger.sync = (message, data = {}) => {
  logger.info(message, {
    type: 'sync',
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Função para logs de insights da IA
logger.aiInsight = (message, data = {}) => {
  logger.info(message, {
    type: 'ai_insight',
    ...data,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;