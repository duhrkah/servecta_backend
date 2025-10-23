import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (type === 'task-deadline') {
      const success = await emailService.sendTaskDeadlineNotification(data)
      return NextResponse.json({ success })
    }

    if (type === 'ticket-notification') {
      const success = await emailService.sendTicketNotification(data)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
  } catch (error) {
    console.error('Email notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const isConnected = await emailService.testConnection()
    return NextResponse.json({ 
      connected: isConnected,
      message: isConnected ? 'Email service is working' : 'Email service connection failed'
    })
  } catch (error) {
    console.error('Email service test error:', error)
    return NextResponse.json({ 
      connected: false,
      message: 'Email service test failed'
    }, { status: 500 })
  }
}
