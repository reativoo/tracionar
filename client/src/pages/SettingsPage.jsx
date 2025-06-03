# ==========================================
# ARQUIVO: client/src/pages/SettingsPage.jsx
# ==========================================

import React from 'react'

const SettingsPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configurações</h1>
      <p className="text-gray-        metrics: {
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