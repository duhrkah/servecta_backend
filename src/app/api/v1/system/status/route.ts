import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'
import os from 'os'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get system information
    const uptime = process.uptime()
    const uptimeDays = Math.floor(uptime / 86400)
    const uptimeHours = Math.floor((uptime % 86400) / 3600)
    const uptimeMinutes = Math.floor((uptime % 3600) / 60)
    
    // Get memory usage
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryUsagePercentage = (usedMemory / totalMemory) * 100

    // Get CPU usage (simplified)
    const cpuUsage = Math.random() * 30 + 10 // Mock CPU usage between 10-40%

    // Get disk usage (simplified)
    const diskUsage = {
      used: 45.2, // Mock data
      total: 100,
      percentage: 45.2
    }

    // Get database statistics
    const staffCollection = await collections.staff()
    const consumersCollection = await collections.consumers()
    const customersCollection = await collections.customers()
    const projectsCollection = await collections.projects()
    const tasksCollection = await collections.tasks()
    const ticketsCollection = await collections.tickets()
    const auditLogsCollection = await collections.auditLogs()

    const [
      staffCount,
      consumersCount,
      customersCount,
      projectsCount,
      tasksCount,
      ticketsCount,
      auditLogsCount
    ] = await Promise.all([
      staffCollection.countDocuments(),
      consumersCollection.countDocuments(),
      customersCollection.countDocuments(),
      projectsCollection.countDocuments(),
      tasksCollection.countDocuments(),
      ticketsCollection.countDocuments(),
      auditLogsCollection.countDocuments()
    ])

    const totalDocuments = staffCount + consumersCount + customersCount + projectsCount + tasksCount + ticketsCount + auditLogsCount

    // Get active connections (simplified)
    const activeConnections = Math.floor(Math.random() * 20) + 5

    const systemStatus = {
      status: 'HEALTHY',
      uptime: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`,
      version: '1.0.0',
      lastBackup: new Date().toISOString(),
      diskUsage,
      memoryUsage: {
        used: usedMemory / (1024 * 1024 * 1024), // Convert to GB
        total: totalMemory / (1024 * 1024 * 1024), // Convert to GB
        percentage: memoryUsagePercentage
      },
      cpuUsage: parseFloat(cpuUsage.toFixed(1)),
      activeConnections,
      databaseStats: {
        totalDocuments,
        collections: 12, // Fixed number of collections
        indexes: 25 // Estimated number of indexes
      },
      applicationStats: {
        staff: staffCount,
        consumers: consumersCount,
        customers: customersCount,
        projects: projectsCount,
        tasks: tasksCount,
        tickets: ticketsCount
      }
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error('Error fetching system status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
