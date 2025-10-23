import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, testEmail } = body

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email is required' }, { status: 400 })
    }

    // Check if email settings are configured
    const { collections } = await import('@/lib/mongodb')
    const settingsCollection = await collections.settings()
    const settings = await settingsCollection.findOne({ type: 'system' })

    if (!settings?.emailSettings?.smtpHost) {
      return NextResponse.json({ 
        error: 'Email settings not configured. Please configure SMTP settings first.' 
      }, { status: 400 })
    }

    if (type === 'task-deadline') {
      const success = await emailService.sendTaskDeadlineNotification({
        taskTitle: 'Test-Aufgabe für E-Mail-Benachrichtigung',
        taskDescription: 'Dies ist eine Test-Aufgabe, um die E-Mail-Benachrichtigung zu testen.',
        dueDate: new Date().toISOString(),
        assigneeName: 'Test-Benutzer',
        assigneeEmail: testEmail,
        projectName: 'Test-Projekt',
        customerName: 'Test-Kunde',
        daysUntilDue: 0
      })

      return NextResponse.json({ 
        success,
        message: success ? 'Task deadline test email sent successfully' : 'Failed to send task deadline test email'
      })
    }

    if (type === 'ticket-notification') {
      const success = await emailService.sendTicketNotification({
        ticketTitle: 'Test-Ticket für E-Mail-Benachrichtigung',
        ticketDescription: 'Dies ist ein Test-Ticket, um die E-Mail-Benachrichtigung zu testen.',
        ticketStatus: 'IN_PROGRESS',
        ticketPriority: 'HIGH',
        assigneeName: 'Test-Bearbeiter',
        assigneeEmail: testEmail,
        customerName: 'Test-Kunde',
        customerEmail: testEmail,
        changedBy: 'Test-Benutzer',
        changeType: 'status',
        changeDetails: 'Status geändert von "OPEN" zu "IN_PROGRESS"'
      })

      return NextResponse.json({ 
        success,
        message: success ? 'Ticket notification test email sent successfully' : 'Failed to send ticket notification test email'
      })
    }

    return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const isConnected = await emailService.testConnection()
    return NextResponse.json({
      connected: isConnected,
      message: isConnected ? 'Email service is working' : 'Email service connection failed',
      usage: {
        testTaskDeadline: 'POST with { "type": "task-deadline", "testEmail": "email@example.com" }',
        testTicketNotification: 'POST with { "type": "ticket-notification", "testEmail": "email@example.com" }'
      }
    })
  } catch (error) {
    console.error('Email service test error:', error)
    return NextResponse.json({ 
      connected: false,
      message: 'Email service test failed'
    }, { status: 500 })
  }
}
