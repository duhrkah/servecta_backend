import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Force dynamic rendering

// Force dynamic rendering
import { z } from 'zod'

// Force dynamic rendering
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections, findUserById } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Projektname ist erforderlich').optional(),
  code: z.string().min(1, 'Projektcode ist erforderlich').optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  budget: z.number().optional(),
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

    const projectsCollection = await collections.projects()
    
    const project = await projectsCollection.findOne({
      _id: new ObjectId(params.id),
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Consumer: Prüfen ob Projekt zum eigenen Kunden gehört
    if (user.role === 'KUNDE') {
      const customerId = (user as any).customerId
      if (customerId && project.customerId?.toString() !== customerId.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Load related customer and assignee data
    const [customer, assignee] = await Promise.all([
      project.customerId ? collections.customers().then(col => col.findOne({ _id: new ObjectId(project.customerId) })) : null,
      project.assigneeId ? findUserById(project.assigneeId) : null,
    ])

    // Return project with related data
    const projectWithRelations = {
      ...project,
      customer,
      assignee,
    }

    return NextResponse.json(projectWithRelations)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireManagerOrAdmin()
    const body = await request.json()
    
    // Clean up empty strings for optional fields
    const cleanedBody = {
      ...body,
      startDate: body.startDate && body.startDate.trim() !== '' ? body.startDate : undefined,
      endDate: body.endDate && body.endDate.trim() !== '' ? body.endDate : undefined,
      assigneeId: body.assigneeId && body.assigneeId.trim() !== '' ? body.assigneeId : undefined,
      description: body.description && body.description.trim() !== '' ? body.description : undefined,
    }
    
    const data = updateProjectSchema.parse(cleanedBody)

    const projectsCollection = await collections.projects()

    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updatedProject = await projectsCollection.findOne({
      _id: new ObjectId(params.id),
    })

    // Load related customer and assignee data
    const [customer, assignee] = await Promise.all([
      updatedProject?.customerId ? collections.customers().then(col => col.findOne({ _id: new ObjectId(updatedProject.customerId) })) : null,
      updatedProject?.assigneeId ? findUserById(updatedProject.assigneeId) : null,
    ])

    // Return project with related data
    const projectWithRelations = {
      ...updatedProject,
      customer,
      assignee,
    }

    return NextResponse.json(projectWithRelations)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireManagerOrAdmin()
    const projectId = new ObjectId(params.id)

    // First, get the project data for audit logging
    const projectsCollection = await collections.projects()
    const project = await projectsCollection.findOne({ _id: projectId })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create audit log entry before deletion
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'DELETE_PROJECT',
      entityType: 'project',
      entityId: projectId.toString(),
      userId: user.id,
      userEmail: user.email,
      details: {
        projectName: project.name,
        projectCode: project.code,
        reason: 'GDPR compliant deletion',
        deletedAt: new Date()
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    // Delete all related data first (GDPR compliant cascade deletion)
    const deletionResults = await Promise.all([
      // Delete tasks
      collections.tasks().then(col => col.deleteMany({ projectId: projectId.toString() })),
      // Delete tickets
      collections.tickets().then(col => col.deleteMany({ projectId: projectId.toString() })),
      // Delete quotes
      collections.quotes().then(col => col.deleteMany({ projectId: projectId.toString() })),
    ])

    // Finally, delete the project
    const result = await projectsCollection.deleteOne({ _id: projectId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Project and all related data deleted successfully (GDPR compliant)',
      deletedCounts: {
        project: result.deletedCount,
        tasks: deletionResults[0].deletedCount,
        tickets: deletionResults[1].deletedCount,
        quotes: deletionResults[2].deletedCount,
      }
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
