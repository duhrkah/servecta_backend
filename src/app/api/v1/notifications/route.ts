import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
import { getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections } from '@/lib/mongodb'

// Force dynamic rendering

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationsCollection = await collections.notifications()
    
    // Get notifications for the current user and global notifications
    const notifications = await notificationsCollection
      .find({ 
        $or: [
          { userId: user.id },
          { userId: 'all-users' } // Include global notifications
        ]
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray()

    // Count unread notifications (including global ones)
    const unreadCount = await notificationsCollection.countDocuments({
      $or: [
        { userId: user.id, read: false },
        { userId: 'all-users', read: false }
      ]
    })

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
