const express = require('express');
const { query, validationResult, body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/dashboard - Dashboard principal com KPIs
router.get('/dashboard', [
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Período inválido'),
  query('accountId').optional().isUUID().withMessage('ID da conta inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
    }

    const { period = '7d', accountId } = req.query;

    // Para desenvolvimento, vamos retornar dados mock realistas
    // Depois você pode substituir por dados reais do Facebook
    const mockData = generateMockDashboardData(period, accountId);

    res.json(mockData);

  } catch (error) {
    logger.error('Erro ao carregar dashboard:', error);
    res.status(500).json({
      error: 'Erro ao carregar dashboard',
      code: 'DASHBOARD_ERROR'
    });
  }
});

// Função para gerar dados mock realistas
function generateMockDashboardData(period, accountId) {
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
  
  // KPIs principais
  const kpis = {
    totalSpend: Math.random() * 10000 + 5000, // R$ 5k-15k
    totalImpressions: Math.floor(Math.random() * 500000 + 100000), // 100k-600k
    totalClicks: Math.floor(Math.random() * 15000 + 3000), // 3k-18k
    totalConversions: Math.floor(Math.random() * 500 + 100), // 100-600
    avgCPA: Math.random() * 80 + 20, // R$ 20-100
    avgROAS: Math.random() * 6 + 1, // 1x-7x
    avgCTR: Math.random() * 4 + 0.5, // 0.5%-4.5%
    avgCPC: Math.random() * 3 + 0.5, // R$ 0.5-3.5
    avgCPM: Math.random() * 40 + 10 // R$ 10-50
  };

  // Dados para gráfico de evolução do CPA
  const cpaEvolution = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    cpaEvolution.push({
      date: date.toISOString().split('T')[0],
      cpa: Math.random() * 60 + 25 + Math.sin(i * 0.1) * 10 // Variação mais realista
    });
  }

  // Dados para gráfico ROAS por campanha
  const campaignNames = [
    'Campanha Vendas Q4',
    'Promoção Black Friday',
    'Leads Qualificados',
    'Remarketing Carrinho',
    'Conquista Novos Clientes',
    'Awareness Marca'
  ];

  const roasByCampaign = campaignNames.map(name => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    roas: Math.random() * 8 + 0.5,
    spend: Math.random() * 5000 + 500,
    conversions: Math.floor(Math.random() * 200 + 10)
  }));

  // Campanhas críticas (CPA alto ou ROAS baixo)
  const criticalCampaigns = [];
  roasByCampaign.forEach((campaign, index) => {
    const cpa = campaign.spend / campaign.conversions;
    
    if (cpa > 70 || campaign.roas < 2) {
      criticalCampaigns.push({
        id: index + 1,
        name: campaignNames[index],
        cpa: cpa,
        roas: campaign.roas,
        issue: cpa > 70 ? 'CPA muito alto' : 'ROAS baixo'
      });
    }
  });

  // Contas disponíveis (mock)
  const accounts = [
    { id: '1', accountName: 'Conta Principal - Vendas' },
    { id: '2', accountName: 'Conta Secundária - Leads' },
    { id: '3', accountName: 'Conta Regional - SP' }
  ];

  return {
    kpis,
    chartData: {
      cpaEvolution,
      roasByCampaign
    },
    criticalCampaigns,
    accounts,
    period,
    generatedAt: new Date().toISOString()
  };
}

// GET /api/analytics/campaign-details/:campaignId - Detalhes de uma campanha
router.get('/campaign-details/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    // Mock de dados detalhados de campanha
    const campaignDetails = {
      id: campaignId,
      name: 'Campanha Vendas Q4',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      budget: {
        daily: 500,
        total: 15000,
        spent: 8750
      },
      performance: {
        impressions: 125000,
        clicks: 3400,
        conversions: 145,
        spend: 8750,
        ctr: 2.72,
        cpc: 2.57,
        cpa: 60.34,
        roas: 4.2
      },
      demographics: {
        ageGroups: [
          { age: '18-24', percentage: 15, conversions: 22 },
          { age: '25-34', percentage: 35, conversions: 51 },
          { age: '35-44', percentage: 30, conversions: 44 },
          { age: '45-54', percentage: 15, conversions: 22 },
          { age: '55+', percentage: 5, conversions: 6 }
        ],
        gender: [
          { gender: 'Masculino', percentage: 45, conversions: 65 },
          { gender: 'Feminino', percentage: 55, conversions: 80 }
        ]
      },
      placements: [
        { placement: 'Facebook Feed', impressions: 65000, conversions: 87 },
        { placement: 'Instagram Stories', impressions: 35000, conversions: 35 },
        { placement: 'Instagram Feed', impressions: 25000, conversions: 23 }
      ]
    };

    res.json(campaignDetails);

  } catch (error) {
    logger.error('Erro ao carregar detalhes da campanha:', error);
    res.status(500).json({
      error: 'Erro ao carregar campanha',
      code: 'CAMPAIGN_DETAILS_ERROR'
    });
  }
});

// POST /api/analytics/campaigns/:campaignId/target-cpa - Definir CPA desejável
router.post('/campaigns/:campaignId/target-cpa', [
  body('targetCPA').isFloat({ min: 0 }).withMessage('CPA deve ser um número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'CPA inválido',
        details: errors.array()
      });
    }

    const { campaignId } = req.params;
    const { targetCPA } = req.body;

    // Aqui você salvaria no banco de dados real
    // Por enquanto, vamos simular a resposta
    
    logger.info(`CPA desejável atualizado`, {
      campaignId,
      targetCPA,
      userId: req.user?.id
    });

    res.json({
      message: 'CPA desejável atualizado com sucesso',
      campaignId,
      targetCPA: parseFloat(targetCPA)
    });

  } catch (error) {
    logger.error('Erro ao atualizar CPA desejável:', error);
    res.status(500).json({
      error: 'Erro ao atualizar CPA',
      code: 'UPDATE_CPA_ERROR'
    });
  }
});

// GET /api/analytics/performance-summary - Resumo de performance
router.get('/performance-summary', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const summary = {
      totalAccounts: 3,
      activeCampaigns: 12,
      pausedCampaigns: 4,
      totalBudget: 45000,
      spentBudget: 28500,
      conversionRate: 4.26,
      averageOrderValue: 180.50,
      topPerformingCampaign: {
        name: 'Campanha Vendas Q4',
        roas: 6.2,
        conversions: 145
      },
      alerts: [
        {
          type: 'warning',
          message: '2 campanhas com CPA acima do desejável',
          campaignIds: ['1', '3']
        },
        {
          type: 'success',
          message: 'Meta de ROAS atingida em 8 campanhas',
          count: 8
        }
      ]
    };

    res.json(summary);

  } catch (error) {
    logger.error('Erro ao carregar resumo:', error);
    res.status(500).json({
      error: 'Erro ao carregar resumo',
      code: 'SUMMARY_ERROR'
    });
  }
});

module.exports = router;