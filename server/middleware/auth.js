const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    // Verificação do JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário ainda existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Adicionar informações do usuário à requisição
    req.user = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    };

    next();
  } catch (error) {
    logger.error('Erro na autenticação:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      });
    }

    return res.status(500).json({
      error: 'Erro interno de autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware para verificar se é o primeiro acesso (setup inicial)
const checkFirstSetup = async (req, res, next) => {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      req.isFirstSetup = true;
    } else {
      req.isFirstSetup = false;
    }
    
    next();
  } catch (error) {
    logger.error('Erro ao verificar primeiro setup:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'SETUP_CHECK_ERROR'
    });
  }
};

// Middleware para rate limiting específico de login
const loginRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Só aplicar rate limit para tentativas falhadas
  skipSuccessfulRequests: true
});

module.exports = {
  authenticateToken,
  checkFirstSetup,
  loginRateLimit
};