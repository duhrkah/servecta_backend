import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
import { z } from 'zod'

// Force dynamic rendering
import { getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections, findUserById } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering

const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasksCollection = await collections.tasks()
    
    // Get all subtasks for this parent task
    const subtasks = await tasksCollection.find({
      parentTaskId: params.id,
    }).sort({ createdAt: -1 }).toArray()

    // Enrich subtasks with related data
    const enrichedSubtasks = await Promise.all(
      subtasks.map(async (subtask) => {
        const [assignee, project, reporter] = await Promise.all([
          subtask.assigneeId ? findUserById(subtask.assigneeId) : null,
          subtask.projectId ? collections.projects().then(col => col.findOne({ _id: new ObjectId(subtask.projectId) })) : null,
          subtask.reporterId ? findUserById(subtask.reporterId) : null,
        ])

        // Count comments for this subtask
        const commentsCount = await collections.comments().then(col => col.countDocuments({ taskId: subtask._id.toString() }))

        return {
          ...subtask,
          assignee,
          project,
          reporter,
          _count: {
            subtasks: 0, // Subtasks don't have their own subtasks
            comments: commentsCount,
          }
        }
      })
    )

    return NextResponse.json(enrichedSubtasks)
  } catch (error) {
    console.error('Error fetching subtasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSubtaskSchema.parse(body)

    // Verify parent task exists
    const tasksCollection = await collections.tasks()
    const parentTask = await tasksCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!parentTask) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })
    }

    const subtask = {
      ...data,
      status: 'TODO',
      type: 'SUBTASK',
      parentTaskId: params.id, // Store as string to match the query
      projectId: parentTask.projectId,
      reporterId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await tasksCollection.insertOne(subtask)

    if (result.acknowledged) {
      const createdSubtask = await tasksCollection.findOne({ _id: result.insertedId })
      
      // Populate related data
      const [assignee, project, reporter] = await Promise.all([
        createdSubtask?.assigneeId ? findUserById(createdSubtask.assigneeId) : null,
        createdSubtask?.projectId ? collections.projects().then(col => col.findOne({ _id: new ObjectId(createdSubtask.projectId) })) : null,
        createdSubtask?.reporterId ? findUserById(createdSubtask.reporterId) : null,
      ])

      return NextResponse.json({
        ...createdSubtask,
        assignee,
        project,
        reporter,
        _count: {
          subtasks: 0,
          comments: 0,
        }
      }, { status: 201 })
    } else {
      throw new Error('Failed to create subtask')
    }
  } catch (error) {
    console.error('Error creating subtask:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}