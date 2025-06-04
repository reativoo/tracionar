import React from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'

const Header = ({ setSidebarOpen }) => {
  return (
    <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
      <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Abrir sidebar</span>
          <Bars3Icon className="h-6 w-6" />
        </button>
        
        <div className="h-6 w-px bg-gray-200 lg:hidden" />
        
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1"></div>
        </div>
      </div>
    </div>
  )
}

export default Header
