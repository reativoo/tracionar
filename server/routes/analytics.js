# ==========================================
# ARQUIVO: server/routes/analytics.js
# ==========================================

const express = require('express');
const { query, body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/dashboard - Dashboard principal com KPIs
router.get('/dashboard', [
  query('accountId').optional().isUUID().withMessage('ID da conta inválido'),
  query('period').optional().isIn(['7d', '30d', '90d', 'custom']).withMessage('Período inválido'),
  query('dateStart').optional().isISO8601().withMessage('Data inicial inválida'),
  query('dateEnd').optional().isISO8601().withMessage('Data final inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: errors.array()
      });
    }

    const { accountId, period = '7d', dateStart, dateEnd } = req.query;

    // Definir filtros de data
    let dateFilter = {};
    if (period === 'custom' && dateStart && dateEnd) {
      dateFilter = {
        date: {
          gte: new Date(dateStart),
          lte: new Date(dateEnd)
        }
      };
    } else {
      const daysBack = period === '30d' ? 30 : period === '90d' ? 90 : 7;
      dateFilter = {
        date: {
          gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        }
      };
    }

    // Filtro de conta
    let accountFilter = { userId: req.user.id };
    if (accountId) {
      accountFilter.id = accountId;
    }

    // Buscar contas do usuário
    const accounts = await prisma.facebookAccount.findMany({
      where: accountFilter,
      include: {
        campaigns: {
          include: {
            metrics: {
              where: dateFilter,
              orderBy: { date: 'desc' }
            }
          }
        }
      }
    });

    // Calcular KPIs agregados
    const kpis = await calculateAggregatedKPIs(accounts, dateFilter);

    // Buscar dados para gráficos
    const chartData = await getChartData(accounts, dateFilter);

    // Campanhas com performance crítica
    const criticalCampaigns = await getCriticalCampaigns(accounts);

    res.json({
      kpis,
      chartData,
      criticalCampaigns,
      accounts: accounts.map(acc => ({
        id: acc.id,
        accountId: acc.accountId,
        accountName: acc.accountName,
        campaignCount: acc.campaigns.length
      })),
      period,
      dateRange: {
        start: dateFilter.date?.gte || null,
        end: dateFilter.date?.lte || null
      }
    });

  } catch (error) {
    logger.error('Erro ao carregar dashboard:', error);
    res.status(500).json({
      error: 'Erro ao carregar dashboard',
      code: 'DASHBOARD_ERROR'
    });
  }
});

// POST /api/analytics/campaigns/:campaignId/desired-cpa - Definir CPA desejável
router.post('/campaigns/:campaignId/desired-cpa', [
  body('desiredCPA').isFloat({ min: 0 }).withMessage('CPA deve ser um número positivo')
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
    const { desiredCPA } = req.body;

    // Verificar se a campanha pertence ao usuário
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        facebookAccount: { userId: req.user.id }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campanha não encontrada',
        code: 'CAMPAIGN_NOT_FOUND'
      });
    }

    // Atualizar CPA desejável
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { desiredCPA: parseFloat(desiredCPA) }
    });

    logger.info(`CPA desejável atualizado`, {
      campaignId: campaign.campaignId,
      campaignName: campaign.name,
      desiredCPA,
      userId: req.user.id
    });

    res.json({
      message: 'CPA desejável atualizado com sucesso',
      campaignId: updatedCampaign.id,
      desiredCPA: updatedCampaign.desiredCPA
    });

  } catch (error) {
    logger.error('Erro ao atualizar CPA desejável:', error);
    res.status(500).json({
      error: 'Erro ao atualizar CPA',
      code: 'UPDATE_CPA_ERROR'
    });
  }
});

// Funções auxiliares
async function calculateAggregatedKPIs(accounts, dateFilter) {
  const allMetrics = accounts.flatMap(acc => 
    acc.campaigns.flatMap(camp => camp.metrics)
  );

  if (allMetrics.length === 0) {
    return {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      avgCPA: 0,
      avgROAS: 0,
      avgCTR: 0,
      avgCPC: 0,
      avgCPM: 0
    };
  }

  return {
    totalSpend: allMetrics.reduce((sum, m) => sum + m.spend, 0),
    totalImpressions: allMetrics.reduce((sum, m) => sum + m.impressions, 0),
    totalClicks: allMetrics.reduce((sum, m) => sum + m.clicks, 0),
    totalConversions: allMetrics.reduce((sum, m) => sum + m.conversions, 0),
    avgCPA: calculateWeightedAverage(allMetrics, 'cpa', 'conversions'),
    avgROAS: calculateWeightedAverage(allMetrics, 'roas', 'spend'),
    avgCTR: calculateWeightedAverage(allMetrics, 'ctr', 'impressions'),
    avgCPC: calculateWeightedAverage(allMetrics, 'cpc', 'clicks'),
    avgCPM: calculateWeightedAverage(allMetrics, 'cpm', 'impressions')
  };
}

function calculateWeightedAverage(metrics, field, weightField) {
  const totalWeight = metrics.reduce((sum, m) => sum + m[weightField], 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = metrics.reduce((sum, m) => sum + (m[field] * m[weightField]), 0);
  return weightedSum / totalWeight;
}

async function getChartData(accounts, dateFilter) {
  // Implementar lógica para gerar dados dos gráficos
  return {
    cpaEvolution: [],
    roasByCampaign: []
  };
}

async function getCriticalCampaigns(accounts) {
  // Implementar lógica para identificar campanhas críticas
  return [];
}

module.exports = router;