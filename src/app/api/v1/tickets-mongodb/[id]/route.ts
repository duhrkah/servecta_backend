import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'
import { collections, findUserById } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { emailService } from '@/lib/email-service'

const updateTicketSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').optional(),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['BUG', 'FEATURE', 'SUPPORT', 'TASK']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  departments: z.array(z.enum(['IT', 'DATENSCHUTZ'])).optional(),
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

    const ticketsCollection = await collections.tickets()
    
    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(params.id),
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Consumer: Prüfen ob Ticket zum eigenen Kunden gehört
    if (user.role === 'KUNDE') {
      const customerId = (user as any).customerId
      if (customerId && ticket.customerId?.toString() !== customerId.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Load related data
    const [assignee, reporter, comments] = await Promise.all([
      ticket.assigneeId ? findUserById(ticket.assigneeId) : null,
      findUserById(ticket.reporterId),
      collections.comments().then(col => col.find({ ticketId: ticket._id.toString() }).toArray()),
    ])

    // Enrich comments with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await findUserById(comment.authorId)
        return {
          ...comment,
          authorName: author?.name || 'Unbekannt',
          author: author ? { _id: author._id, name: author.name, email: author.email } : null,
        }
      })
    )

    // Return ticket with related data
    const ticketWithRelations = {
      ...ticket,
      assigneeName: assignee?.name || 'Nicht zugewiesen',
      assignee: assignee ? { _id: assignee._id, name: assignee.name, email: assignee.email } : null,
      reporterName: reporter?.name || 'Unbekannt',
      reporter: reporter ? { _id: reporter._id, name: reporter.name, email: reporter.email } : null,
      comments: enrichedComments,
    }

    return NextResponse.json(ticketWithRelations)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateTicketSchema.parse(body)

    const ticketsCollection = await collections.tickets()
    const ticketId = new ObjectId(params.id)
    
    // Get current ticket for audit log
    const currentTicket = await ticketsCollection.findOne({ _id: ticketId })
    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
    }

    const result = await ticketsCollection.updateOne(
      { _id: ticketId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Create audit log
    await collections.auditLogs().then(col => col.insertOne({
      action: 'UPDATE',
      entityType: 'TICKET',
      entityId: params.id,
      userId: user.id,
      userEmail: user.email,
      changes: {
        before: currentTicket,
        after: { ...currentTicket, ...updateData },
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }))

    // Fetch updated ticket with enriched data
    const updatedTicket = await ticketsCollection.findOne({ _id: ticketId })
    
    const [assignee, reporter, comments] = updatedTicket ? await Promise.all([
      updatedTicket.assigneeId ? findUserById(updatedTicket.assigneeId) : null,
      findUserById(updatedTicket.reporterId),
      collections.comments().then(col => col.find({ ticketId: updatedTicket._id.toString() }).toArray()),
    ]) : [null, null, []]

    // Enrich comments with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await findUserById(comment.authorId)
        return {
          ...comment,
          authorName: author?.name || 'Unbekannt',
          author: author ? { _id: author._id, name: author.name, email: author.email } : null,
        }
      })
    )

    const enrichedTicket = updatedTicket ? {
      ...updatedTicket,
      assigneeName: assignee?.name || 'Nicht zugewiesen',
      assignee: assignee ? { _id: assignee._id, name: assignee.name, email: assignee.email } : null,
      reporterName: reporter?.name || 'Unbekannt',
      reporter: reporter ? { _id: reporter._id, name: reporter.name, email: reporter.email } : null,
      comments: enrichedComments,
    } : null

    // Send email notifications
    if (enrichedTicket) {
      try {
        // Determine what changed
        const changes = []
        if (currentTicket.status !== (enrichedTicket as any).status) {
          changes.push(`Status geändert von "${currentTicket.status}" zu "${(enrichedTicket as any).status}"`)
        }
        if (currentTicket.priority !== (enrichedTicket as any).priority) {
          changes.push(`Priorität geändert von "${currentTicket.priority}" zu "${(enrichedTicket as any).priority}"`)
        }
        if (currentTicket.assigneeId?.toString() !== (enrichedTicket as any).assigneeId?.toString()) {
          const oldAssignee = currentTicket.assigneeId ? await findUserById(currentTicket.assigneeId) : null
          const newAssignee = (enrichedTicket as any).assignee
          changes.push(`Zuweisung geändert von "${oldAssignee?.name || 'Nicht zugewiesen'}" zu "${newAssignee?.name || 'Nicht zugewiesen'}"`)
        }
        if (currentTicket.description !== (enrichedTicket as any).description) {
          changes.push('Beschreibung wurde aktualisiert')
        }

        // Get customer information
        let customerName = ''
        let customerEmail = ''
        if ((enrichedTicket as any).customerId) {
          const customersCollection = await collections.customers()
          const customer = await customersCollection.findOne({ _id: new ObjectId((enrichedTicket as any).customerId) })
          if (customer) {
            customerName = customer.legalName || customer.tradeName || 'Unbekannter Kunde'
            // Get customer email from consumer users
            const consumersCollection = await collections.consumers()
            const consumerUser = await consumersCollection.findOne({ customerId: new ObjectId((enrichedTicket as any).customerId) })
            if (consumerUser) {
              customerEmail = consumerUser.email
            }
          }
        }

        // Send notification if there are changes
        if (changes.length > 0) {
          await emailService.sendTicketNotification({
            ticketTitle: (enrichedTicket as any).title,
            ticketDescription: (enrichedTicket as any).description,
            ticketStatus: (enrichedTicket as any).status,
            ticketPriority: (enrichedTicket as any).priority,
            assigneeName: (enrichedTicket as any).assignee?.name,
            assigneeEmail: (enrichedTicket as any).assignee?.email,
            customerName,
            customerEmail,
            changedBy: user.name || user.email,
            changeType: 'general',
            changeDetails: changes.join(', ')
          })
        }
      } catch (emailError) {
        console.error('Failed to send ticket notification email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(enrichedTicket || null)
  } catch (error) {
    console.error('Error updating ticket:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticketsCollection = await collections.tickets()
    const ticketId = new ObjectId(params.id)
    
    // Get current ticket for audit log
    const currentTicket = await ticketsCollection.findOne({ _id: ticketId })
    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Delete related comments first
    await collections.comments().then(col => col.deleteMany({ ticketId: params.id }))

    // Delete the ticket
    const result = await ticketsCollection.deleteOne({ _id: ticketId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Create audit log
    await collections.auditLogs().then(col => col.insertOne({
      action: 'DELETE',
      entityType: 'TICKET',
      entityId: params.id,
      userId: user.id,
      userEmail: user.email,
      changes: {
        deleted: currentTicket,
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }))

    return NextResponse.json({ 
      message: 'Ticket successfully deleted',
      deletedTicket: currentTicket
    })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
