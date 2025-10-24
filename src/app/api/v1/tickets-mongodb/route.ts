import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
import { z } from 'zod'

// Force dynamic rendering
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections, findUserById } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering

const createTicketSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']).default('OPEN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  type: z.enum(['BUG', 'FEATURE', 'SUPPORT', 'TASK']).default('SUPPORT'),
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customerId: z.string().optional(),
  departments: z.array(z.enum(['IT', 'DATENSCHUTZ'])).default(['IT']),
})

const updateTicketSchema = createTicketSchema.partial()

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
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const type = searchParams.get('type') || ''
    const assignee = searchParams.get('assignee') || ''
    const customerId = searchParams.get('customerId') || ''
    const department = searchParams.get('department') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const ticketsCollection = await collections.tickets()
    
    // Build query
    const query: any = {}
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }
    
    if (status) {
      query.status = status
    }
    
    if (priority) {
      query.priority = priority
    }
    
    if (type) {
      query.type = type
    }
    
    if (assignee === 'unassigned') {
      query.assigneeId = { $exists: false }
    } else if (assignee) {
      query.assigneeId = assignee
    }

    if (customerId) {
      query.customerId = new ObjectId(customerId)  // Verwende ObjectId, da die Datenbank ObjectId verwendet
    }
    
    if (department) {
      query.departments = department
    }

    // Get total count
    const total = await ticketsCollection.countDocuments(query)
    
    // Calculate pagination
    const skip = (page - 1) * limit
    const pages = Math.ceil(total / limit)
    
    // Build sort
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    // Fetch tickets with pagination
    const tickets = await ticketsCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Enrich tickets with related data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const [assignee, reporter, commentsCount] = await Promise.all([
          ticket.assigneeId ? findUserById(ticket.assigneeId) : null,
          ticket.reporterId ? findUserById(ticket.reporterId) : null,
          collections.comments().then(col => col.countDocuments({ ticketId: ticket._id.toString() })),
        ])

        return {
          ...ticket,
          assigneeName: assignee?.name || 'Nicht zugewiesen',
          assignee: assignee ? { _id: assignee._id, name: assignee.name, email: assignee.email } : null,
          reporterName: reporter?.name || 'Unbekannt',
          reporter: reporter ? { _id: reporter._id, name: reporter.name, email: reporter.email } : null,
          _count: {
            comments: commentsCount,
          }
        }
      })
    )

    return NextResponse.json({
      tickets: enrichedTickets,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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
    const validatedData = createTicketSchema.parse(body)

    const ticketsCollection = await collections.tickets()
    
    // Set departments based on assignee
    let departments = validatedData.departments || ['IT']
    if (validatedData.assigneeId) {
      const assignee = await findUserById(validatedData.assigneeId)
      if (assignee && assignee.departments) {
        departments = assignee.departments
      }
    }

    const ticket = {
      ...validatedData,
      departments,
      reporterId: validatedData.reporterId || user.id,
      customerId: validatedData.customerId ? new ObjectId(validatedData.customerId) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await ticketsCollection.insertOne(ticket)
    
    // Create audit log
    await collections.auditLogs().then(col => col.insertOne({
      action: 'CREATE',
      entityType: 'TICKET',
      entityId: result.insertedId.toString(),
      userId: user.id,
      userEmail: user.email,
      changes: {
        created: ticket,
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }))

    // Fetch the created ticket with enriched data
    const createdTicket = await ticketsCollection.findOne({ _id: result.insertedId })
    
    const [assignee, reporter] = createdTicket ? await Promise.all([
      createdTicket.assigneeId ? findUserById(createdTicket.assigneeId) : null,
      findUserById(createdTicket.reporterId),
    ]) : [null, null]

    const enrichedTicket = createdTicket ? {
      ...createdTicket,
      assigneeName: assignee?.name || 'Nicht zugewiesen',
      assignee: assignee ? { _id: assignee._id, name: assignee.name, email: assignee.email } : null,
      reporterName: reporter?.name || 'Unbekannt',
      reporter: reporter ? { _id: reporter._id, name: reporter.name, email: reporter.email } : null,
      _count: {
        comments: 0,
      }
    } : null

    return NextResponse.json(enrichedTicket || null, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}