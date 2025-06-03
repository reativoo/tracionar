# ==========================================
# ARQUIVO: server/routes/auth.js
# ==========================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { checkFirstSetup, loginRateLimit } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Validações
const loginValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Usuário deve ter entre 3 e 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Usuário deve conter apenas letras, números e underscore'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
];

const setupValidation = [
  ...loginValidation,
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    })
];

// POST /api/auth/setup - Configuração inicial (primeiro usuário)
router.post('/setup', checkFirstSetup, setupValidation, async (req, res) => {
  try {
    // Verificar se ainda é o primeiro setup
    if (!req.isFirstSetup) {
      return res.status(403).json({
        error: 'Sistema já foi configurado',
        code: 'ALREADY_SETUP'
      });
    }

    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { username, password } = req.body;

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário inicial
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
        preferences: {
          create: {
            defaultCPA: 50.0, // Valor padrão inicial
            notifications: true
          }
        }
      },
      select: {
        id: true,
        username: true,
        createdAt: true
      }
    });

    // Gerar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      }
    );

    logger.info(`✅ Setup inicial concluído - Usuário criado: ${username}`);

    res.status(201).json({
      message: 'Setup inicial concluído com sucesso',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    logger.error('Erro no setup inicial:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Usuário já existe',
        code: 'USERNAME_TAKEN'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'SETUP_ERROR'
    });
  }
});

// POST /api/auth/login - Login do usuário
router.post('/login', loginRateLimit, loginValidation, async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { username, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        password: true,
        createdAt: true
      }
    });

    if (!user) {
      logger.warn(`Tentativa de login com usuário inexistente: ${username} - IP: ${req.ip}`);
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn(`Tentativa de login com senha incorreta: ${username} - IP: ${req.ip}`);
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Gerar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      }
    );

    logger.info(`✅ Login bem-sucedido: ${username} - IP: ${req.ip}`);

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'LOGIN_ERROR'
    });
  }
});

// GET /api/auth/status - Verificar status de autenticação
router.get('/status', checkFirstSetup, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.json({
        isAuthenticated: false,
        isFirstSetup: req.isFirstSetup,
        user: null
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.json({
          isAuthenticated: false,
          isFirstSetup: req.isFirstSetup,
          user: null
        });
      }

      res.json({
        isAuthenticated: true,
        isFirstSetup: req.isFirstSetup,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt
        }
      });

    } catch (jwtError) {
      res.json({
        isAuthenticated: false,
        isFirstSetup: req.isFirstSetup,
        user: null
      });
    }

  } catch (error) {
    logger.error('Erro ao verificar status de auth:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'STATUS_ERROR'
    });
  }
});

// GET /api/auth/check-setup - Verificar se precisa fazer setup
router.get('/check-setup', checkFirstSetup, (req, res) => {
  res.json({
    needsSetup: req.isFirstSetup,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;