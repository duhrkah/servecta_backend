import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settingsCollection = await collections.settings()
    
    // Get settings document or create default one
    let settingsDoc = await settingsCollection.findOne({ type: 'system' })
    
    if (!settingsDoc) {
      // Create default settings
      const defaultSettings = {
        type: 'system',
        general: {
          companyName: 'Servecta Admin',
          companyEmail: 'admin@servecta.com',
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
        emailSettings: {
          smtpHost: '',
          smtpPort: '587',
          smtpUser: '',
          smtpPass: '',
          smtpFrom: '',
          smtpSecure: false,
          notificationsEnabled: true,
          taskDeadlineNotifications: true,
          ticketNotifications: true
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
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await settingsCollection.insertOne(defaultSettings)
      settingsDoc = { ...defaultSettings, _id: new ObjectId() }
    }

    return NextResponse.json({ settings: settingsDoc })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const settingsCollection = await collections.settings()
    
    // Get current settings
    let currentSettings = await settingsCollection.findOne({ type: 'system' })
    
    if (!currentSettings) {
      // Create default settings if none exist
      const defaultSettings = {
        type: 'system',
        general: {
          companyName: 'Servecta Admin',
          companyEmail: 'admin@servecta.com',
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
        emailSettings: {
          smtpHost: '',
          smtpPort: '587',
          smtpUser: '',
          smtpPass: '',
          smtpFrom: '',
          smtpSecure: false,
          notificationsEnabled: true,
          taskDeadlineNotifications: true,
          ticketNotifications: true
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
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await settingsCollection.insertOne(defaultSettings)
      currentSettings = await settingsCollection.findOne({ type: 'system' })
    }

    // Update specific sections
    const updateData: any = { updatedAt: new Date() }
    
    if (body.general && currentSettings) {
      updateData.general = { ...currentSettings.general, ...body.general }
    }
    
    if (body.email && currentSettings) {
      updateData.email = { ...currentSettings.email, ...body.email }
    }
    
    if (body.emailSettings && currentSettings) {
      updateData.emailSettings = { ...currentSettings.emailSettings, ...body.emailSettings }
    }
    
    if (body.security && currentSettings) {
      updateData.security = { ...currentSettings.security, ...body.security }
    }
    
    if (body.backup && currentSettings) {
      updateData.backup = { ...currentSettings.backup, ...body.backup }
    }

    // Update settings document
    const result = await settingsCollection.updateOne(
      { type: 'system' },
      { $set: updateData },
      { upsert: true }
    )

    // Log the settings update
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'UPDATE',
      entityType: 'SETTINGS',
      entityId: 'system',
      userId: user._id,
      userEmail: user.email,
      changes: { 
        before: currentSettings,
        after: { ...currentSettings, ...updateData }
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
