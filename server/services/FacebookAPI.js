const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class FacebookAPI {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.appId = process.env.FACEBOOK_APP_ID;
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
    this.redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  }

  // Gerar URL de autorização OAuth
  generateAuthUrl() {
    const permissions = [
      'ads_read',
      'ads_management',
      'business_management',
      'read_insights'
    ].join(',');

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: permissions,
      response_type: 'code',
      state: 'tracionar_oauth_' + Date.now()
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  // Trocar código por token de acesso
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.get(`${this.baseURL}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: this.redirectUri,
          code
        }
      });

      logger.facebookAPI('Token de acesso obtido com sucesso');
      return response.data;
    } catch (error) {
      logger.error('Erro ao trocar código por token:', error.response?.data || error.message);
      throw new Error('Falha na autenticação com Facebook');
    }
  }

  // Obter informações da conta
  async getAccountInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me/adaccounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_status,currency,timezone_name,business'
        }
      });

      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('Nenhuma conta de anúncios encontrada');
      }

      // Retornar a primeira conta (ou permitir seleção múltipla no futuro)
      const account = response.data.data[0];
      
      logger.facebookAPI('Informações da conta obtidas', {
        accountId: account.id,
        accountName: account.name
      });

      return {
        id: account.id,
        name: account.name,
        status: account.account_status,
        currency: account.currency,
        timezone: account.timezone_name,
        business: account.business
      };
    } catch (error) {
      logger.error('Erro ao obter informações da conta:', error.response?.data || error.message);
      throw new Error('Falha ao obter informações da conta');
    }
  }

  // Sincronizar dados da conta
  async syncAccountData(account, accessToken, syncType = 'incremental') {
    const startTime = Date.now();
    let recordsSync = 0;

    try {
      logger.sync('Iniciando sincronização', {
        accountId: account.accountId,
        syncType
      });

      // Buscar campanhas
      const campaigns = await this.getCampaigns(account.accountId, accessToken);
      recordsSync += campaigns.length;

      for (const campaign of campaigns) {
        await this.saveCampaign(account.id, campaign);

        // Buscar adsets da campanha
        const adSets = await this.getAdSets(campaign.id, accessToken);
        recordsSync += adSets.length;

        for (const adSet of adSets) {
          await this.saveAdSet(campaign.id, adSet);

          // Buscar anúncios do adset
          const ads = await this.getAds(adSet.id, accessToken);
          recordsSync += ads.length;

          for (const ad of ads) {
            await this.saveAd(adSet.id, ad);
          }
        }
      }

      // Sincronizar métricas
      if (syncType === 'full') {
        await this.syncAllMetrics(account, accessToken);
      } else {
        await this.syncRecentMetrics(account, accessToken);
      }

      // Atualizar timestamp da última sincronização
      await prisma.facebookAccount.update({
        where: { id: account.id },
        data: { lastSync: new Date() }
      });

      // Log de sucesso
      const duration = Date.now() - startTime;
      await this.logSync(account.accountId, syncType, 'success', recordsSync, null, duration);

      logger.sync('Sincronização concluída com sucesso', {
        accountId: account.accountId,
        recordsSync,
        duration: `${duration}ms`
      });

      return { success: true, recordsSync, duration };

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logSync(account.accountId, syncType, 'error', recordsSync, error.message, duration);

      logger.error('Erro na sincronização:', error);
      throw error;
    }
  }

  // Buscar campanhas
  async getCampaigns(accountId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/act_${accountId}/campaigns`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,objective,status,created_time,updated_time,start_time,stop_time',
          limit: 500
        }
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Erro ao buscar campanhas:', error.response?.data || error.message);
      return [];
    }
  }

  // Buscar adsets
  async getAdSets(campaignId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/${campaignId}/adsets`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,targeting,created_time,updated_time,start_time,end_time',
          limit: 500
        }
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Erro ao buscar adsets:', error.response?.data || error.message);
      return [];
    }
  }

  // Buscar anúncios
  async getAds(adSetId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/${adSetId}/ads`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,creative,created_time,updated_time',
          limit: 500
        }
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Erro ao buscar anúncios:', error.response?.data || error.message);
      return [];
    }
  }

  // Buscar métricas (insights)
  async getInsights(objectId, accessToken, datePreset = 'last_7d', level = 'campaign') {
    try {
      const fields = [
        'impressions',
        'reach',
        'clicks',
        'spend',
        'actions',
        'ctr',
        'cpc',
        'cpm',
        'frequency',
        'date_start',
        'date_stop'
      ].join(',');

      const response = await axios.get(`${this.baseURL}/${objectId}/insights`, {
        params: {
          access_token: accessToken,
          fields,
          date_preset: datePreset,
          level,
          time_increment: 1, // Diário
          limit: 1000
        }
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Erro ao buscar insights:', error.response?.data || error.message);
      return [];
    }
  }

  // Salvar campanha no banco
  async saveCampaign(facebookAccountId, campaignData) {
    try {
      return await prisma.campaign.upsert({
        where: {
          facebookAccountId_campaignId: {
            facebookAccountId,
            campaignId: campaignData.id
          }
        },
        update: {
          name: campaignData.name,
          objective: campaignData.objective,
          status: campaignData.status,
          updatedAt: new Date()
        },
        create: {
          facebookAccountId,
          campaignId: campaignData.id,
          name: campaignData.name,
          objective: campaignData.objective,
          status: campaignData.status
        }
      });
    } catch (error) {
      logger.error('Erro ao salvar campanha:', error);
      throw error;
    }
  }

  // Salvar adset no banco
  async saveAdSet(campaignId, adSetData) {
    try {
      return await prisma.adSet.upsert({
        where: {
          campaignId_adSetId: {
            campaignId,
            adSetId: adSetData.id
          }
        },
        update: {
          name: adSetData.name,
          status: adSetData.status,
          targetingType: this.getTargetingType(adSetData.targeting),
          updatedAt: new Date()
        },
        create: {
          campaignId,
          adSetId: adSetData.id,
          name: adSetData.name,
          status: adSetData.status,
          targetingType: this.getTargetingType(adSetData.targeting)
        }
      });
    } catch (error) {
      logger.error('Erro ao salvar adset:', error);
      throw error;
    }
  }

  // Salvar anúncio no banco
  async saveAd(adSetId, adData) {
    try {
      return await prisma.ad.upsert({
        where: {
          adSetId_adId: {
            adSetId,
            adId: adData.id
          }
        },
        update: {
          name: adData.name,
          status: adData.status,
          creative: JSON.stringify(adData.creative || {}),
          updatedAt: new Date()
        },
        create: {
          adSetId,
          adId: adData.id,
          name: adData.name,
          status: adData.status,
          creative: JSON.stringify(adData.creative || {})
        }
      });
    } catch (error) {
      logger.error('Erro ao salvar anúncio:', error);
      throw error;
    }
  }

  // Sincronizar métricas recentes (últimos 7 dias)
  async syncRecentMetrics(account, accessToken) {
    const campaigns = await prisma.campaign.findMany({
      where: { facebookAccountId: account.id }
    });

    for (const campaign of campaigns) {
      const insights = await this.getInsights(campaign.campaignId, accessToken, 'last_7d', 'campaign');
      await this.saveMetrics(insights, 'campaign', campaign.id);
    }
  }

  // Salvar métricas no banco
  async saveMetrics(insights, level, entityId) {
    for (const insight of insights) {
      const metrics = this.parseInsightData(insight);
      const date = new Date(insight.date_start);

      if (level === 'campaign') {
        await prisma.campaignMetrics.upsert({
          where: {
            campaignId_date: {
              campaignId: entityId,
              date
            }
          },
          update: metrics,
          create: {
            campaignId: entityId,
            date,
            ...metrics
          }
        });
      }
      // Adicionar lógica similar para adSets e ads
    }
  }

  // Parse dos dados de insight
  parseInsightData(insight) {
    const conversions = this.getConversions(insight.actions);
    const spend = parseFloat(insight.spend || 0);
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roas = this.getRoas(insight.actions, spend);

    return {
      impressions: parseInt(insight.impressions || 0),
      reach: parseInt(insight.reach || 0),
      clicks: parseInt(insight.clicks || 0),
      spend,
      conversions,
      ctr: parseFloat(insight.ctr || 0),
      cpc: parseFloat(insight.cpc || 0),
      cpm: parseFloat(insight.cpm || 0),
      cpa,
      roas,
      frequency: parseFloat(insight.frequency || 0)
    };
  }

  // Extrair conversões das actions
  getConversions(actions) {
    if (!actions) return 0;
    
    const conversionAction = actions.find(action => 
      action.action_type === 'purchase' || 
      action.action_type === 'lead' ||
      action.action_type === 'complete_registration'
    );
    
    return conversionAction ? parseInt(conversionAction.value) : 0;
  }

  // Calcular ROAS
  getRoas(actions, spend) {
    if (!actions || spend === 0) return 0;
    
    const purchaseAction = actions.find(action => action.action_type === 'purchase');
    if (!purchaseAction) return 0;
    
    const revenue = parseFloat(purchaseAction.value || 0);
    return revenue / spend;
  }

  // Determinar tipo de targeting
  getTargetingType(targeting) {
    if (!targeting) return 'unknown';
    
    if (targeting.custom_audiences && targeting.custom_audiences.length > 0) {
      return 'custom_audience';
    }
    if (targeting.lookalike_audiences && targeting.lookalike_audiences.length > 0) {
      return 'lookalike';
    }
    if (targeting.interests && targeting.interests.length > 0) {
      return 'interests';
    }
    if (targeting.behaviors && targeting.behaviors.length > 0) {
      return 'behaviors';
    }
    
    return 'demographic';
  }

  // Log de sincronização
  async logSync(accountId, syncType, status, recordsSync, errorMessage, duration) {
    try {
      await prisma.syncLog.create({
        data: {
          accountId,
          syncType,
          status,
          recordsSync,
          errorMessage,
          duration
        }
      });
    } catch (error) {
      logger.error('Erro ao salvar log de sync:', error);
    }
  }
}

module.exports = new FacebookAPI();