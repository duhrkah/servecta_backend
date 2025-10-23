import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'
import { collections, findUserById } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const createProjectSchema = z.object({
  customerId: z.string().min(1, 'Kunde ist erforderlich'),
  code: z.string().min(1, 'Projektcode ist erforderlich'),
  name: z.string().min(1, 'Projektname ist erforderlich'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assigneeId: z.string().optional(),
  budget: z.number().optional(),
  tags: z.array(z.string()).default([]),
  departments: z.array(z.enum(['IT', 'DATENSCHUTZ'])).default(['IT']),
})

const updateProjectSchema = createProjectSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const customerId = searchParams.get('customerId') || ''
    const department = searchParams.get('department') || ''

    const skip = (page - 1) * limit

    const projectsCollection = await collections.projects()

    // Build query
    const query: any = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }
    
    if (status) {
      query.status = status
    }
    
    if (customerId) {
      query.customerId = customerId  // Verwende String, da die Datenbank String verwendet
      console.log('Filtering projects by customerId:', customerId)
    }
    
    if (department) {
      query.departments = department
    }

    console.log('MongoDB query for projects:', query)

    const [projects, total] = await Promise.all([
      projectsCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      projectsCollection.countDocuments(query),
    ])

    // Populate customer and assignee data
    const customersCollection = await collections.customers()
    const usersCollection = await collections.staff()

    const populatedProjects = await Promise.all(
      projects.map(async (project) => {
        const [customer, assignee] = await Promise.all([
          project.customerId ? customersCollection.findOne({ _id: new ObjectId(project.customerId) }) : null,
          project.assigneeId ? usersCollection.findOne({ _id: new ObjectId(project.assigneeId) }) : null,
        ])

        return {
          ...project,
          customer,
          assignee,
        }
      })
    )

    return NextResponse.json({
      projects: populatedProjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireManagerOrAdmin()
    const body = await request.json()
    
    console.log('Received project data:', body)
    
    // Clean up empty strings for optional fields
    const cleanedBody = {
      ...body,
      startDate: body.startDate && body.startDate.trim() !== '' ? body.startDate : undefined,
      endDate: body.endDate && body.endDate.trim() !== '' ? body.endDate : undefined,
      assigneeId: body.assigneeId && body.assigneeId.trim() !== '' ? body.assigneeId : undefined,
      description: body.description && body.description.trim() !== '' ? body.description : undefined,
    }
    
    console.log('Cleaned project data:', cleanedBody)
    
    const data = createProjectSchema.parse(cleanedBody)
    
    console.log('Parsed project data:', data)

    const projectsCollection = await collections.projects()
    const customersCollection = await collections.customers()

    // Check if customer exists
    const customer = await customersCollection.findOne({
      _id: new ObjectId(data.customerId)
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 400 }
      )
    }

    // Check if project code is unique
    const existingProject = await projectsCollection.findOne({
      code: data.code
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'Projektcode bereits vergeben' },
        { status: 400 }
      )
    }

    // Set departments based on assignee
    let departments = data.departments || ['IT']
    if (data.assigneeId) {
      const assignee = await findUserById(data.assigneeId)
      if (assignee && assignee.departments) {
        departments = assignee.departments
      }
    }

    const project = {
      ...data,
      departments,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await projectsCollection.insertOne(project)
    
    const createdProject = {
      ...project,
      _id: result.insertedId,
    }

    return NextResponse.json(createdProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors,
          message: 'Validierungsfehler beim Erstellen des Projekts'
        },
        { status: 400 },
      )
    }

    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
