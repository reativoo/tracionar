# ==========================================
# ARQUIVO: client/src/components/Layout/Sidebar.jsx
# ==========================================

import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  XMarkIcon,
  ChartBarIcon,
  BoltIcon,
  CreditCardIcon,
  BrainIcon,
  DocumentArrowDownIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: ChartBarIcon,
    description: 'Visão geral dos KPIs'
  },
  { 
    name: 'Campanhas', 
    href: '/campaigns', 
    icon: BoltIcon,
    description: 'Análise de campanhas'
  },
  { 
    name: 'Contas', 
    href: '/accounts', 
    icon: CreditCardIcon,
    description: 'Gerenciar contas do Facebook'
  },
  { 
    name: 'Insights IA', 
    href: '/insights', 
    icon: BrainIcon,
    description: 'Sugestões da inteligência artificial'
  },
  { 
    name: 'Relatórios', 
    href: '/reports', 
    icon: DocumentArrowDownIcon,
    description: 'Gerar e baixar relatórios'
  },
  { 
    name: 'Configurações', 
    href: '/settings', 
    icon: CogIcon,
    description: 'Preferências e configurações'
  }
]

const Sidebar = ({ sidebarOpen, setSidebarOpen, mobile = false }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 bg-primary-600">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-primary-600 font-bold text-sm">T</span>
          </div>
          <div className="ml-3">
            <h1 className="text-white font-bold text-lg">TRACIONAR</h1>
            <p className="text-primary-200 text-xs">Facebook Ads Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 bg-white border-r border-gray-200">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    isActive 
                      ? 'text-primary-600' 
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs ${
                    isActive 
                      ? 'text-primary-600' 
                      : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center mb-3">
          <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500">
              Admin
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
          Sair
        </button>
      </div>
    </div>
  )

  if (mobile) {
    return (
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Fechar sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    )
  }

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200">
      <SidebarContent />
    </div>
  )
}

export default Sidebar