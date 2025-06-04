const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.cache = new Map(); // Cache em memória para economizar
  }

  // Gerar insights automáticos das métricas
  async generateInsights(metricsData, campaignContext = {}) {
    try {
      const cacheKey = this.getCacheKey('insights', metricsData, campaignContext);
      
      // Verificar cache (válido por 1 hora)
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 3600000) {
          logger.info('Retornando insights do cache');
          return cached.data;
        }
      }

      const prompt = this.buildInsightsPrompt(metricsData, campaignContext);
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em Facebook Ads com 10+ anos de experiência. Analise métricas e forneça insights práticos e acionáveis em português brasileiro.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const insights = this.parseInsightsResponse(completion.choices[0].message.content);
      
      // Salvar no cache
      this.cache.set(cacheKey, {
        data: insights,
        timestamp: Date.now()
      });

      // Salvar no banco para histórico
      await this.saveInsightsToDatabase(insights, metricsData);

      logger.info('Insights gerados pela IA com sucesso');
      return insights;

    } catch (error) {
      logger.error('Erro ao gerar insights:', error);
      throw new Error('Falha ao gerar insights da IA');
    }
  }

  // Analisar performance de campanha específica
  async analyzeCampaignPerformance(campaignData) {
    try {
      const prompt = `
Analise esta campanha do Facebook Ads e forneça recomendações específicas:

**Dados da Campanha:**
- Nome: ${campaignData.name}
- Objetivo: ${campaignData.objective}
- CPA Atual: R$ ${campaignData.cpa?.toFixed(2)}
- CPA Desejável: R$ ${campaignData.targetCPA?.toFixed(2) || 'Não definido'}
- ROAS: ${campaignData.roas?.toFixed(2)}x
- CTR: ${campaignData.ctr?.toFixed(2)}%
- CPC: R$ ${campaignData.cpc?.toFixed(2)}
- Gasto: R$ ${campaignData.spend?.toFixed(2)}
- Conversões: ${campaignData.conversions}

Forneça sua análise seguindo esta estrutura:
1. **Diagnóstico**: Identificar os principais problemas
2. **Oportunidades**: Pontos positivos a explorar
3. **Recomendações**: 3-5 ações específicas e práticas
4. **Prioridade**: Qual ação implementar primeiro
5. **Expectativa**: Impacto esperado das melhorias

Seja específico e prático. Foque em ações que podem ser implementadas imediatamente.
      `;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor especialista em Facebook Ads. Sua análise deve ser direta, prática e focada em resultados.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.6,
      });

      return {
        campaignId: campaignData.id,
        analysis: completion.choices[0].message.content,
        generatedAt: new Date().toISOString(),
        type: 'campaign_analysis'
      };

    } catch (error) {
      logger.error('Erro ao analisar campanha:', error);
      throw new Error('Falha ao analisar campanha');
    }
  }

  // Gerar alertas inteligentes
  async generateAlerts(allCampaignsData) {
    try {
      const alerts = [];

      for (const campaign of allCampaignsData) {
        // Alert para CPA alto
        if (campaign.targetCPA && campaign.cpa > campaign.targetCPA * 1.2) {
          alerts.push({
            type: 'warning',
            severity: 'high',
            campaignId: campaign.id,
            campaignName: campaign.name,
            title: 'CPA acima do desejável',
            message: `CPA atual (R$ ${campaign.cpa.toFixed(2)}) está 20% acima da meta (R$ ${campaign.targetCPA.toFixed(2)})`,
            recommendation: await this.getQuickRecommendation('high_cpa', campaign),
            createdAt: new Date().toISOString()
          });
        }

        // Alert para ROAS baixo
        if (campaign.roas < 2.0) {
          alerts.push({
            type: 'error',
            severity: 'critical',
            campaignId: campaign.id,
            campaignName: campaign.name,
            title: 'ROAS crítico',
            message: `ROAS de ${campaign.roas.toFixed(2)}x está abaixo do mínimo recomendado (2.0x)`,
            recommendation: await this.getQuickRecommendation('low_roas', campaign),
            createdAt: new Date().toISOString()
          });
        }

        // Alert para CTR baixo
        if (campaign.ctr < 1.0) {
          alerts.push({
            type: 'info',
            severity: 'medium',
            campaignId: campaign.id,
            campaignName: campaign.name,
            title: 'CTR baixo',
            message: `CTR de ${campaign.ctr.toFixed(2)}% pode ser melhorado`,
            recommendation: await this.getQuickRecommendation('low_ctr', campaign),
            createdAt: new Date().toISOString()
          });
        }

        // Alert para performance excelente
        if (campaign.roas > 5.0 && campaign.targetCPA && campaign.cpa < campaign.targetCPA * 0.8) {
          alerts.push({
            type: 'success',
            severity: 'low',
            campaignId: campaign.id,
            campaignName: campaign.name,
            title: 'Performance excelente!',
            message: `ROAS de ${campaign.roas.toFixed(2)}x e CPA abaixo da meta`,
            recommendation: 'Considere aumentar o orçamento para escalar esta campanha',
            createdAt: new Date().toISOString()
          });
        }
      }

      return alerts;

    } catch (error) {
      logger.error('Erro ao gerar alertas:', error);
      return [];
    }
  }

  // Recomendações rápidas baseadas em problemas específicos
  async getQuickRecommendation(problemType, campaignData) {
    const recommendations = {
      high_cpa: [
        'Revisar segmentação de público',
        'Testar novos criativos',
        'Ajustar lances automáticos',
        'Excluir públicos com baixa performance'
      ],
      low_roas: [
        'Verificar pixel de conversão',
        'Otimizar landing page',
        'Revisar funil de vendas',
        'Ajustar público-alvo'
      ],
      low_ctr: [
        'Atualizar criativos visuais',
        'Testar novas copy do anúncio',
        'Revisar público-alvo',
        'Adicionar call-to-action mais forte'
      ]
    };

    const options = recommendations[problemType] || ['Revisar configurações gerais'];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Construir prompt para insights gerais
  buildInsightsPrompt(metricsData, context) {
    return `
Analise estas métricas do Facebook Ads e forneça insights estratégicos:

**Métricas Gerais:**
- Total Investido: R$ ${metricsData.totalSpend?.toFixed(2)}
- Impressões: ${metricsData.totalImpressions?.toLocaleString()}
- Cliques: ${metricsData.totalClicks?.toLocaleString()}
- Conversões: ${metricsData.totalConversions}
- CPA Médio: R$ ${metricsData.avgCPA?.toFixed(2)}
- ROAS Médio: ${metricsData.avgROAS?.toFixed(2)}x
- CTR Médio: ${metricsData.avgCTR?.toFixed(2)}%
- CPC Médio: R$ ${metricsData.avgCPC?.toFixed(2)}

**Contexto:**
- Período analisado: ${context.period || '7 dias'}
- Número de campanhas: ${context.campaignCount || 'N/A'}

Forneça:
1. **Resumo da Performance**: Avaliação geral dos resultados
2. **Principais Oportunidades**: 3 pontos de melhoria mais importantes
3. **Ações Recomendadas**: Passos específicos para otimização
4. **Benchmark**: Como estas métricas se comparam com padrões do mercado

Seja conciso, prático e focado em ações que geram resultados.
    `;
  }

  // Processar resposta da IA
  parseInsightsResponse(aiResponse) {
    return {
      content: aiResponse,
      generatedAt: new Date().toISOString(),
      type: 'general_insights',
      confidence: 0.85, // Score de confiança
      actionable: true
    };
  }

  // Salvar insights no banco para histórico
  async saveInsightsToDatabase(insights, metricsData) {
    try {
      await prisma.aiInsight.create({
        data: {
          type: insights.type,
          content: insights.content,
          confidence: insights.confidence,
          actionable: insights.actionable,
          metricsSnapshot: JSON.stringify(metricsData),
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Erro ao salvar insights no banco:', error);
      // Não falhar se não conseguir salvar
    }
  }

  // Gerar chave de cache
  getCacheKey(type, ...args) {
    const dataString = JSON.stringify(args);
    return `${type}_${Buffer.from(dataString).toString('base64').slice(0, 20)}`;
  }

  // Limpar cache antigo (chame periodicamente)
  clearOldCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 3600000) { // 1 hora
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new OpenAIService();