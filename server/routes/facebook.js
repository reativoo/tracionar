# ==========================================
# ARQUIVO: server/routes/facebook.js
# ==========================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const FacebookAPI = require('../services/FacebookAPI');
const CryptoUtils = require('../utils/crypto');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/facebook/accounts - Listar contas conectadas
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.facebookAccount.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        isActive: true,
        lastSync: true,
        createdAt: true,
        _count: {
          select: { campaigns: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      accounts: accounts.map(account => ({
        ...account,
        campaignCount: account._count.campaigns
      }))
    });

  } catch (error) {
    logger.error('Erro ao listar contas do Facebook:', error);
    res.status(500).json({
      error: 'Erro ao carregar contas',
      code: 'ACCOUNTS_LOAD_ERROR'
    });
  }
});

// GET /api/facebook/auth-url - Gerar URL de autorização OAuth
router.get('/auth-url', (req, res) => {
  try {
    const authUrl = FacebookAPI.generateAuthUrl();
    
    res.json({
      authUrl,
      message: 'Acesse a URL para autorizar a conexão com sua conta do Facebook Ads'
    });

  } catch (error) {
    logger.error('Erro ao gerar URL de autorização:', error);
    res.status(500).json({
      error: 'Erro ao gerar URL de autorização',
      code: 'AUTH_URL_ERROR'
    });
  }
});

// POST /api/facebook/callback - Callback do OAuth
router.post('/callback', [
  body('code').notEmpty().withMessage('Código de autorização é obrigatório'),
  body('state').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { code } = req.body;

    // Trocar código por token de acesso
    const tokenData = await FacebookAPI.exchangeCodeForToken(code);
    
    if (!tokenData.access_token) {
      throw new Error('Token de acesso não recebido');
    }

    // Buscar informações da conta
    const accountInfo = await FacebookAPI.getAccountInfo(tokenData.access_token);
    
    // Criptografar token antes de salvar
    const encryptedToken = CryptoUtils.encrypt(tokenData.access_token);
    
    // Salvar ou atualizar conta no banco
    const account = await prisma.facebookAccount.upsert({
      where: {
        userId_accountId: {
          userId: req.user.id,
          accountId: accountInfo.id
        }
      },
      update: {
        accountName: accountInfo.name,
        accessToken: encryptedToken,
        tokenExpiry: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000) : null,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId: req.user.id,
        accountId: accountInfo.id,
        accountName: accountInfo.name,
        accessToken: encryptedToken,
        tokenExpiry: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000) : null,
        isActive: true
      }
    });

    logger.facebookAPI('Conta do Facebook conectada com sucesso', {
      userId: req.user.id,
      accountId: accountInfo.id,
      accountName: accountInfo.name
    });

    res.json({
      message: 'Conta conectada com sucesso',
      account: {
        id: account.id,
        accountId: account.accountId,
        accountName: account.accountName,
        isActive: account.isActive
      }
    });

  } catch (error) {
    logger.error('Erro no callback do Facebook:', error);
    res.status(500).json({
      error: 'Erro ao conectar conta do Facebook',
      details: error.message,
      code: 'FACEBOOK_CALLBACK_ERROR'
    });
  }
});

// POST /api/facebook/sync/:accountId - Sincronizar dados de uma conta
router.post('/sync/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { syncType = 'incremental' } = req.body; // 'full' ou 'incremental'

    // Verificar se a conta pertence ao usuário
    const account = await prisma.facebookAccount.findFirst({
      where: {
        id: accountId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!account) {
      return res.status(404).json({
        error: 'Conta não encontrada ou inativa',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    // Descriptografar token
    const accessToken = CryptoUtils.decrypt(account.accessToken);

    // Iniciar sincronização em background
    const syncPromise = FacebookAPI.syncAccountData(account, accessToken, syncType);
    
    // Não aguardar a sincronização completa, retornar imediatamente
    res.json({
      message: 'Sincronização iniciada',
      accountId: account.id,
      syncType,
      status: 'in_progress'
    });

    // Log do início da sincronização
    logger.sync('Sincronização iniciada', {
      accountId: account.id,
      accountName: account.accountName,
      syncType,
      userId: req.user.id
    });

    // Processar sincronização em background
    syncPromise.catch(error => {
      logger.error('Erro na sincronização em background:', error);
    });

  } catch (error) {
    logger.error('Erro ao iniciar sincronização:', error);
    res.status(500).json({
      error: 'Erro ao iniciar sincronização',
      code: 'SYNC_START_ERROR'
    });
  }
});

// GET /api/facebook/sync-status/:accountId - Status da sincronização
router.get('/sync-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    // Buscar logs de sincronização mais recentes
    const recentSyncs = await prisma.syncLog.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const account = await prisma.facebookAccount.findFirst({
      where: {
        id: accountId,
        userId: req.user.id
      },
      select: {
        id: true,
        accountName: true,
        lastSync: true,
        isActive: true
      }
    });

    if (!account) {
      return res.status(404).json({
        error: 'Conta não encontrada',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    res.json({
      account,
      recentSyncs,
      lastSync: account.lastSync,
      isActive: account.isActive
    });

  } catch (error) {
    logger.error('Erro ao buscar status de sincronização:', error);
    res.status(500).json({
      error: 'Erro ao buscar status',
      code: 'SYNC_STATUS_ERROR'
    });
  }
});

// DELETE /api/facebook/accounts/:accountId - Desconectar conta
router.delete('/accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await prisma.facebookAccount.findFirst({
      where: {
        id: accountId,
        userId: req.user.id
      }
    });

    if (!account) {
      return res.status(404).json({
        error: 'Conta não encontrada',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    // Desativar conta (soft delete)
    await prisma.facebookAccount.update({
      where: { id: accountId },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });

    logger.facebookAPI('Conta do Facebook desconectada', {
      accountId: account.accountId,
      accountName: account.accountName,
      userId: req.user.id
    });

    res.json({
      message: 'Conta desconectada com sucesso',
      accountId: account.id
    });

  } catch (error) {
    logger.error('Erro ao desconectar conta:', error);
    res.status(500).json({
      error: 'Erro ao desconectar conta',
      code: 'DISCONNECT_ERROR'
    });
  }
});

// GET /api/facebook/campaigns/:accountId - Listar campanhas
router.get('/campaigns/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await prisma.facebookAccount.findFirst({
      where: {
        id: accountId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!account) {
      return res.status(404).json({
        error: 'Conta não encontrada',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { facebookAccountId: accountId },
      include: {
        _count: {
          select: { adSets: true }
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      campaigns: campaigns.map(campaign => ({
        ...campaign,
        adSetCount: campaign._count.adSets,
        latestMetrics: campaign.metrics[0] || null
      }))
    });

  } catch (error) {
    logger.error('Erro ao listar campanhas:', error);
    res.status(500).json({
      error: 'Erro ao carregar campanhas',
      code: 'CAMPAIGNS_LOAD_ERROR'
    });
  }
});

module.exports = router;