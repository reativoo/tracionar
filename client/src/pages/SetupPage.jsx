import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, CheckCircle, Settings, Zap, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Schema de validação
const schema = yup.object({
  username: yup.string().required('Nome de usuário é obrigatório').min(3, 'Mínimo 3 caracteres'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup.string().required('Senha é obrigatória').min(6, 'Mínimo 6 caracteres'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Senhas não coincidem')
    .required('Confirmação de senha é obrigatória'),
  companyName: yup.string().optional(),
  openaiApiKey: yup.string().optional(),
  facebookAppId: yup.string().optional(),
  facebookAppSecret: yup.string().optional(),
  acceptTerms: yup.boolean().oneOf([true], 'Você deve aceitar os termos')
});

const SetupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { setup } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      await setup(data);
      toast.success(`Bem-vindo ao TRACIONAR, ${data.username}!`);
    } catch (error) {
      toast.error(error.message || 'Erro durante a configuração');
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Usuário Admin',
      description: 'Crie o primeiro usuário administrador'
    },
    {
      number: 2,
      title: 'Configurações',
      description: 'Configure integrações opcionais'
    },
    {
      number: 3,
      title: 'Finalizar',
      description: 'Conclua a configuração inicial'
    }
  ];

  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard Avançado',
      description: 'Métricas em tempo real das suas campanhas'
    },
    {
      icon: Zap,
      title: 'Insights IA',
      description: 'Recomendações inteligentes para otimização'
    },
    {
      icon: Settings,
      title: 'Automação',
      description: 'Automatize análises e relatórios'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TRACIONAR</h1>
              <p className="text-sm text-gray-600">Sistema de Análise de Campanhas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Side - Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Configure seu
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> TRACIONAR</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Em poucos minutos você terá um sistema completo para analisar e otimizar suas campanhas do Facebook Ads.
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${currentStep >= step.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">O que você terá:</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white rounded-2xl shadow-xl border p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Configuração Inicial</h3>
              <p className="text-gray-600">Configure o TRACIONAR criando o primeiro usuário administrador</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Usuário Admin */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">👤 Usuário Administrador</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de usuário *
                  </label>
                  <input
                    {...register('username')}
                    type="text"
                    placeholder="Digite seu usuário"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da empresa (opcional)
                  </label>
                  <input
                    {...register('companyName')}
                    type="text"
                    placeholder="Sua empresa"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar senha *
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Integrações */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">🔗 Integrações (Opcional)</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    {...register('openaiApiKey')}
                    type="password"
                    placeholder="sk-proj-..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">Para insights automáticos com IA</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook App ID
                  </label>
                  <input
                    {...register('facebookAppId')}
                    type="text"
                    placeholder="1010783094590658"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook App Secret
                  </label>
                  <input
                    {...register('facebookAppSecret')}
                    type="password"
                    placeholder="916de99c2720fddfea85821db742b728"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Termos */}
              <div className="flex items-center space-x-3">
                <input
                  {...register('acceptTerms')}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Eu aceito os{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    termos de uso
                  </a>{' '}
                  e{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    política de privacidade
                  </a>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Configurando...</span>
                  </div>
                ) : (
                  'Finalizar Configuração'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Este será o usuário administrador principal do sistema
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;