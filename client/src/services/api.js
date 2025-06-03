# ==========================================
# ARQUIVO: client/src/services/api.js
# ==========================================

import axios from 'axios'
import toast from 'react-hot-toast'

// Configuração base do axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de requisição
api.interceptors.request.use(
  (config) => {
    // Log da requisição em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data)
    }
    
    return config
  },
  (error) => {
    console.error('Erro na requisição:', error)
    return Promise.reject(error)
  }
)

// Interceptor de resposta
api.interceptors.response.use(
  (response) => {
    // Log da resposta em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }
    
    return response
  },
  (error) => {
    // Log do erro
    console.error('Erro na resposta:', error)

    // Tratamento de erros específicos
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Token inválido ou expirado
          if (data.code === 'EXPIRED_TOKEN' || data.code === 'INVALID_TOKEN') {
            // Limpar autenticação e redirecionar para login
            localStorage.removeItem('tracionar-auth')
            delete api.defaults.headers.common['Authorization']
            window.location.href = '/login'
            toast.error('Sessão expirada. Faça login novamente.')
          }
          break

        case 403:
          toast.error('Acesso negado')
          break

        case 404:
          if (!error.config.url?.includes('/auth/')) {
            toast.error('Recurso não encontrado')
          }
          break

        case 429:
          toast.error('Muitas requisições. Tente novamente em alguns minutos.')
          break

        case 500:
          toast.error('Erro interno do servidor. Tente novamente.')
          break

        case 503:
          toast.error('Serviço temporariamente indisponível')
          break

        default:
          if (status >= 400) {
            const message = data.error || data.message || 'Erro na requisição'
            if (!error.config.skipToast) {
              toast.error(message)
            }
          }
      }
    } else if (error.request) {
      // Erro de conexão
      toast.error('Erro de conexão. Verifique sua internet.')
    } else {
      // Erro desconhecido
      toast.error('Erro inesperado. Tente novamente.')
    }

    return Promise.reject(error)
  }
)

export default api