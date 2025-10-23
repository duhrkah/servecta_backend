'use client'

import AdminLayout from '@/components/admin-layout'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Settings, 
  Mail, 
  Shield, 
  Database, 
  Save, 
  TestTube, 
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemSettings {
  general: {
    companyName: string
    companyEmail: string
    timezone: string
    language: string
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    smtpSecure: boolean
    fromEmail: string
    fromName: string
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    requireTwoFactor: boolean
    passwordMinLength: number
  }
  backup: {
    autoBackup: boolean
    backupFrequency: string
    backupRetention: number
  }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      companyName: '',
      companyEmail: '',
      timezone: 'Europe/Berlin',
      language: 'de'
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: false,
      fromEmail: '',
      fromName: ''
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      passwordMinLength: 8
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/v1/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        throw new Error('Failed to fetch settings')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setError('Fehler beim Laden der Einstellungen')
      
      // Fallback to default settings
      setSettings(prev => ({
        ...prev,
        general: {
          ...prev.general,
          companyName: 'Servecta Admin',
          companyEmail: 'admin@servecta.com'
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })
      
      if (response.ok) {
        toast.success('Einstellungen erfolgreich gespeichert!')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      setTesting(true)
      
      const response = await fetch('/api/v1/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailSettings: settings.email }),
      })
      
      if (response.ok) {
        toast.success('E-Mail-Test erfolgreich!')
      } else {
        throw new Error('Email test failed')
      }
    } catch (error) {
      console.error('Failed to test email:', error)
      toast.error('E-Mail-Test fehlgeschlagen')
    } finally {
      setTesting(false)
    }
  }

  const handleBackup = async () => {
    try {
      setBackingUp(true)
      
      const response = await fetch('/api/v1/settings/backup', {
        method: 'POST',
      })
      
      if (response.ok) {
        toast.success('Backup erfolgreich erstellt!')
      } else {
        throw new Error('Backup failed')
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast.error('Backup fehlgeschlagen')
    } finally {
      setBackingUp(false)
    }
  }

  const handleReset = async () => {
    try {
      await fetchSettings()
      toast.success('Einstellungen zurückgesetzt!')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      toast.error('Fehler beim Zurücksetzen der Einstellungen')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Einstellungen nicht verfügbar</h2>
          <p className="text-muted-foreground mb-4">
            Es werden Standard-Einstellungen angezeigt. {error}
          </p>
          <Button onClick={fetchSettings}>Erneut versuchen</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Systemeinstellungen</h1>
            <p className="text-muted-foreground">
              Konfigurieren Sie System-, E-Mail-, Sicherheits- und Backup-Einstellungen
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Allgemeine Einstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Firmenname</Label>
                <Input
                  id="companyName"
                  value={settings.general.companyName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, companyName: e.target.value }
                  }))}
                  placeholder="Ihr Firmenname"
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Firmen-E-Mail</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.general.companyEmail}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, companyEmail: e.target.value }
                  }))}
                  placeholder="admin@ihrefirma.com"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Zeitzone</Label>
                <Select
                  value={settings.general.timezone}
                  onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, timezone: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Berlin">Europa/Berlin</SelectItem>
                    <SelectItem value="Europe/London">Europa/London</SelectItem>
                    <SelectItem value="Europe/Paris">Europa/Paris</SelectItem>
                    <SelectItem value="America/New_York">Amerika/New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">Amerika/Los Angeles</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asien/Tokio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Sprache</Label>
                <Select
                  value={settings.general.language}
                  onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, language: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                E-Mail-Einstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="smtpHost">SMTP-Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.email.smtpHost}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpHost: e.target.value }
                  }))}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">SMTP-Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.email.smtpPort}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpPort: parseInt(e.target.value) || 587 }
                  }))}
                  placeholder="587"
                />
              </div>
              <div>
                <Label htmlFor="smtpUser">SMTP-Benutzername</Label>
                <Input
                  id="smtpUser"
                  value={settings.email.smtpUser}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpUser: e.target.value }
                  }))}
                  placeholder="ihr@email.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPassword">SMTP-Passwort</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpPassword: e.target.value }
                  }))}
                  placeholder="Ihr Passwort"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.email.smtpSecure}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpSecure: checked }
                  }))}
                />
                <Label>SSL/TLS verwenden</Label>
              </div>
              <div>
                <Label htmlFor="fromEmail">Absender-E-Mail</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, fromEmail: e.target.value }
                  }))}
                  placeholder="noreply@ihrefirma.com"
                />
              </div>
              <div>
                <Label htmlFor="fromName">Absender-Name</Label>
                <Input
                  id="fromName"
                  value={settings.email.fromName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, fromName: e.target.value }
                  }))}
                  placeholder="Ihre Firma"
                />
              </div>
              <Button 
                onClick={handleTestEmail} 
                variant="outline" 
                className="w-full"
                disabled={testing}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? 'Teste...' : 'E-Mail-Verbindung testen'}
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Sicherheitseinstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sessionTimeout">Session-Timeout (Minuten)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, sessionTimeout: parseInt(e.target.value) || 30 }
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nach dieser Zeit wird der Benutzer automatisch abgemeldet
                </p>
              </div>
              <div>
                <Label htmlFor="maxLoginAttempts">Max. Anmeldeversuche</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) || 5 }
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nach dieser Anzahl fehlgeschlagener Versuche wird das Konto gesperrt
                </p>
              </div>
              <div>
                <Label htmlFor="passwordMinLength">Min. Passwortlänge</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  min="6"
                  max="32"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, passwordMinLength: parseInt(e.target.value) || 8 }
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mindestlänge für neue Passwörter
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.security.requireTwoFactor}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, requireTwoFactor: checked }
                  }))}
                />
                <Label>Zwei-Faktor-Authentifizierung erforderlich</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Alle Benutzer müssen 2FA aktivieren, um sich anzumelden
              </p>
            </CardContent>
          </Card>

          {/* Backup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Backup-Einstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.backup.autoBackup}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    backup: { ...prev.backup, autoBackup: checked }
                  }))}
                />
                <Label>Automatische Backups</Label>
              </div>
              <div>
                <Label htmlFor="backupFrequency">Backup-Häufigkeit</Label>
                <Select
                  value={settings.backup.backupFrequency}
                  onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    backup: { ...prev.backup, backupFrequency: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="backupRetention">Backup-Aufbewahrung (Tage)</Label>
                <Input
                  id="backupRetention"
                  type="number"
                  min="7"
                  max="365"
                  value={settings.backup.backupRetention}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    backup: { ...prev.backup, backupRetention: parseInt(e.target.value) || 30 }
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Backups älter als diese Anzahl von Tagen werden automatisch gelöscht
                </p>
              </div>
              <Button 
                onClick={handleBackup} 
                variant="outline"
                disabled={backingUp}
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                {backingUp ? 'Erstelle Backup...' : 'Backup jetzt erstellen'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              System-Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-sm font-medium">E-Mail-Konfiguration</div>
                <div className="text-xs text-muted-foreground">
                  {settings.email.smtpHost ? 'Konfiguriert' : 'Nicht konfiguriert'}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-sm font-medium">Sicherheit</div>
                <div className="text-xs text-muted-foreground">
                  {settings.security.requireTwoFactor ? '2FA aktiviert' : 'Standard-Sicherheit'}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-sm font-medium">Backup</div>
                <div className="text-xs text-muted-foreground">
                  {settings.backup.autoBackup ? 'Automatisch aktiviert' : 'Manuell'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}