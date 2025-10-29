# Servecta Portal

Ein modernes, vollständiges Portal-System für Servecta UG (haftungsbeschränkt) i.G. mit Admin- und Kunden-Portal, Task-Management, Ticket-System und E-Mail-Benachrichtigungen.

## 🚀 Features

### 🔐 Benutzerverwaltung & Sicherheit
- **Rollenbasierte Zugriffskontrolle**: ADMIN, MANAGER, MITARBEITER, KUNDE
- **Duales Benutzersystem**: Staff (Mitarbeiter) und Consumer (Kunden)
- **Abteilungszuweisung**: IT und Datenschutz-Abteilungen
- **Sichere Authentifizierung**: NextAuth.js mit Credentials
- **Audit-Logging**: Vollständige Nachverfolgung aller Aktionen

### 📊 Admin-Portal (`/portal`)
- **Dashboard**: Live-Statistiken, KPIs und Aktivitätsübersicht
- **Kundenverwaltung**: Vollständige CRM-Funktionalität mit Adressen und Kontakten
- **Projektmanagement**: Projekte mit Abteilungszuweisung und Benutzerzuordnung
- **Task-Management**: Aufgaben mit Subtasks, Kommentaren und Deadlines
- **Ticket-System**: Support-Tickets mit Prioritäten und Zuweisungen
- **Benutzerverwaltung**: Staff- und Consumer-Benutzer verwalten
- **E-Mail-Einstellungen**: SMTP-Konfiguration und Test-Funktionen
- **System-Status**: Live-Monitoring und System-Informationen
- **Einstellungen**: Systemkonfiguration und Sicherheitseinstellungen

### 👥 Kunden-Portal (`/portal` für Kunden)
- **Dashboard**: Übersicht über eigene Projekte, Tasks und Tickets
- **Projektübersicht**: Nur eigene Projekte anzeigen (Read-Only)
- **Task-Übersicht**: Nur eigene Tasks anzeigen (Read-Only)
- **Ticket-System**: Eigene Tickets anzeigen und neue erstellen
- **Profilverwaltung**: Eigene Daten verwalten

### 📧 E-Mail-System
- **SMTP-Integration**: Vollständig konfigurierbare E-Mail-Einstellungen
- **Automatische Benachrichtigungen**: 
  - Task-Deadline-Benachrichtigungen (3 Tage, 1 Tag, heute)
  - Ticket-Änderungs-Benachrichtigungen
- **E-Mail-Templates**: Professionelle HTML-Templates
- **Test-Funktionen**: Verbindungstest und Test-E-Mails

### 🔔 Benachrichtigungssystem
- **Real-time Notifications**: Live-Benachrichtigungen im Portal
- **E-Mail-Benachrichtigungen**: Automatische E-Mails bei wichtigen Events
- **Unread-Counter**: Anzahl ungelesener Benachrichtigungen
- **Mark as Read**: Benachrichtigungen als gelesen markieren

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Authentication**: NextAuth.js mit Credentials
- **Database**: MongoDB (Native Driver)
- **Validation**: Zod
- **UI**: Tailwind CSS + shadcn/ui + Lucide React
- **Email**: Nodemailer mit dynamischen SMTP-Einstellungen
- **Process Management**: PM2 für Production
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

## ⚡ Quick Start

### Entwicklung

1. **Dependencies installieren**:
```bash
npm install
```

2. **Environment Variables**:
```bash
cp .env.local.example .env.local
# .env.local mit deinen Werten füllen
```

3. **MongoDB starten**:
```bash
# MongoDB muss lokal laufen oder Remote-Verbindung konfiguriert werden
```

4. **Development Server starten**:
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3001` verfügbar.

### Production Deployment

Für Production-Deployment auf Ihrem eigenen Server siehe: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

```bash
# Automatisches Deployment-Skript
./deploy-own-server.sh
```

## 🔑 Benutzerrollen

| Rolle | Beschreibung | Berechtigungen |
|-------|---------------|----------------|
| **ADMIN** | Systemadministrator | Vollzugriff auf alle Features, Systemeinstellungen |
| **MANAGER** | Projektmanager | Kunden, Projekte, Tasks verwalten, Benutzer erstellen |
| **MITARBEITER** | Mitarbeiter | Tasks und Tickets bearbeiten, Projekte anzeigen |
| **KUNDE** | Kunde | Nur eigene Daten anzeigen, Tickets erstellen |

## 📋 Scripts

- `npm run dev` - Development Server
- `npm run build` - Production Build
- `npm run start` - Production Server
- `npm run lint` - ESLint ausführen
- `npm run lint:fix` - ESLint automatisch korrigieren
- `npm run type-check` - TypeScript-Typen prüfen
- `npm run format` - Prettier ausführen
- `npm run format:check` - Prettier prüfen

## 🔧 Environment Variables

### Lokale Entwicklung

Erstellen Sie eine `.env.local` Datei mit folgenden Variablen:

```bash
# Datenbank
DATABASE_URL=mongodb://localhost:27017/servecta_admin

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=ihr-super-geheimer-schluessel-mindestens-32-zeichen-lang

# Node.js Umgebung
NODE_ENV=development

# Cron-Job-Sicherheit (optional)
CRON_SECRET=ihr-cron-geheimer-schluessel
```

### Vercel Deployment

Für Vercel Deployment konfigurieren Sie die Environment Variables im Vercel Dashboard unter **Settings → Environment Variables**.

**Erforderliche Variablen:**
- `DATABASE_URL` - MongoDB Connection String (z.B. `mongodb+srv://user:pass@cluster.mongodb.net/database`)
- `NEXTAUTH_SECRET` - Mindestens 32 Zeichen (generieren mit: `openssl rand -base64 32`)

**Optionale Variablen:**
- `NEXTAUTH_URL` - Wird automatisch aus `VERCEL_URL` generiert, wenn nicht gesetzt
- `CRON_SECRET` - Für geschützte Cron Job Endpoints

**Automatisch von Vercel gesetzt:**
- `VERCEL_URL` - Automatisch gesetzt
- `VERCEL_ENV` - Automatisch gesetzt (production, preview, development)
- `NODE_ENV` - Automatisch auf `production` gesetzt

📖 **Detaillierte Vercel-Konfiguration**: Siehe [VERCEL_SETUP.md](./VERCEL_SETUP.md)

## 🔌 API Endpoints

### Benutzerverwaltung
- `GET/POST /api/v1/users-mongodb` - Staff-Benutzer verwalten
- `GET/POST /api/v1/consumers` - Consumer-Benutzer verwalten

### Kundenverwaltung
- `GET/POST /api/v1/customers-mongo` - Kunden verwalten
- `GET/PUT/DELETE /api/v1/customers-mongo/[id]` - Einzelne Kunden
- `POST /api/v1/customers-mongo/[id]/addresses` - Adressen hinzufügen
- `POST /api/v1/customers-mongo/[id]/contacts` - Kontakte hinzufügen

### Projektmanagement
- `GET/POST /api/v1/projects-mongodb` - Projekte verwalten
- `GET/PUT/DELETE /api/v1/projects-mongodb/[id]` - Einzelne Projekte

### Task-Management
- `GET/POST /api/v1/tasks-mongodb` - Tasks verwalten
- `GET/PUT/DELETE /api/v1/tasks-mongodb/[id]` - Einzelne Tasks
- `GET/POST /api/v1/tasks-mongodb/[id]/comments` - Kommentare
- `GET/POST /api/v1/tasks-mongodb/[id]/subtasks` - Subtasks

### Ticket-System
- `GET/POST /api/v1/tickets-mongodb` - Tickets verwalten
- `GET/PUT/DELETE /api/v1/tickets-mongodb/[id]` - Einzelne Tickets
- `GET/POST /api/v1/tickets-mongodb/[id]/comments` - Kommentare

### E-Mail-System
- `GET/POST /api/v1/email/test` - E-Mail-Verbindung testen
- `POST /api/v1/email/notifications` - E-Mail-Benachrichtigungen senden
- `POST /api/v1/cron/task-deadlines` - Task-Deadline-Benachrichtigungen

### System
- `GET /api/v1/system/status` - System-Status
- `GET/PUT /api/v1/settings` - Systemeinstellungen
- `GET /api/v1/notifications` - Benachrichtigungen
- `GET /api/v1/audit-logs` - Audit-Logs

## 🕒 Cron Jobs

### Task-Deadline-Benachrichtigungen
Der `/api/v1/cron/task-deadlines` Endpoint sendet täglich E-Mail-Benachrichtigungen für:
- Tasks, die heute fällig sind
- Tasks, die morgen fällig sind  
- Tasks, die in 3 Tagen fällig sind

**Cron-Job einrichten:**
```bash
# Täglich um 9:00 Uhr
0 9 * * * curl -X POST https://ihre-domain.com/api/v1/cron/task-deadlines -H "Authorization: Bearer ihr-cron-geheimer-schluessel"
```

## 🚀 Deployment

### Automatisches Deployment
```bash
# Deployment-Skript ausführen
./deploy-own-server.sh
```

### Manuelles Deployment
Siehe [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) für detaillierte Anleitung.

### Server-Anforderungen
- **CPU**: 2 Kerne
- **RAM**: 2GB (4GB empfohlen)
- **Speicher**: 20GB SSD
- **Betriebssystem**: Ubuntu 20.04+ oder Debian 11+
- **Software**: Node.js 18+, MongoDB 5.0+, Nginx

## 🔍 Monitoring & Wartung

### PM2-Befehle
```bash
pm2 status                    # Status aller Prozesse
pm2 logs servecta-portal     # Logs anzeigen
pm2 restart servecta-portal # Anwendung neu starten
pm2 monit                   # Performance-Monitoring
```

### System-Monitoring
```bash
sudo systemctl status mongod    # MongoDB-Status
sudo systemctl status nginx    # Nginx-Status
sudo tail -f /var/log/nginx/error.log  # Nginx-Logs
```

### Backup
```bash
# MongoDB-Backup erstellen
mongodump --db servecta_admin --out /backup/$(date +%Y%m%d)

# Automatisches Backup (täglich um 2:00 Uhr)
echo "0 2 * * * mongodump --db servecta_admin --out /backup/$(date +%Y%m%d)" | sudo crontab -
```

## 🛡 Sicherheit

- **HTTPS-only**: Alle Verbindungen verschlüsselt
- **Rollenbasierte Zugriffskontrolle**: Granulare Berechtigungen
- **Input Validation**: Zod-basierte Validierung aller Eingaben
- **Audit-Logging**: Vollständige Nachverfolgung aller Aktionen
- **E-Mail-Sicherheit**: SMTP-Verbindungen mit SSL/TLS
- **Cron-Job-Sicherheit**: Authentifizierte Cron-Jobs

## 📈 Performance

- **PM2 Cluster-Modus**: Mehrere Node.js-Prozesse
- **Nginx Reverse Proxy**: Optimierte Request-Verarbeitung
- **MongoDB-Indizierung**: Schnelle Datenbankabfragen
- **Static File Caching**: Optimierte Ladezeiten
- **Code Splitting**: Automatische Code-Aufteilung

## 🔄 Updates

### Anwendung aktualisieren
```bash
cd ~/servecta-backend
git pull origin main
npm install
npm run build
pm2 restart servecta-portal
```

### System-Updates
```bash
sudo apt update && sudo apt upgrade -y
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
   sudo systemctl restart nginx
   ```

4. **E-Mail-Verbindung fehlgeschlagen**
   - Prüfen Sie SMTP-Einstellungen in `/portal/email-settings`
   - Testen Sie die Verbindung über das Web-Interface

## 📞 Support

Bei Fragen oder Problemen:
- **Logs prüfen**: `pm2 logs servecta-portal`
- **Nginx-Logs**: `sudo tail -f /var/log/nginx/error.log`
- **MongoDB-Logs**: `sudo tail -f /var/log/mongodb/mongod.log`

## 📄 Lizenz

Proprietär - Servecta UG (haftungsbeschränkt) i.G.

---

**Servecta UG (haftungsbeschränkt) i.G.** - Modernes Portal-System für Unternehmen
