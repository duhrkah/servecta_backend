import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, title, message, actionUrl } = await request.json()
    
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      )
    }

    const notificationsCollection = await collections.notifications()
    
    const notification = {
      userId: user.id,
      type: type || 'info',
      title,
      message,
      actionUrl: actionUrl || null,
      read: false,
      timestamp: new Date(),
      createdAt: new Date()
    }

    const result = await notificationsCollection.insertOne(notification)

    return NextResponse.json({
      success: true,
      notification: {
        _id: result.insertedId,
        ...notification
      }
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
