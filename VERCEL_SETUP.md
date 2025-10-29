# Vercel Deployment Konfiguration

Diese Anleitung beschreibt, wie Sie das Servecta Portal auf Vercel deployen.

## 🔧 Environment Variables in Vercel

Konfigurieren Sie die folgenden Environment Variables im Vercel Dashboard unter **Settings → Environment Variables**:

### ✅ Erforderliche Variablen

#### `MONGODB_URI`
- **Beschreibung**: MongoDB Connection String
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/database` oder `mongodb://host:port/database`
- **Beispiel**: `mongodb+srv://user:pass@cluster.mongodb.net/servecta_admin`
- **⚠️ WICHTIG**: Diese Variable ist **erforderlich** für Production

#### `NEXTAUTH_SECRET`
- **Beschreibung**: Geheimer Schlüssel für JWT-Token (NextAuth.js)
- **Anforderungen**: Mindestens 32 Zeichen lang
- **Generierung**: 
  ```bash
  openssl rand -base64 32
  ```
- **⚠️ WICHTIG**: Diese Variable ist **erforderlich** für Production

#### `NEXTAUTH_URL` (optional)
- **Beschreibung**: Die vollständige URL Ihrer Anwendung
- **Format**: `https://ihre-domain.vercel.app` oder `https://ihre-custom-domain.com`
- **⚠️ HINWEIS**: 
  - Wenn nicht gesetzt, wird automatisch `VERCEL_URL` verwendet
  - Nur setzen, wenn Sie eine Custom Domain verwenden
  - Muss mit `https://` beginnen

### 🔐 Optionale Variablen

#### `CRON_SECRET`
- **Beschreibung**: Geheimer Schlüssel zum Schutz von Cron Job Endpoints
- **Verwendung**: Wird für `/api/v1/cron/task-deadlines` verwendet
- **Generierung**: 
  ```bash
  openssl rand -base64 32
  ```
- **⚠️ HINWEIS**: Wenn nicht gesetzt, ist der Cron Job Endpoint ungeschützt

## 🚀 Automatische Variablen (von Vercel gesetzt)

Diese Variablen werden automatisch von Vercel gesetzt und müssen **nicht** manuell konfiguriert werden:

- `VERCEL_URL` - Die URL des Deployments (z.B. `servecta-portal.vercel.app`)
- `VERCEL_ENV` - Die Umgebung (`production`, `preview`, `development`)
- `NODE_ENV` - Wird automatisch auf `production` gesetzt

## 📋 Vercel Dashboard Setup

### Schritt 1: Projekt importieren
1. Gehen Sie zu [vercel.com](https://vercel.com)
2. Klicken Sie auf "Add New Project"
3. Wählen Sie Ihr GitHub Repository aus
4. Importieren Sie das Projekt

### Schritt 2: Environment Variables konfigurieren
1. Gehen Sie zu **Settings → Environment Variables**
2. Fügen Sie die erforderlichen Variablen hinzu:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `CRON_SECRET` (optional)
   - `NEXTAUTH_URL` (optional, wenn Custom Domain)
3. Wählen Sie für jede Variable die Umgebungen aus:
   - ✅ Production
   - ✅ Preview (optional)
   - ✅ Development (optional)

### Schritt 3: Framework Preset
- **Framework Preset**: Next.js (automatisch erkannt)
- **Build Command**: `npm run build` (Standard)
- **Output Directory**: `.next` (Standard)
- **Install Command**: `npm install` (Standard)

### Schritt 4: Node.js Version
- **Node.js Version**: 18.x oder höher (siehe `package.json` engines)

## 🔄 Deployment

Nachdem Sie die Environment Variables konfiguriert haben:

1. **Automatisches Deployment**: 
   - Jeder Push auf den `main` Branch deployed automatisch
   - Preview Deployments werden für Pull Requests erstellt

2. **Manuelles Deployment**:
   - Klicken Sie auf "Deploy" im Vercel Dashboard

3. **Build Logs überprüfen**:
   - Gehen Sie zu "Deployments"
   - Klicken Sie auf das gewünschte Deployment
   - Prüfen Sie die Build Logs auf Fehler

## ✅ Deployment Verifizierung

Nach erfolgreichem Deployment sollten Sie:

1. **Health Check testen**:
   ```bash
   curl https://ihre-app.vercel.app/api/health
   ```

2. **Login testen**:
   - Gehen Sie zu `https://ihre-app.vercel.app/auth/signin`
   - Versuchen Sie sich anzumelden

3. **Environment Variables prüfen**:
   - Die Health API sollte bestätigen, dass `DATABASE_URL` gesetzt ist
 policy

## 🐛 Troubleshooting

### Build Error: "Missing required environment variable"
- **Problem**: Eine erforderliche Environment Variable fehlt
- **Lösung**: Überprüfen Sie, ob alle erforderlichen Variablen im Vercel Dashboard gesetzt sind

### Build Error: "DATABASE_URL is required in production"
- **Problem**: `DATABASE_URL` ist nicht gesetzt
- **Lösung**: Setzen Sie `DATABASE_URL` im Vercel Dashboard unter Settings → Environment Variables

### Runtime Error: "NextAuth Secret is missing"
- **Problem**: `NEXTAUTH_SECRET` ist nicht gesetzt oder zu kurz
- **Lösung**: 
  1. Generieren Sie einen neuen Secret: `openssl rand -base64 32`
  2. Setzen Sie ihn im Vercel Dashboard

### NEXTAUTH_URL falsch
- **Problem**: Fehlerhafte Redirects nach Login
- **Lösung**: 
  - Setzen Sie `NEXTAUTH_URL` auf Ihre vollständige Domain: `https://ihre-domain.com`
  - Oder lassen Sie es leer, damit automatisch `VERCEL_URL` verwendet wird

## 📚 Weitere Ressourcen

- [Vercel Environment Variables Dokumentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

