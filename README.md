# ==========================================
# ARQUIVO: README.md
# ==========================================

# TRACIONAR 📊

Sistema completo de análise de métricas do Facebook Ads para uso pessoal, com dashboard inteligente, insights de IA e relatórios detalhados.

## 🎯 Visão Geral

O TRACIONAR é um sistema privado e pessoal que conecta suas contas do Facebook Ads via API oficial, oferecendo:

- **Dashboard completo** com KPIs em tempo real
- **Análise inteligente** com suporte do GPT-4
- **Multi-contas** do Facebook Ads
- **Campo de CPA desejável** com indicadores visuais
- **Relatórios em PDF** para download
- **Gráficos interativos** e comparativos
- **Visões estratégicas avançadas**

## 🚀 Tecnologias

### Backend
- **Node.js** + Express
- **SQLite** com Prisma ORM
- **JWT** para autenticação
- **Facebook Ads Graph API**
- **OpenAI GPT-4 API**
- **Winston** para logs

### Frontend
- **React 18** + Vite
- **Tailwind CSS** + Headless UI
- **Zustand** para gerenciamento de estado
- **Recharts** para gráficos
- **React Hook Form** para formulários

## 📁 Estrutura do Projeto

```
tracionar/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # APIs e serviços
│   │   └── utils/          # Utilitários
│   ├── public/             # Assets estáticos
│   └── package.json
├── server/                 # Backend Node.js
│   ├── routes/             # Rotas da API
│   ├── services/           # Serviços (Facebook API, IA)
│   ├── middleware/         # Middlewares
│   ├── utils/              # Utilitários
│   ├── prisma/             # Schema e migrações
│   ├── logs/               # Arquivos de log
│   └── package.json
├── deploy/                 # Scripts de deploy
├── docs/                   # Documentação
└── README.md
```

## 🛠️ Instalação Local

### Pré-requisitos
- **Node.js 18+**
- **Git**
- **Conta no Facebook Developers**
- **Chave da OpenAI API** (opcional)

### 1. Clonar o Repositório
```bash
git clone https://github.com/reativoo/tracionar.git
cd tracionar
```

### 2. Instalar Dependências
```bash
# Instalar dependências de ambos os projetos
npm run setup

# Ou manualmente:
cd server && npm install
cd ../client && npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
cd server
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
DATABASE_URL="file:./tracionar.db"

# Facebook App (obrigatório)
FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3001/api/facebook/callback

# OpenAI (opcional)
OPENAI_API_KEY=sua_chave_openai
```

### 4. Configurar Banco de Dados
```bash
cd server
npx prisma migrate dev
npx prisma generate
```

### 5. Iniciar Aplicação
```bash
# Na raiz do projeto
npm run dev

# Ou separadamente:
# Terminal 1 (Backend)
cd server && npm run dev

# Terminal 2 (Frontend)
cd client && npm run dev
```

Acesse: `http://localhost:3000`

## 🔧 Configuração do Facebook App

### 1. Criar App no Facebook Developers
1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo App tipo "Business"
3. Adicione o produto "Marketing API"

### 2. Configurar Permissões
Solicite as seguintes permissões:
- `ads_read`
- `ads_management` 
- `business_management`
- `read_insights`

### 3. Configurar Redirect URI
No painel do App, configure:
- **Local**: `http://localhost:3001/api/facebook/callback`
- **Produção**: `https://tracionar.com.br/api/facebook/callback`

## 📊 Funcionalidades Principais

### Dashboard KPIs
- ✅ Impressões, Alcance, Cliques
- ✅ CTR, CPC, CPM, CPA, ROAS
- ✅ Comparação com CPA desejável
- ✅ Indicadores visuais de performance

### Análise de Campanhas
- ✅ Listagem com filtros avançados
- ✅ Métricas detalhadas por campanha
- ✅ Configuração de CPA desejável
- ✅ Status visual de performance

### Visões Estratégicas
- 📊 Ranking de performance
- 📈 Evolução temporal do ROAS
- 🎯 Criativos mais eficientes
- 👥 Comparativo de públicos
- 📱 Performance por dispositivo
- ⚠️ Radar de campanhas problemáticas

### Insights de IA
- 🧠 Análises automáticas com GPT-4
- 💡 Sugestões de otimização
- 📋 Recomendações personalizadas
- 👍👎 Sistema de feedback

### Relatórios
- 📄 Export em PDF
- 📊 Gráficos incluídos
- 📅 Períodos personalizáveis
- 💾 Download direto

## 🔒 Segurança

- **Autenticação JWT** com expiração
- **Criptografia** de tokens do Facebook
- **Rate limiting** por IP
- **Logs de segurança** detalhados
- **Headers de segurança** configurados
- **Validação** rigorosa de entrada

## 🚀 Deploy em Produção

### Deploy Automático no VPS Hetzner

1. **Configurar VPS Ubuntu 24.04**
2. **Executar script de deploy:**

```bash
# No VPS
wget https://raw.githubusercontent.com/reativoo/tracionar/main/deploy/install.sh
chmod +x install.sh
sudo ./install.sh
```

3. **Configurar variáveis de produção:**
```bash
nano /var/www/tracionar/server/.env
```

4. **Configurar DNS** para apontar para o VPS

### Deploy Manual

Se preferir deploy manual, siga os passos no arquivo [DEPLOY.md](./docs/DEPLOY.md).

## 📈 Monitoramento

### Logs da Aplicação
```bash
# Ver logs em tempo real
pm2 logs

# Logs específicos
tail -f /var/log/tracionar/combined.log
```

### Status dos Serviços
```bash
# Status PM2
pm2 status

# Status Nginx
systemctl status nginx

# Health check
curl http://localhost:3001/health
```

## 🔄 Atualização

### Produção
```bash
# Executar script de atualização
update-tracionar
```

### Local
```bash
git pull origin main
npm run setup
cd server && npx prisma migrate dev
npm run dev
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com Facebook API**
   - Verificar credenciais no `.env`
   - Confirmar permissões do App
   - Checar status da API do Facebook

2. **Erro de banco de dados**
   ```bash
   cd server
   npx prisma migrate reset
   npx prisma migrate dev
   ```

3. **Erro de build do frontend**
   ```bash
   cd client
   rm -rf node_modules dist
   npm install
   npm run build
   ```

### Logs de Debug
```bash
# Modo debug no backend
DEBUG=* npm run dev

# Logs detalhados
LOG_LEVEL=debug npm run start
```

## 📚 Documentação Adicional

- [API Reference](./docs/API.md)
- [Deploy Guide](./docs/DEPLOY.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Facebook API Setup](./docs/FACEBOOK_SETUP.md)

## 🤝 Contribuição

Como este é um projeto de **uso pessoal**, contribuições não são aceitas. Porém, você pode:

1. Fazer fork para seu próprio uso
2. Reportar bugs via issues
3. Sugerir melhorias

## 📄 Licença

**Uso Pessoal** - Este projeto é destinado exclusivamente para uso pessoal. Não é permitido uso comercial ou redistribuição.

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique a [documentação](./docs/)
2. Consulte os [logs](#-monitoramento)
3. Abra uma [issue](https://github.com/reativoo/tracionar/issues)

---

**TRACIONAR** - Sistema de Análise Facebook Ads
Desenvolvido para uso pessoal | Versão 1.0.0