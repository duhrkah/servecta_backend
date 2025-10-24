import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Force dynamic rendering

// Force dynamic rendering
import { z } from 'zod'

// Force dynamic rendering
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering
import bcrypt from 'bcryptjs'

// Force dynamic rendering

const createUserSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
  role: z.enum(['ADMIN', 'MANAGER', 'MITARBEITER']).default('MITARBEITER'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('ACTIVE'),
  departments: z.array(z.enum(['IT', 'DATENSCHUTZ'])).default(['IT']),
})

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben').optional(),
})

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
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const userType = searchParams.get('userType') || ''
    const department = searchParams.get('department') || ''

    const skip = (page - 1) * limit

    const usersCollection = await collections.staff()

    // Build query
    const query: any = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    
    if (role) {
      query.role = role
    }
    
    if (status) {
      query.status = status
    }
    
    if (userType) {
      query.userType = userType
    }
    
    if (department) {
      query.departments = department
    }

    const [users, total] = await Promise.all([
      usersCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      usersCollection.countDocuments(query),
    ])

    // Remove password hashes and enrich with statistics
    const safeUsers = await Promise.all(users.map(async user => {
      const { passwordHash, ...safeUser } = user
      
      // Count related data
      const [tasksCount, projectsCount, ticketsCount] = await Promise.all([
        collections.tasks().then(col => col.countDocuments({ assigneeId: user._id.toString() })),
        collections.projects().then(col => col.countDocuments({ assigneeId: user._id.toString() })),
        collections.tickets().then(col => col.countDocuments({ assigneeId: user._id.toString() })),
      ])
      
      return {
        ...safeUser,
        _count: {
          tasks: tasksCount,
          projects: projectsCount,
          tickets: ticketsCount,
        }
      }
    }))

    return NextResponse.json({
      users: safeUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
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
    const data = createUserSchema.parse(body)

    const usersCollection = await collections.staff()

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: data.email
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Benutzer mit dieser E-Mail-Adresse existiert bereits' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    const newUser = {
      ...data,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)
    
    const createdUser = {
      ...newUser,
      _id: result.insertedId,
    }

    // Remove password hash from response
    const { passwordHash: _, ...safeUser } = createdUser

    return NextResponse.json(safeUser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
