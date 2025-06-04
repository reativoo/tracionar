import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, checkAuthStatus, needsSetup, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  })

  // Verificar se precisa de setup inicial
  useEffect(() => {
    const checkSetup = async () => {
      await checkAuthStatus()
    }
    checkSetup()
  }, [checkAuthStatus])

  // Redirecionar para setup se necessário
  useEffect(() => {
    if (!isLoading && needsSetup) {
      navigate('/setup', { replace: true })
    }
  }, [needsSetup, isLoading, navigate])

  const onSubmit = async (data) => {
    try {
      const result = await login(data)
      
      if (result.success) {
        navigate('/dashboard', { replace: true })
      } else {
        // Tratar erros específicos
        if (result.code === 'INVALID_CREDENTIALS') {
          setError('username', { 
            type: 'manual', 
            message: 'Usuário ou senha incorretos' 
          })
          setError('password', { 
            type: 'manual', 
            message: 'Usuário ou senha incorretos' 
          })
        } else {
          setError('username', { 
            type: 'manual', 
            message: result.error 
          })
        }
      }
    } catch (error) {
      console.error('Erro no login:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao TRACIONAR
          </h2>
          <p className="text-gray-600">
            Faça login para acessar suas análises do Facebook Ads
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Campo Usuário */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <input
                {...register('username', {
                  required: 'Usuário é obrigatório',
                  minLength: {
                    value: 3,
                    message: 'Usuário deve ter pelo menos 3 caracteres'
                  }
                })}
                type="text"
                autoComplete="username"
                className={`
                  appearance-none relative block w-full px-3 py-3 border rounded-xl
                  placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2
                  focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm
                  transition-colors duration-200
                  ${errors.username 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  }
                `}
                placeholder="Digite seu usuário"
              />
              {errors.username && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`
                    appearance-none relative block w-full px-3 py-3 pr-10 border rounded-xl
                    placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2
                    focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm
                    transition-colors duration-200
                    ${errors.password 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                    }
                  `}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botão Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  group relative w-full flex justify-center py-3 px-4 border border-transparent
                  text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-3" />
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>

          {/* Links auxiliares */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Primeiro acesso?{' '}
              <Link
                to="/setup"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Configure o sistema
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            TRACIONAR - Sistema de Análise de Facebook Ads
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Versão 1.0.0 - Uso Pessoal
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage