import { NextRequest, NextResponse } from 'next/server'
import { collections, findUserById } from '@/lib/mongodb'
import { emailService } from '@/lib/email-service'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (optional security check)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasksCollection = await collections.tasks()
    const today = new Date()
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000))
    const oneDayFromNow = new Date(today.getTime() + (24 * 60 * 60 * 1000))

    // Find tasks due in 3 days, 1 day, or today
    const tasks = await tasksCollection.find({
      dueDate: { $exists: true, $ne: null },
      status: { $nin: ['DONE', 'COMPLETED', 'CANCELLED'] },
      assigneeId: { $exists: true, $ne: null }
    }).toArray()

    const notificationsSent = []

    for (const task of tasks) {
      if (!task.dueDate || !task.assigneeId) continue

      const dueDate = new Date(task.dueDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

      // Only notify for 3 days, 1 day, or today
      if (daysUntilDue === 3 || daysUntilDue === 1 || daysUntilDue === 0) {
        try {
          // Get assignee information
          const assignee = await findUserById(task.assigneeId)
          if (!assignee || !assignee.email) continue

          // Get project information
          let projectName = ''
          if (task.projectId) {
            const projectsCollection = await collections.projects()
            const project = await projectsCollection.findOne({ _id: new ObjectId(task.projectId) })
            if (project) {
              projectName = project.name
            }
          }

          // Get customer information
          let customerName = ''
          if (task.customerId) {
            const customersCollection = await collections.customers()
            const customer = await customersCollection.findOne({ _id: new ObjectId(task.customerId) })
            if (customer) {
              customerName = customer.legalName || customer.tradeName || 'Unbekannter Kunde'
            }
          }

          // Send notification
          const success = await emailService.sendTaskDeadlineNotification({
            taskTitle: task.title,
            taskDescription: task.description,
            dueDate: task.dueDate,
            assigneeName: assignee.name,
            assigneeEmail: assignee.email,
            projectName,
            customerName,
            daysUntilDue
          })

          if (success) {
            notificationsSent.push({
              taskId: task._id.toString(),
              taskTitle: task.title,
              assigneeEmail: assignee.email,
              daysUntilDue
            })
          }
        } catch (error) {
          console.error(`Failed to send notification for task ${task._id}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent: notificationsSent.length,
      details: notificationsSent,
      message: `Sent ${notificationsSent.length} task deadline notifications`
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process task deadline notifications' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Task deadline notification cron job endpoint',
    usage: 'POST to trigger task deadline notifications',
    schedule: 'Should be called daily to check for tasks due in 3, 1, or 0 days'
  })
}
