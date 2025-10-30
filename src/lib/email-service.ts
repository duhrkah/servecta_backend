import { getNextAuthUrl, env } from '@/lib/env'

interface GraphSendMailMessage {
  message: {
    subject: string
    body: { contentType: 'HTML' | 'Text'; content: string }
    toRecipients: Array<{ emailAddress: { address: string; name?: string } }>
    from?: { emailAddress: { address: string } }
  }
  saveToSentItems?: boolean
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface TaskNotificationData {
  taskTitle: string
  taskDescription?: string
  dueDate: string
  assigneeName: string
  assigneeEmail: string
  projectName?: string
  customerName?: string
  daysUntilDue: number
}

interface TicketNotificationData {
  ticketTitle: string
  ticketDescription?: string
  ticketStatus: string
  ticketPriority: string
  assigneeName?: string
  assigneeEmail?: string
  customerName?: string
  customerEmail?: string
  changedBy: string
  changeType: 'status' | 'priority' | 'assignee' | 'description' | 'general'
  changeDetails?: string
}

class EmailService {
  constructor() {}

  private async getAccessToken(): Promise<string> {
    const tenantId = env.MICROSOFT_TENANT_ID
    const clientId = env.MICROSOFT_CLIENT_ID
    const clientSecret = env.MICROSOFT_CLIENT_SECRET

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Microsoft Graph Credentials fehlen (TENANT_ID/CLIENT_ID/CLIENT_SECRET)')
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    const body = new URLSearchParams()
    body.set('client_id', clientId)
    body.set('client_secret', clientSecret)
    body.set('grant_type', 'client_credentials')
    body.set('scope', 'https://graph.microsoft.com/.default')

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Token Fetch fehlgeschlagen: ${res.status} ${text}`)
    }
    const json = await res.json() as { access_token: string }
    return json.access_token
  }

  private async sendViaGraph(to: string[], subject: string, html: string, text: string): Promise<void> {
    const fromEmail = env.MICROSOFT_FROM_EMAIL || env.CONTACT_EMAIL
    if (!fromEmail) {
      throw new Error('MICROSOFT_FROM_EMAIL oder CONTACT_EMAIL muss gesetzt sein')
    }

    const accessToken = await this.getAccessToken()

    const payload: GraphSendMailMessage = {
      message: {
        subject,
        body: { contentType: 'HTML', content: html || text },
        toRecipients: to.map(address => ({ emailAddress: { address } })),
        from: { emailAddress: { address: fromEmail } }
      },
      saveToSentItems: false
    }

    // Verwende die user-scoped sendMail-Route mit der From-Adresse
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromEmail)}/sendMail`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const textBody = await res.text()
      throw new Error(`Graph sendMail fehlgeschlagen: ${res.status} ${textBody}`)
    }
  }

  private createTaskDeadlineTemplate(data: TaskNotificationData): EmailTemplate {
    const urgencyText = data.daysUntilDue === 0 ? 'HEUTE FÄLLIG' : 
                       data.daysUntilDue === 1 ? 'MORGEN FÄLLIG' : 
                       `${data.daysUntilDue} TAGE FÄLLIG`
    
    const urgencyColor = data.daysUntilDue === 0 ? '#dc2626' : 
                        data.daysUntilDue === 1 ? '#ea580c' : '#d97706'

    return {
      subject: `⚠️ Aufgabe fällig: ${data.taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Aufgabe fällig</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">⚠️ ${urgencyText}</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; margin-top: 0;">${data.taskTitle}</h2>
              
              ${data.taskDescription ? `<p style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid ${urgencyColor};"><strong>Beschreibung:</strong><br>${data.taskDescription}</p>` : ''}
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>📅 Fälligkeitsdatum:</strong> ${new Date(data.dueDate).toLocaleDateString('de-DE')}</p>
                <p style="margin: 5px 0;"><strong>👤 Zugewiesen an:</strong> ${data.assigneeName}</p>
                ${data.projectName ? `<p style="margin: 5px 0;"><strong>📋 Projekt:</strong> ${data.projectName}</p>` : ''}
                ${data.customerName ? `<p style="margin: 5px 0;"><strong>🏢 Kunde:</strong> ${data.customerName}</p>` : ''}
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${getNextAuthUrl()}/portal/tasks" 
                   style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Aufgabe anzeigen
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Diese Benachrichtigung wurde automatisch generiert, da eine Ihnen zugewiesene Aufgabe fällig ist.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
⚠️ ${urgencyText}: ${data.taskTitle}

Beschreibung: ${data.taskDescription || 'Keine Beschreibung verfügbar'}

📅 Fälligkeitsdatum: ${new Date(data.dueDate).toLocaleDateString('de-DE')}
👤 Zugewiesen an: ${data.assigneeName}
${data.projectName ? `📋 Projekt: ${data.projectName}` : ''}
${data.customerName ? `🏢 Kunde: ${data.customerName}` : ''}

Besuchen Sie: ${getNextAuthUrl()}/portal/tasks

Diese Benachrichtigung wurde automatisch generiert.
      `
    }
  }

  private createTicketNotificationTemplate(data: TicketNotificationData): EmailTemplate {
    const statusColors = {
      'OPEN': '#3b82f6',
      'IN_PROGRESS': '#f59e0b', 
      'RESOLVED': '#10b981',
      'CLOSED': '#6b7280',
      'CANCELLED': '#ef4444'
    }

    const priorityColors = {
      'LOW': '#6b7280',
      'MEDIUM': '#f59e0b',
      'HIGH': '#f97316',
      'URGENT': '#dc2626'
    }

    const statusText = {
      'OPEN': 'Offen',
      'IN_PROGRESS': 'In Bearbeitung',
      'RESOLVED': 'Gelöst',
      'CLOSED': 'Geschlossen',
      'CANCELLED': 'Storniert'
    }

    const priorityText = {
      'LOW': 'Niedrig',
      'MEDIUM': 'Mittel',
      'HIGH': 'Hoch',
      'URGENT': 'Dringend'
    }

    return {
      subject: `🎫 Ticket aktualisiert: ${data.ticketTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket aktualisiert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎫 Ticket aktualisiert</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; margin-top: 0;">${data.ticketTitle}</h2>
              
              ${data.ticketDescription ? `<p style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;"><strong>Beschreibung:</strong><br>${data.ticketDescription}</p>` : ''}
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                  <div style="flex: 1;">
                    <p style="margin: 5px 0;"><strong>Status:</strong></p>
                    <span style="background: ${statusColors[data.ticketStatus as keyof typeof statusColors]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                      ${statusText[data.ticketStatus as keyof typeof statusText]}
                    </span>
                  </div>
                  <div style="flex: 1;">
                    <p style="margin: 5px 0;"><strong>Priorität:</strong></p>
                    <span style="background: ${priorityColors[data.ticketPriority as keyof typeof priorityColors]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                      ${priorityText[data.ticketPriority as keyof typeof priorityText]}
                    </span>
                  </div>
                </div>
                
                ${data.assigneeName ? `<p style="margin: 5px 0;"><strong>👤 Zugewiesen an:</strong> ${data.assigneeName}</p>` : ''}
                ${data.customerName ? `<p style="margin: 5px 0;"><strong>🏢 Kunde:</strong> ${data.customerName}</p>` : ''}
                <p style="margin: 5px 0;"><strong>✏️ Geändert von:</strong> ${data.changedBy}</p>
                ${data.changeDetails ? `<p style="margin: 5px 0;"><strong>📝 Änderungsdetails:</strong> ${data.changeDetails}</p>` : ''}
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${getNextAuthUrl()}/portal/tickets" 
                   style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Ticket anzeigen
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Diese Benachrichtigung wurde automatisch generiert, da ein Ticket aktualisiert wurde.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
🎫 Ticket aktualisiert: ${data.ticketTitle}

Beschreibung: ${data.ticketDescription || 'Keine Beschreibung verfügbar'}

Status: ${statusText[data.ticketStatus as keyof typeof statusText]}
Priorität: ${priorityText[data.ticketPriority as keyof typeof priorityText]}
${data.assigneeName ? `Zugewiesen an: ${data.assigneeName}` : ''}
${data.customerName ? `Kunde: ${data.customerName}` : ''}
Geändert von: ${data.changedBy}
${data.changeDetails ? `Änderungsdetails: ${data.changeDetails}` : ''}

Besuchen Sie: ${getNextAuthUrl()}/portal/tickets

Diese Benachrichtigung wurde automatisch generiert.
      `
    }
  }

  async sendTaskDeadlineNotification(data: TaskNotificationData): Promise<boolean> {
    try {
      const template = this.createTaskDeadlineTemplate(data)
      await this.sendViaGraph([data.assigneeEmail], template.subject, template.html, template.text)

      console.log(`Task deadline notification sent to ${data.assigneeEmail}`)
      return true
    } catch (error) {
      console.error('Failed to send task deadline notification:', error)
      return false
    }
  }

  async sendTicketNotification(data: TicketNotificationData): Promise<boolean> {
    try {
      const template = this.createTicketNotificationTemplate(data)
      const recipients = []

      // Staff-Benachrichtigung
      if (data.assigneeEmail) {
        recipients.push(data.assigneeEmail)
      }

      // Kunden-Benachrichtigung
      if (data.customerEmail) {
        recipients.push(data.customerEmail)
      }

      if (recipients.length === 0) {
        console.log('No recipients for ticket notification')
        return false
      }
      await this.sendViaGraph(recipients, template.subject, template.html, template.text)

      console.log(`Ticket notification sent to: ${recipients.join(', ')}`)
      return true
    } catch (error) {
      console.error('Failed to send ticket notification:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Prüfe nur Token-Abruf als Verbindungs-Test
      await this.getAccessToken()
      return true
    } catch (error) {
      console.error('Email service connection failed:', error)
      return false
    }
  }
}

export const emailService = new EmailService()
export type { TaskNotificationData, TicketNotificationData }
