# Servecta Portal - Deployment auf eigenem Server

## 🚀 Übersicht

Diese Anleitung führt Sie durch das Deployment Ihres Servecta Portals auf Ihren eigenen Server (VPS, Dedicated Server, etc.).

## 📋 Server-Anforderungen

### Mindestanforderungen
- **CPU**: 2 Kerne
- **RAM**: 2GB (4GB empfohlen)
- **Speicher**: 20GB SSD
- **Betriebssystem**: Ubuntu 20.04+ oder Debian 11+
- **Internet**: Stabile Verbindung

### Software-Anforderungen
- **Node.js**: Version 18+
- **MongoDB**: Version 5.0+
- **Nginx**: Für Reverse Proxy
- **PM2**: Für Process Management

## 🔧 Schritt-für-Schritt Deployment

### Schritt 1: Server vorbereiten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Grundlegende Tools installieren
sudo apt install -y curl wget git unzip software-properties-common

# Firewall konfigurieren (optional)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Schritt 2: Node.js installieren

```bash
# Node.js 18.x installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Version prüfen
node --version
npm --version
```

### Schritt 3: MongoDB installieren

```bash
# MongoDB GPG Key hinzufügen
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# MongoDB Repository hinzufügen
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# MongoDB installieren
sudo apt-get update
sudo apt-get install -y mongodb-org

# MongoDB starten und aktivieren
sudo systemctl start mongod
sudo systemctl enable mongod

# Status prüfen
sudo systemctl status mongod
```

### Schritt 4: Nginx installieren

```bash
# Nginx installieren
sudo apt install -y nginx

# Nginx starten und aktivieren
sudo systemctl start nginx
sudo systemctl enable nginx

# Status prüfen
sudo systemctl status nginx
```

### Schritt 5: Anwendung deployen

```bash
# In Ihr Home-Verzeichnis wechseln
cd ~

# Repository klonen (ersetzen Sie die URL mit Ihrem Repository)
git clone https://github.com/ihr-username/servecta-backend.git
cd servecta-backend

# Dependencies installieren
npm install

# Production Build erstellen
npm run build
```

### Schritt 6: Umgebungsvariablen konfigurieren

```bash
# .env.local erstellen
nano .env.local
```

**Inhalt der .env.local:**
```bash
# Datenbank
DATABASE_URL=mongodb://localhost:27017/servecta_admin

# NextAuth (WICHTIG: Ändern Sie diese Werte!)
NEXTAUTH_URL=https://ihre-domain.com
NEXTAUTH_SECRET=ihr-super-geheimer-schluessel-mindestens-32-zeichen-lang

# Node.js Umgebung
NODE_ENV=production

# Cron-Job-Sicherheit
CRON_SECRET=ihr-cron-geheimer-schluessel
```

### Schritt 7: PM2 installieren und konfigurieren

```bash
# PM2 global installieren
sudo npm install -g pm2

# Logs-Verzeichnis erstellen
mkdir -p logs

# Anwendung mit PM2 starten
pm2 start ecosystem.config.js

# PM2 beim Boot starten
pm2 startup
pm2 save

# Status prüfen
pm2 status
```

### Schritt 8: Nginx konfigurieren

```bash
# Nginx-Konfiguration erstellen
sudo nano /etc/nginx/sites-available/servecta
```

**Nginx-Konfiguration (ersetzen Sie `ihre-domain.com`):**
```nginx
server {
    listen 80;
    server_name ihre-domain.com www.ihre-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Site aktivieren
sudo ln -s /etc/nginx/sites-available/servecta /etc/nginx/sites-enabled/

# Standard-Site deaktivieren
sudo rm /etc/nginx/sites-enabled/default

# Nginx-Konfiguration testen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx
```

### Schritt 9: SSL-Zertifikat installieren (Let's Encrypt)

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d ihre-domain.com -d www.ihre-domain.com

# Auto-Renewal testen
sudo certbot renew --dry-run
```

### Schritt 10: E-Mail-Konfiguration

1. **Über Web-Interface konfigurieren:**
   - Gehen Sie zu `https://ihre-domain.com/portal/email-settings`
   - Konfigurieren Sie Ihre SMTP-Einstellungen
   - Testen Sie die Verbindung

2. **Cron-Job für Benachrichtigungen einrichten:**
```bash
# Cron-Job hinzufügen
sudo crontab -e

# Täglich um 9:00 Uhr Aufgaben-Benachrichtigungen senden
0 9 * * * curl -X POST https://ihre-domain.com/api/v1/cron/task-deadlines -H "Authorization: Bearer ihr-cron-geheimer-schluessel"
```

## 🔄 Updates und Wartung

### Anwendung aktualisieren

```bash
# In das Anwendungsverzeichnis wechseln
cd ~/servecta-backend

# Änderungen vom Repository holen
git pull origin main

# Dependencies aktualisieren
npm install

# Neuen Build erstellen
npm run build

# PM2 neu starten
pm2 restart servecta-portal
```

### Monitoring

```bash
# PM2-Status prüfen
pm2 status

# Logs anzeigen
pm2 logs servecta-portal

# Performance-Monitoring
pm2 monit

# System-Ressourcen prüfen
htop
```

### Backup

```bash
# MongoDB-Backup erstellen
mongodump --db servecta_admin --out /backup/$(date +%Y%m%d)

# Automatisches Backup (täglich um 2:00 Uhr)
echo "0 2 * * * mongodump --db servecta_admin --out /backup/$(date +%Y%m%d)" | sudo crontab -
```

## 🚨 Troubleshooting

### Häufige Probleme

1. **Port 3001 bereits belegt**
   ```bash
   sudo lsof -i :3001
   sudo kill -9 <PID>
   ```

2. **MongoDB-Verbindung fehlgeschlagen**
   ```bash
   sudo systemctl restart mongod
   sudo systemctl status mongod
   ```

3. **Nginx-Fehler**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo systemctl restart nginx
   ```

4. **PM2-Prozess hängt**
   ```bash
   pm2 restart servecta-portal
   pm2 logs servecta-portal
   ```

5. **SSL-Zertifikat-Probleme**
   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl reload nginx
   ```

## 📊 Nützliche Befehle

```bash
# PM2-Befehle
pm2 status                    # Status aller Prozesse
pm2 logs servecta-portal     # Logs anzeigen
pm2 restart servecta-portal # Anwendung neu starten
pm2 stop servecta-portal    # Anwendung stoppen
pm2 start servecta-portal   # Anwendung starten
pm2 monit                   # Performance-Monitoring

# System-Befehle
sudo systemctl status mongod    # MongoDB-Status
sudo systemctl status nginx    # Nginx-Status
sudo systemctl status pm2-root # PM2-Status

# Logs anzeigen
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/mongodb/mongod.log
```

## ✅ Deployment-Checkliste

- [ ] Server vorbereitet (Ubuntu/Debian aktualisiert)
- [ ] Node.js 18+ installiert
- [ ] MongoDB installiert und gestartet
- [ ] Nginx installiert und konfiguriert
- [ ] Repository geklont
- [ ] Dependencies installiert (`npm install`)
- [ ] Production Build erstellt (`npm run build`)
- [ ] `.env.local` konfiguriert
- [ ] PM2 installiert und konfiguriert
- [ ] Nginx-Site aktiviert
- [ ] SSL-Zertifikat installiert
- [ ] E-Mail-Einstellungen konfiguriert
- [ ] Cron-Job für Benachrichtigungen eingerichtet
- [ ] Backup-Strategie implementiert

## 🎯 Nach dem Deployment

1. **Anwendung testen**: `https://ihre-domain.com`
2. **Admin-Login**: Ersten Admin-Benutzer erstellen
3. **E-Mail-Einstellungen**: SMTP konfigurieren
4. **Monitoring einrichten**: PM2-Monitoring aktivieren
5. **Backup testen**: MongoDB-Backup erstellen und testen

Nach Abschluss aller Schritte ist Ihr Servecta Portal auf Ihrem eigenen Server live! 🎉
