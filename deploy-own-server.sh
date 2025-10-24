#!/bin/bash

# Servecta Portal - Einfaches Deployment-Skript für eigenen Server
# Dieses Skript automatisiert das Deployment auf Ihrem eigenen Server

set -e

echo "🚀 Servecta Portal - Deployment auf eigenem Server"
echo "=================================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[SCHRITT]${NC} $1"
}

# Prüfe ob als Root ausgeführt
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "Führen Sie dieses Skript NICHT als Root aus!"
        log_info "Verwenden Sie einen normalen Benutzer mit sudo-Rechten."
        exit 1
    fi
}

# Prüfe ob Node.js installiert ist
check_nodejs() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js ist nicht installiert!"
        log_info "Installieren Sie Node.js 18+ zuerst:"
        echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "sudo apt-get install -y nodejs"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_info "Node.js Version: $NODE_VERSION"
}

# Prüfe ob MongoDB läuft
check_mongodb() {
    if ! systemctl is-active --quiet mongod; then
        log_warn "MongoDB läuft nicht. Starte MongoDB..."
        sudo systemctl start mongod
        sudo systemctl enable mongod
    fi
    log_info "MongoDB ist aktiv"
}

# Prüfe ob Nginx läuft
check_nginx() {
    if ! systemctl is-active --quiet nginx; then
        log_warn "Nginx läuft nicht. Starte Nginx..."
        sudo systemctl start nginx
        sudo systemctl enable nginx
    fi
    log_info "Nginx ist aktiv"
}

# Installiere Dependencies
install_dependencies() {
    log_step "Installiere Dependencies..."
    npm ci
}

# Erstelle Production Build
build_app() {
    log_step "Erstelle Production Build..."
    npm run build
}

# Erstelle Logs-Verzeichnis
create_logs_dir() {
    log_info "Erstelle Logs-Verzeichnis..."
    mkdir -p logs
}

# Prüfe Umgebungsvariablen
check_env() {
    if [ ! -f ".env.local" ]; then
        log_warn ".env.local nicht gefunden!"
        log_info "Erstelle Beispiel-Datei..."
        cat > .env.local << EOF
# Datenbank
DATABASE_URL=mongodb://localhost:27017/servecta_admin

# NextAuth (WICHTIG: Ändern Sie diese Werte!)
NEXTAUTH_URL=https://ihre-domain.com
NEXTAUTH_SECRET=ihr-super-geheimer-schluessel-mindestens-32-zeichen-lang

# Node.js Umgebung
NODE_ENV=production

# Cron-Job-Sicherheit
CRON_SECRET=ihr-cron-geheimer-schluessel
EOF
        log_warn "⚠️  Bitte konfigurieren Sie .env.local mit Ihren Einstellungen!"
        log_info "Besonders wichtig: NEXTAUTH_URL und NEXTAUTH_SECRET"
        echo ""
        read -p "Drücken Sie Enter, wenn Sie .env.local konfiguriert haben..."
    fi
}

# Installiere PM2 falls nicht vorhanden
install_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_info "Installiere PM2..."
        sudo npm install -g pm2
    fi
}

# Starte PM2
start_pm2() {
    log_step "Starte PM2..."
    
    # Stoppe existierende Prozesse
    pm2 stop servecta-portal 2>/dev/null || true
    pm2 delete servecta-portal 2>/dev/null || true
    
    # Starte neue Instanz
    pm2 start ecosystem.config.js
    
    # Konfiguriere PM2 für Auto-Start
    pm2 startup
    pm2 save
    
    log_info "PM2 gestartet und konfiguriert"
}

# Prüfe Anwendung
check_app() {
    log_step "Prüfe Anwendung..."
    sleep 5
    
    if curl -f http://localhost:3001/api/v1/system/status > /dev/null 2>&1; then
        log_info "✅ Anwendung läuft erfolgreich!"
    else
        log_error "❌ Anwendung antwortet nicht!"
        log_info "Prüfen Sie die Logs: pm2 logs servecta-portal"
        exit 1
    fi
}

# Zeige nächste Schritte
show_next_steps() {
    log_info "=== Deployment erfolgreich! ==="
    echo ""
    log_info "=== Nächste Schritte ==="
    echo "1. Konfigurieren Sie Nginx für Ihre Domain:"
    echo "   sudo nano /etc/nginx/sites-available/servecta"
    echo ""
    echo "2. Installieren Sie SSL-Zertifikat:"
    echo "   sudo certbot --nginx -d ihre-domain.com"
    echo ""
    echo "3. Konfigurieren Sie E-Mail-Einstellungen:"
    echo "   https://ihre-domain.com/portal/email-settings"
    echo ""
    echo "4. Richten Sie Cron-Job für Benachrichtigungen ein:"
    echo "   sudo crontab -e"
    echo "   # Fügen Sie hinzu:"
    echo "   0 9 * * * curl -X POST https://ihre-domain.com/api/v1/cron/task-deadlines -H \"Authorization: Bearer ihr-cron-geheimer-schluessel\""
    echo ""
    log_info "=== Nützliche Befehle ==="
    echo "  Status prüfen:     pm2 status"
    echo "  Logs anzeigen:     pm2 logs servecta-portal"
    echo "  Restart:           pm2 restart servecta-portal"
    echo "  Monitoring:        pm2 monit"
    echo ""
    log_info "🎉 Ihr Servecta Portal ist bereit!"
}

# Hauptfunktion
main() {
    log_info "=== Servecta Portal Deployment ==="
    
    check_root
    check_nodejs
    check_mongodb
    check_nginx
    check_env
    install_dependencies
    build_app
    create_logs_dir
    install_pm2
    start_pm2
    check_app
    show_next_steps
}

# Skript ausführen
main "$@"
