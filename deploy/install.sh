#!/bin/bash

# Script de Deploy Automático - TRACIONAR
# Para uso no VPS Hetzner Ubuntu 24.04

set -e  # Parar se houver erro

echo "🚀 Iniciando deploy do TRACIONAR..."

# Configurações
REPO_URL="https://github.com/reativoo/tracionar.git"
APP_DIR="/var/www/tracionar"
NODE_VERSION="18"
DOMAIN="tracionar.com.br"
USER="tracionar"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Atualizar sistema
update_system() {
    print_status "Atualizando sistema..."
    apt update && apt upgrade -y
    print_success "Sistema atualizado"
}

# Instalar dependências básicas
install_dependencies() {
    print_status "Instalando dependências básicas..."
    apt install -y curl wget git unzip software-properties-common ufw nginx certbot python3-certbot-nginx
    print_success "Dependências instaladas"
}

# Instalar Node.js
install_nodejs() {
    if command_exists node; then
        print_warning "Node.js já está instalado: $(node --version)"
        return
    fi

    print_status "Instalando Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Instalar PM2 globalmente
    npm install -g pm2
    
    print_success "Node.js $(node --version) e PM2 instalados"
}

# Criar usuário para aplicação
create_app_user() {
    if id "$USER" &>/dev/null; then
        print_warning "Usuário $USER já existe"
        return
    fi

    print_status "Criando usuário $USER..."
    useradd -m -s /bin/bash "$USER"
    usermod -aG sudo "$USER"
    print_success "Usuário $USER criado"
}

# Configurar firewall
setup_firewall() {
    print_status "Configurando firewall..."
    ufw --force enable
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 3001  # Porta da aplicação
    print_success "Firewall configurado"
}

# Clonar repositório
clone_repository() {
    print_status "Clonando repositório..."
    
    if [ -d "$APP_DIR" ]; then
        print_warning "Diretório já existe, fazendo backup..."
        mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi

    git clone "$REPO_URL" "$APP_DIR"
    chown -R "$USER:$USER" "$APP_DIR"
    print_success "Repositório clonado"
}

# Instalar dependências da aplicação
install_app_dependencies() {
    print_status "Instalando dependências da aplicação..."
    
    cd "$APP_DIR"
    
    # Backend
    print_status "Instalando dependências do backend..."
    cd server && npm install
    
    # Frontend
    print_status "Instalando dependências do frontend..."
    cd ../client && npm install
    
    print_success "Dependências instaladas"
}

# Configurar banco de dados
setup_database() {
    print_status "Configurando banco de dados..."
    
    cd "$APP_DIR/server"
    
    # Gerar Prisma Client
    npx prisma generate
    
    # Executar migrações
    npx prisma migrate deploy
    
    print_success "Banco de dados configurado"
}

# Compilar frontend
build_frontend() {
    print_status "Compilando frontend..."
    
    cd "$APP_DIR/client"
    npm run build
    
    print_success "Frontend compilado"
}

# Configurar variáveis de ambiente
setup_environment() {
    print_status "Configurando variáveis de ambiente..."
    
    cd "$APP_DIR/server"
    
    if [ ! -f .env ]; then
        cat > .env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
DATABASE_URL="file:./tracionar.db"
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_REDIRECT_URI=https://${DOMAIN}/api/facebook/callback
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
EOF
        print_success "Arquivo .env criado"
        print_warning "⚠️  IMPORTANTE: Configure as variáveis no arquivo $APP_DIR/server/.env"
    else
        print_warning "Arquivo .env já existe"
    fi
}

# Configurar PM2
setup_pm2() {
    print_status "Configurando PM2..."
    
    cd "$APP_DIR"
    
    # Criar arquivo de configuração do PM2
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tracionar',
    cwd: './server',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/tracionar/error.log',
    out_file: '/var/log/tracionar/out.log',
    log_file: '/var/log/tracionar/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 1000
  }]
}
EOF

    # Criar diretório de logs
    mkdir -p /var/log/tracionar
    chown -R "$USER:$USER" /var/log/tracionar

    print_success "PM2 configurado"
}

# Configurar Nginx
setup_nginx() {
    print_status "Configurando Nginx..."
    
    cat > /etc/nginx/sites-available/tracionar << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        root ${APP_DIR}/client/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

    # Ativar site
    ln -sf /etc/nginx/sites-available/tracionar /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Testar configuração
    nginx -t
    systemctl reload nginx

    print_success "Nginx configurado"
}

# Configurar SSL com Let's Encrypt
setup_ssl() {
    print_status "Configurando SSL..."
    
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"
    
    print_success "SSL configurado"
}

# Iniciar aplicação
start_application() {
    print_status "Iniciando aplicação..."
    
    cd "$APP_DIR"
    
    # Parar PM2 se estiver rodando
    sudo -u "$USER" pm2 stop all || true
    sudo -u "$USER" pm2 delete all || true
    
    # Iniciar aplicação
    sudo -u "$USER" pm2 start ecosystem.config.js
    
    # Salvar configuração PM2
    sudo -u "$USER" pm2 save
    
    # Configurar PM2 para iniciar no boot
    sudo -u "$USER" pm2 startup
    
    print_success "Aplicação iniciada"
}

# Criar script de atualização
create_update_script() {
    print_status "Criando script de atualização..."
    
    cat > /usr/local/bin/update-tracionar << 'EOF'
#!/bin/bash

APP_DIR="/var/www/tracionar"
USER="tracionar"

echo "🔄 Atualizando TRACIONAR..."

cd "$APP_DIR"

# Fazer backup
echo "📦 Fazendo backup..."
sudo -u "$USER" pm2 save
cp -r "$APP_DIR" "/var/backups/tracionar_$(date +%Y%m%d_%H%M%S)"

# Atualizar código
echo "📥 Baixando atualizações..."
sudo -u "$USER" git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
cd server && sudo -u "$USER" npm install
cd ../client && sudo -u "$USER" npm install

# Atualizar banco
echo "🗄️  Atualizando banco..."
cd ../server && sudo -u "$USER" npx prisma generate
sudo -u "$USER" npx prisma migrate deploy

# Compilar frontend
echo "🏗️  Compilando frontend..."
cd ../client && sudo -u "$USER" npm run build

# Reiniciar aplicação
echo "🔄 Reiniciando aplicação..."
sudo -u "$USER" pm2 restart all

echo "✅ TRACIONAR atualizado com sucesso!"
EOF

    chmod +x /usr/local/bin/update-tracionar
    print_success "Script de atualização criado em /usr/local/bin/update-tracionar"
}

# Verificar instalação
verify_installation() {
    print_status "Verificando instalação..."
    
    # Verificar se a aplicação está rodando
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_success "✅ Aplicação rodando na porta 3001"
    else
        print_error "❌ Aplicação não está respondendo"
        return 1
    fi

    # Verificar Nginx
    if systemctl is-active --quiet nginx; then
        print_success "✅ Nginx rodando"
    else
        print_error "❌ Nginx não está rodando"
        return 1
    fi

    print_success "🎉 Deploy concluído com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure as variáveis no arquivo: $APP_DIR/server/.env"
    echo "2. Configure DNS para apontar $DOMAIN para este servidor"
    echo "3. Acesse https://$DOMAIN para configurar o sistema"
    echo ""
    echo "🔧 Comandos úteis:"
    echo "- Atualizar: update-tracionar"
    echo "- Logs: pm2 logs"
    echo "- Status: pm2 status"
    echo "- Reiniciar: pm2 restart all"
}

# Função principal
main() {
    print_status "Iniciando instalação do TRACIONAR no Ubuntu 24.04"
    
    # Verificar se está rodando como root
    if [ "$EUID" -ne 0 ]; then
        print_error "Execute como root: sudo $0"
        exit 1
    fi

    update_system
    install_dependencies
    install_nodejs
    create_app_user
    setup_firewall
    clone_repository
    install_app_dependencies
    setup_database
    build_frontend
    setup_environment
    setup_pm2
    setup_nginx
    setup_ssl
    start_application
    create_update_script
    verify_installation
}

# Executar função principal
main "$@"