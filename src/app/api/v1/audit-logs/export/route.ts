import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Force dynamic rendering

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

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') || ''
    const action = searchParams.get('action') || ''
    const dateRange = searchParams.get('dateRange') || ''

    const auditLogsCollection = await collections.auditLogs()
    
    // Build query (same as GET route)
    const query: any = {}
    
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

    // Fetch all audit logs for export
    const logs = await auditLogsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .toArray()

    // Convert to CSV
    const csvHeaders = [
      'Timestamp',
      'User Email',
      'Action',
      'Entity Type',
      'Entity ID',
      'IP Address',
      'Details'
    ].join(',')

    const csvRows = logs.map(log => [
      log.timestamp,
      log.userEmail,
      log.action,
      log.entityType,
      log.entityId,
      log.ipAddress,
      log.changes ? JSON.stringify(log.changes) : ''
    ].map(field => `"${field}"`).join(','))

    const csvContent = [csvHeaders, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
