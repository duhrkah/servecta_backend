import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const notificationsCollection = await collections.notifications()
    
    // Create test notifications for all users (development only)
    const testNotifications = [
      {
        userId: 'all-users', // Special ID for all users
        type: 'success',
        title: 'System-Update verfügbar',
        message: 'Ein neues System-Update ist verfügbar. Bitte starten Sie das System neu.',
        actionUrl: '/portal/system',
        read: false,
        timestamp: new Date(),
        createdAt: new Date()
      },
      {
        userId: 'all-users',
        type: 'info',
        title: 'Wartungsarbeiten geplant',
        message: 'Geplante Wartungsarbeiten am Wochenende von 02:00-04:00 Uhr.',
        actionUrl: '/portal/system',
        read: false,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        createdAt: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        userId: 'all-users',
        type: 'warning',
        title: 'Speicherplatz niedrig',
        message: 'Der verfügbare Speicherplatz ist unter 20%. Bitte bereinigen Sie alte Dateien.',
        actionUrl: '/portal/system',
        read: false,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      }
    ]

    // Insert test notifications
    const result = await notificationsCollection.insertMany(testNotifications)

    return NextResponse.json({
      success: true,
      message: 'Global test notifications created',
      count: result.insertedCount,
      userId: 'all-users'
    })
  } catch (error) {
    console.error('Error creating global test notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
