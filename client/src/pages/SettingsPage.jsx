import React from 'react';

const SettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Configurações do Sistema</h2>
        <p className="text-gray-600 mb-4">
          Aqui você pode ajustar as configurações do Tracionar.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Empresa
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome da sua empresa"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de Notificações
            </label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemplo.com"
            />
          </div>
          
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;