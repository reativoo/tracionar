import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  EyeIcon, 
  CursorArrowRaysIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import api from '../services/api'
import { format, parseISO, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedAccount, setSelectedAccount] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod, selectedAccount])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const params = {
        period: selectedPeriod,
        ...(selectedAccount && { accountId: selectedAccount })
      }
      
      const response = await api.get('/analytics/dashboard', { params })
      setDashboardData(response.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum dado encontrado</h3>
        <p className="mt-1 text-gray-500">Conecte uma conta do Facebook Ads para ver os dados</p>
      </div>
    )
  }

  const { kpis, chartData, criticalCampaigns, accounts } = dashboardData

  // KPIs cards
  const kpiCards = [
    {
      name: 'Total Investido',
      value: `R$ ${kpis.totalSpend?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Impressões',
      value: kpis.totalImpressions?.toLocaleString('pt-BR') || '0',
      icon: EyeIcon,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Cliques',
      value: kpis.totalClicks?.toLocaleString('pt-BR') || '0',
      icon: CursorArrowRaysIcon,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Conversões',
      value: kpis.totalConversions?.toLocaleString('pt-BR') || '0',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      change: '-3%',
      changeType: 'negative'
    }
  ]

  const metricCards = [
    {
      name: 'CPA Médio',
      value: `R$ ${kpis.avgCPA?.toFixed(2) || '0,00'}`,
      target: 'Meta: R$ 50,00',
      status: kpis.avgCPA <= 50 ? 'good' : kpis.avgCPA <= 57.5 ? 'warning' : 'critical'
    },
    {
      name: 'ROAS Médio',
      value: `${kpis.avgROAS?.toFixed(2) || '0,00'}x`,
      target: 'Meta: 4,00x',
      status: kpis.avgROAS >= 4 ? 'good' : kpis.avgROAS >= 3 ? 'warning' : 'critical'
    },
    {
      name: 'CTR Médio',
      value: `${kpis.avgCTR?.toFixed(2) || '0,00'}%`,
      target: 'Meta: 2,00%',
      status: kpis.avgCTR >= 2 ? 'good' : kpis.avgCTR >= 1.5 ? 'warning' : 'critical'
    },
    {
      name: 'CPC Médio',
      value: `R$ ${kpis.avgCPC?.toFixed(2) || '0,00'}`,
      target: 'Meta: R$ 1,50',
      status: kpis.avgCPC <= 1.5 ? 'good' : kpis.avgCPC <= 2 ? 'warning' : 'critical'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return '✅'
      case 'warning': return '⚠️'
      case 'critical': return '❌'
      default: return '⚪'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Visão geral das suas campanhas do Facebook Ads
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          {/* Filtro de período */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>

          {/* Filtro de conta */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Todas as contas</option>
            {accounts?.map(account => (
              <option key={account.id} value={account.id}>
                {account.accountName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.changeType === 'positive' ? (
                          <ArrowTrendingUpIcon className="flex-shrink-0 self-center h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowTrendingDownIcon className="flex-shrink-0 self-center h-4 w-4 text-red-500" />
                        )}
                        <span className="ml-1">{item.change}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Métricas com CPA desejável */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <div key={metric.name} className={`bg-white p-5 rounded-xl border-2 ${getStatusColor(metric.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.target}</p>
              </div>
              <div className="text-2xl">
                {getStatusIcon(metric.status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução do CPA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evolução do CPA</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData?.cpaEvolution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR })}
                  formatter={(value) => [`R$ ${value.toFixed(2)}`, 'CPA']}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpa" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROAS por Campanha */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ROAS por Campanha</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.roasByCampaign || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toFixed(2)}x`, 'ROAS']} />
                <Bar dataKey="roas" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Campanhas Críticas */}
      {criticalCampaigns?.length > 0 && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              ⚠️ Campanhas que Precisam de Atenção
            </h3>
            <p className="text-sm text-gray-500">
              Campanhas com CPA acima do desejável ou baixo ROAS
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-3">
              {criticalCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-600">
                      CPA: R$ {campaign.cpa?.toFixed(2)} | ROAS: {campaign.roas?.toFixed(2)}x
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-medium">
                      {campaign.issue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage