import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      needsSetup: false,

      // Ações
      login: async (credentials) => {
        try {
          set({ isLoading: true })
          
          const response = await api.post('/auth/login', credentials)
          const { user, token } = response.data

          // Configurar token no axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            needsSetup: false
          })

          toast.success(`Bem-vindo, ${user.username}!`)
          return { success: true }

        } catch (error) {
          set({ isLoading: false })
          
          const message = error.response?.data?.error || 'Erro ao fazer login'
          toast.error(message)
          
          return { 
            success: false, 
            error: message,
            code: error.response?.data?.code 
          }
        }
      },

      setup: async (setupData) => {
        try {
          set({ isLoading: true })
          
          const response = await api.post('/auth/setup', setupData)
          const { user, token } = response.data

          // Configurar token no axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            needsSetup: false
          })

          toast.success(`TRACIONAR configurado com sucesso! Bem-vindo, ${user.username}!`)
          return { success: true }

        } catch (error) {
          set({ isLoading: false })
          
          const message = error.response?.data?.error || 'Erro na configuração inicial'
          
          // Não mostrar toast se retornarmos o erro para o componente tratar
          console.error('Setup error:', error)
          
          return { 
            success: false, 
            error: message,
            code: error.response?.data?.code 
          }
        }
      },

      logout: () => {
        // Remover token do axios
        delete api.defaults.headers.common['Authorization']
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          needsSetup: false
        })

        toast.success('Logout realizado com sucesso')
      },

      checkAuthStatus: async () => {
        try {
          set({ isLoading: true })

          // Verificar se há token salvo
          const savedToken = get().token
          if (savedToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
          }

          const response = await api.get('/auth/status')
          const { isAuthenticated, user, isFirstSetup } = response.data

          if (isAuthenticated && user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              needsSetup: false
            })
          } else {
            // Limpar dados se não autenticado
            delete api.defaults.headers.common['Authorization']
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              needsSetup: isFirstSetup
            })
          }

        } catch (error) {
          console.error('Erro ao verificar status de auth:', error)
          
          // Em caso de erro, verificar se precisa de setup
          try {
            const setupResponse = await api.get('/auth/check-setup')
            const { needsSetup } = setupResponse.data
            
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              needsSetup
            })
          } catch (setupError) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              needsSetup: false
            })
          }
        }
      },

      // Atualizar dados do usuário
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }))
      },

      // Limpar erros/estado
      clearError: () => {
        // Para uso futuro se implementarmos estado de erro
      }
    }),
    {
      name: 'tracionar-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export { useAuthStore }