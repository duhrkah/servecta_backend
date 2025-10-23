'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Mail, Send, TestTube, Settings, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface EmailSettings {
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  smtpSecure: boolean
  notificationsEnabled: boolean
  taskDeadlineNotifications: boolean
  ticketNotifications: boolean
}

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    smtpSecure: false,
    notificationsEnabled: true,
    taskDeadlineNotifications: true,
    ticketNotifications: true
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown')

  useEffect(() => {
    fetchSettings()
    testConnection()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/v1/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings && data.settings.emailSettings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings.emailSettings
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const testConnection = async () => {
    try {
      const response = await fetch('/api/v1/email/test')
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'failed')
        
        // Show warning for common SSL/Port issues
        if (!data.connected && data.message?.includes('SSL')) {
          toast.warning('SSL-Fehler erkannt. Port 587 sollte SSL: Nein haben, Port 465 sollte SSL: Ja haben.')
        }
      } else {
        setConnectionStatus('failed')
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
      setConnectionStatus('failed')
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailSettings: settings
        }),
      })

      if (response.ok) {
        toast.success('E-Mail-Einstellungen erfolgreich gespeichert!')
        await testConnection()
      } else {
        const errorData = await response.json()
        console.error('Settings API error:', errorData)
        toast.error(`Fehler beim Speichern: ${errorData.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async (type: 'task-deadline' | 'ticket-notification') => {
    setTesting(true)
    try {
      const response = await fetch('/api/v1/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          testEmail: settings.smtpUser
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success(`${type === 'task-deadline' ? 'Aufgaben-Benachrichtigung' : 'Ticket-Benachrichtigung'} Test-E-Mail erfolgreich gesendet!`)
        } else {
          toast.error('Fehler beim Senden der Test-E-Mail')
        }
      } else {
        toast.error('Fehler beim Senden der Test-E-Mail')
      }
    } catch (error) {
      console.error('Failed to send test email:', error)
      toast.error('Fehler beim Senden der Test-E-Mail')
    } finally {
      setTesting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">E-Mail-Einstellungen</h1>
            <p className="text-muted-foreground">
              Konfigurieren Sie E-Mail-Benachrichtigungen für Tickets und Aufgaben
            </p>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Verbunden</span>
              </div>
            )}
            {connectionStatus === 'failed' && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Verbindung fehlgeschlagen</span>
              </div>
            )}
            <Button onClick={testConnection} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Verbindung testen
            </Button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }} className="grid gap-6">
          {/* SMTP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                SMTP-Konfiguration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP-Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP-Port</Label>
                  <Input
                    id="smtpPort"
                    value={settings.smtpPort}
                    onChange={(e) => {
                      const port = e.target.value
                      setSettings(prev => {
                        const newSettings = { ...prev, smtpPort: port }
                        // Auto-correct SSL based on port
                        if (port === '465') {
                          newSettings.smtpSecure = true
                        } else if (port === '587') {
                          newSettings.smtpSecure = false
                        }
                        return newSettings
                      })
                    }}
                    placeholder="587"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Port 587 (STARTTLS) oder 465 (SSL)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUser">Benutzername</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPass">Passwort</Label>
                  <Input
                    id="smtpPass"
                    type="password"
                    value={settings.smtpPass}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpFrom">Absender-E-Mail</Label>
                  <Input
                    id="smtpFrom"
                    value={settings.smtpFrom}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpFrom: e.target.value }))}
                    placeholder="noreply@servecta.de"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtpSecure"
                    checked={settings.smtpSecure}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smtpSecure: checked }))}
                  />
                  <Label htmlFor="smtpSecure">SSL/TLS verwenden</Label>
                  <p className="text-xs text-muted-foreground">
                    Port 465: Ja | Port 587: Nein
                  </p>
                  {settings.smtpPort === '587' && settings.smtpSecure && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Port 587 sollte SSL: Nein haben
                    </p>
                  )}
                  {settings.smtpPort === '465' && !settings.smtpSecure && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Port 465 sollte SSL: Ja haben
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Benachrichtigungseinstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificationsEnabled">E-Mail-Benachrichtigungen aktivieren</Label>
                  <p className="text-sm text-muted-foreground">
                    Globale Einstellung für alle E-Mail-Benachrichtigungen
                  </p>
                </div>
                <Switch
                  id="notificationsEnabled"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="taskDeadlineNotifications">Aufgaben-Fälligkeitsbenachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigungen für Aufgaben, die in 3, 1 oder 0 Tagen fällig sind
                  </p>
                </div>
                <Switch
                  id="taskDeadlineNotifications"
                  checked={settings.taskDeadlineNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, taskDeadlineNotifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ticketNotifications">Ticket-Änderungsbenachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigungen bei Änderungen an Tickets (Status, Priorität, Zuweisung)
                  </p>
                </div>
                <Switch
                  id="ticketNotifications"
                  checked={settings.ticketNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, ticketNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Konfigurationshilfe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Gmail (empfohlen)</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Host: <code>smtp.gmail.com</code></li>
                  <li>• Port: <code>587</code> (SSL: Nein) oder <code>465</code> (SSL: Ja)</li>
                  <li>• App-Passwort erforderlich (nicht normales Passwort!)</li>
                  <li>• 2-Faktor-Authentifizierung muss aktiviert sein</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Outlook/Hotmail</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Host: <code>smtp-mail.outlook.com</code></li>
                  <li>• Port: <code>587</code> (SSL: Nein)</li>
                  <li>• Normales Passwort verwenden</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Häufige Probleme</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• SSL-Fehler: Port 587 = SSL Nein, Port 465 = SSL Ja</li>
                  <li>• Authentifizierung fehlgeschlagen: App-Passwort verwenden</li>
                  <li>• Verbindung timeout: Firewall/ISP-Einstellungen prüfen</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Test Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                E-Mail-Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Testen Sie die E-Mail-Funktionalität mit Beispiel-Benachrichtigungen
              </p>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => sendTestEmail('task-deadline')} 
                  disabled={testing || !settings.smtpUser}
                  variant="outline"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Aufgaben-Benachrichtigung testen
                </Button>
                
                <Button 
                  onClick={() => sendTestEmail('ticket-notification')} 
                  disabled={testing || !settings.smtpUser}
                  variant="outline"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Ticket-Benachrichtigung testen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Einstellungen speichern'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
