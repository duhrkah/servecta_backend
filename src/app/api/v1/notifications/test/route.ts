import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
import { getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections } from '@/lib/mongodb'

// Force dynamic rendering

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationsCollection = await collections.notifications()
    
    // Create some test notifications for the current user
    const testUserId = user.id // Use the current user's ID
    
    const testNotifications = [
      {
        userId: testUserId,
        type: 'success',
        title: 'Neues Projekt erstellt',
        message: 'Das Projekt "Website-Redesign" wurde erfolgreich erstellt.',
        actionUrl: '/portal/projects',
        read: false,
        timestamp: new Date(),
        createdAt: new Date()
      },
      {
        userId: testUserId,
        type: 'warning',
        title: 'Überfällige Aufgabe',
        message: 'Die Aufgabe "Datenbank-Backup" ist überfällig.',
        actionUrl: '/portal/tasks',
        read: false,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        userId: testUserId,
        type: 'info',
        title: 'Neues Ticket',
        message: 'Ein neues Support-Ticket wurde erstellt.',
        actionUrl: '/portal/tickets',
        read: false,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        userId: testUserId,
        type: 'error',
        title: 'System-Warnung',
        message: 'Hohe CPU-Auslastung auf dem Server erkannt.',
        actionUrl: '/portal/system',
        read: true,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ]

    // Insert test notifications
    const result = await notificationsCollection.insertMany(testNotifications)

    return NextResponse.json({
      success: true,
      message: 'Test notifications created',
      count: result.insertedCount,
      userId: testUserId
    })
  } catch (error) {
    console.error('Error creating test notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
