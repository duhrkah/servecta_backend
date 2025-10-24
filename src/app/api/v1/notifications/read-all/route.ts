import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
import { getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections } from '@/lib/mongodb'

// Force dynamic rendering

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationsCollection = await collections.notifications()

    // Mark all notifications as read for the current user
    const result = await notificationsCollection.updateMany(
      { 
        userId: user.id,
        read: false 
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    )

    return NextResponse.json({ 
      success: true,
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
