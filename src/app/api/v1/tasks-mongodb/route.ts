import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { collections, findUserById } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const querySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('20'),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  assignee: z.string().optional(),
  project: z.string().optional(),
  parentTask: z.string().optional(),
  customerId: z.string().optional(),
  department: z.string().optional(),
})

const createTaskSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  type: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
  parentTaskId: z.string().optional(),
  reporterId: z.string().optional(),
  customerId: z.string().optional(),
  departments: z.array(z.enum(['IT', 'DATENSCHUTZ'])).default(['IT']),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(query.page)
    const limit = parseInt(query.limit)
    const skip = (page - 1) * limit

    const tasksCollection = await collections.tasks()

    // Build MongoDB query
    const mongoQuery: any = {
      parentTaskId: { $exists: false } // Only show main tasks, not subtasks
    }
    
    if (query.search) {
      mongoQuery.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ]
    }

    if (query.status) {
      mongoQuery.status = query.status
    }

    if (query.priority) {
      mongoQuery.priority = query.priority
    }

    if (query.type) {
      mongoQuery.type = query.type
    }

    if (query.assignee) {
      mongoQuery.assigneeId = new ObjectId(query.assignee)
    }

    if (query.project) {
      mongoQuery.projectId = new ObjectId(query.project)
    }

    if (query.customerId) {
      mongoQuery.customerId = new ObjectId(query.customerId)  // Verwende ObjectId, da die Datenbank ObjectId verwendet
    }
    
    if (query.department) {
      mongoQuery.departments = query.department
    }

    const [tasks, total] = await Promise.all([
      tasksCollection
        .find(mongoQuery)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      tasksCollection.countDocuments(mongoQuery),
    ])

    // Enrich tasks with related data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const [assignee, project, reporter] = await Promise.all([
          task.assigneeId ? findUserById(task.assigneeId) : null,
          task.projectId ? collections.projects().then(col => col.findOne({ _id: new ObjectId(task.projectId) })) : null,
          task.reporterId ? findUserById(task.reporterId) : null,
        ])

        // Count subtasks and comments
        const [subtasksCount, commentsCount] = await Promise.all([
          collections.tasks().then(col => col.countDocuments({ parentTaskId: task._id.toString() })),
          0, // Comments count - assuming no separate comments collection for now
        ])

        return {
          ...task,
          assignee,
          project,
          reporter,
          _count: {
            subtasks: subtasksCount,
            comments: commentsCount,
          }
        }
      })
    )

    return NextResponse.json({
      tasks: enrichedTasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createTaskSchema.parse(body)

    const tasksCollection = await collections.tasks()
    
    // Set departments based on assignee
    let departments = data.departments || ['IT']
    if (data.assigneeId) {
      const assignee = await findUserById(data.assigneeId)
      if (assignee && assignee.departments) {
        departments = assignee.departments
      }
    }

    const task = {
      ...data,
      departments,
      reporterId: data.reporterId || user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await tasksCollection.insertOne(task)

    if (result.acknowledged) {
      const createdTask = await tasksCollection.findOne({ _id: result.insertedId })
      
      // Populate related data
      const [assignee, project, reporter] = await Promise.all([
        createdTask?.assigneeId ? findUserById(createdTask.assigneeId) : null,
        createdTask?.projectId ? collections.projects().then(col => col.findOne({ _id: new ObjectId(createdTask.projectId) })) : null,
        createdTask?.reporterId ? findUserById(createdTask.reporterId) : null,
      ])

      return NextResponse.json({
        ...createdTask,
        assignee,
        project,
        reporter,
        _count: {
          subtasks: 0,
          comments: 0,
        }
      }, { status: 201 })
    } else {
      throw new Error('Failed to create task')
    }
  } catch (error) {
    console.error('Error creating task:', error)
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