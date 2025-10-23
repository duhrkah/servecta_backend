import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const entityType = searchParams.get('entityType') || ''
    const action = searchParams.get('action') || ''
    const dateRange = searchParams.get('dateRange') || ''

    const auditLogsCollection = await collections.auditLogs()
    
    // Build query
    const query: any = {}
    
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
      ]
    }
    
    if (entityType) {
      query.entityType = entityType
    }
    
    if (action) {
      query.action = action
    }
    
    if (dateRange) {
      const now = new Date()
      let startDate: Date
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }
      
      query.timestamp = { $gte: startDate }
    }

    // Get total count
    const total = await auditLogsCollection.countDocuments(query)
    
    // Calculate pagination
    const skip = (page - 1) * limit
    const pages = Math.ceil(total / limit)
    
    // Fetch audit logs with pagination
    const logs = await auditLogsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
