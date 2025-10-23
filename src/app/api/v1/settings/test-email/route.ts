import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  let user: any = null
  
  try {
    user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emailSettings } = await request.json()
    
    if (!emailSettings) {
      return NextResponse.json(
        { error: 'Email settings are required' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort,
      secure: emailSettings.smtpSecure,
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPassword,
      },
    })

    // Test email configuration
    await transporter.verify()

    // Send test email
    const testEmail = {
      from: `${emailSettings.fromName} <${emailSettings.fromEmail}>`,
      to: user.email,
      subject: 'E-Mail-Konfiguration Test',
      html: `
        <h2>E-Mail-Konfiguration erfolgreich!</h2>
        <p>Dies ist eine Test-E-Mail von Ihrem Servecta Admin System.</p>
        <p><strong>Konfiguration:</strong></p>
        <ul>
          <li>SMTP-Host: ${emailSettings.smtpHost}</li>
          <li>SMTP-Port: ${emailSettings.smtpPort}</li>
          <li>SSL/TLS: ${emailSettings.smtpSecure ? 'Ja' : 'Nein'}</li>
          <li>Absender: ${emailSettings.fromName} &lt;${emailSettings.fromEmail}&gt;</li>
        </ul>
        <p>Zeitstempel: ${new Date().toLocaleString('de-DE')}</p>
      `
    }

    await transporter.sendMail(testEmail)

    // Log the email test
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'TEST',
      entityType: 'EMAIL',
      entityId: 'smtp-config',
      userId: user.id,
      userEmail: user.email,
      changes: { emailSettings: { ...emailSettings, smtpPassword: '[HIDDEN]' } },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Email test successful' 
    })
  } catch (error) {
    console.error('Error testing email:', error)
    
    // Log the failed email test
    try {
      const auditLogsCollection = await collections.auditLogs()
      await auditLogsCollection.insertOne({
        action: 'TEST_FAILED',
        entityType: 'EMAIL',
        entityId: 'smtp-config',
        userId: user?.id || 'unknown',
        userEmail: user?.email || 'unknown',
        changes: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      })
    } catch (logError) {
      console.error('Error logging failed email test:', logError)
    }

    return NextResponse.json(
      { error: 'Email test failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
