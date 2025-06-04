const express = require('express');
const { body, validationResult } = require('express-validator');
const openaiService = require('../services/openaiService');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/insights/generate - Gerar insights automáticos
router.post('/generate', [
  body('metricsData').isObject().withMessage('Dados de métricas são obrigatórios'),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { metricsData, context = {} } = req.body;

    // Verificar se OpenAI está configurada
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'Serviço de IA não configurado',
        code: 'OPENAI_NOT_CONFIGURED'
      });
    }

    const insights = await openaiService.generateInsights(metricsData, context);

    res.json({
      insights,
      status: 'success',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao gerar insights:', error);
    res.status(500).json({
      error: 'Erro ao gerar insights',
      code: 'INSIGHTS_GENERATION_ERROR'
    });
  }
});

// POST /api/insights/analyze-campaign - Analisar campanha específica
router.post('/analyze-campaign', [
  body('campaignData').isObject().withMessage('Dados da campanha são obrigatórios')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { campaignData } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'Serviço de IA não configurado',
        code: 'OPENAI_NOT_CONFIGURED'
      });
    }

    const analysis = await openaiService.analyzeCampaignPerformance(campaignData);

    res.json({
      analysis,
      status: 'success'
    });

  } catch (error) {
    logger.error('Erro ao analisar campanha:', error);
    res.status(500).json({
      error: 'Erro ao analisar campanha',
      code: 'CAMPAIGN_ANALYSIS_ERROR'
    });
  }
});

// GET /api/insights/alerts - Obter alertas inteligentes
router.get('/alerts', async (req, res) => {
  try {
    // Aqui você buscaria os dados reais das campanhas
    // Por enquanto, vamos usar dados mock
    const mockCampaignsData = [
      {
        id: '1',
        name: 'Campanha Vendas Q4',
        cpa: 75.50,
        targetCPA: 60.00,
        roas: 3.2,
        ctr: 2.1,
        spend: 5000,
        conversions: 66
      },
      {
        id: '2',
        name: 'Leads Qualificados',
        cpa: 45.00,
        targetCPA: 50.00,
        roas: 1.8, // Baixo
        ctr: 0.8, // Baixo
        spend: 3000,
        conversions: 67
      },
      {
        id: '3',
        name: 'Remarketing Premium',
        cpa: 35.00,
        targetCPA: 45.00,
        roas: 6.5, // Excelente
        ctr: 3.2,
        spend: 2000,
        conversions: 57
      }
    ];

    if (!process.env.OPENAI_API_KEY) {
      // Retornar alertas estáticos se IA não configurada
      return res.json({
        alerts: [
          {
            type: 'info',
            severity: 'medium',
            title: 'IA não configurada',
            message: 'Configure a API do OpenAI para receber alertas inteligentes',
            recommendation: 'Adicione sua OPENAI_API_KEY no arquivo .env'
          }
        ],
        generatedAt: new Date().toISOString()
      });
    }

    const alerts = await openaiService.generateAlerts(mockCampaignsData);

    res.json({
      alerts,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao gerar alertas:', error);
    res.status(500).json({
      error: 'Erro ao gerar alertas',
      code: 'ALERTS_GENERATION_ERROR'
    });
  }
});

// GET /api/insights/history - Histórico de insights
router.get('/history', async (req, res) => {
  try {
    const { limit = 10, type } = req.query;

    const whereClause = type ? { type } : {};

    const insights = await prisma.aiInsight.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        type: true,
        content: true,
        confidence: true,
        actionable: true,
        createdAt: true
      }
    });

    res.json({
      insights,
      total: insights.length
    });

  } catch (error) {
    logger.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      error: 'Erro ao buscar histórico',
      code: 'HISTORY_ERROR'
    });
  }
});

// POST /api/insights/feedback - Feedback sobre insights
router.post('/feedback', [
  body('insightId').isUUID().withMessage('ID do insight inválido'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating deve ser entre 1 e 5'),
  body('comment').optional().isString().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { insightId, rating, comment } = req.body;

    // Salvar feedback (aqui você implementaria a lógica real)
    logger.info('Feedback recebido para insight', {
      insightId,
      rating,
      comment,
      userId: req.user?.id
    });

    res.json({
      message: 'Feedback registrado com sucesso',
      insightId,
      rating
    });

  } catch (error) {
    logger.error('Erro ao registrar feedback:', error);
    res.status(500).json({
      error: 'Erro ao registrar feedback',
      code: 'FEEDBACK_ERROR'
    });
  }
});

module.exports = router;