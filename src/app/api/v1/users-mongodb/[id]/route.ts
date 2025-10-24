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

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'MITARBEITER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
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

    const usersCollection = await collections.staff()
    const userData = await usersCollection.findOne({ _id: new ObjectId(params.id) })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove password hash
    const { passwordHash, ...safeUser } = userData

    // Count related data
    const [tasksCount, projectsCount, ticketsCount] = await Promise.all([
      collections.tasks().then(col => col.countDocuments({ assigneeId: userData._id.toString() })),
      collections.projects().then(col => col.countDocuments({ assigneeId: userData._id.toString() })),
      collections.tickets().then(col => col.countDocuments({ assigneeId: userData._id.toString() })),
    ])

    return NextResponse.json({
      ...safeUser,
      _count: {
        tasks: tasksCount,
        projects: projectsCount,
        tickets: ticketsCount,
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
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
    const data = updateUserSchema.parse(body)

    const usersCollection = await collections.staff()

    // Check if user exists
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(params.id) })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await usersCollection.findOne({ 
        email: data.email,
        _id: { $ne: new ObjectId(params.id) }
      })
      
      if (emailExists) {
        return NextResponse.json(
          { error: 'Benutzer mit dieser E-Mail-Adresse existiert bereits' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    }

    // Hash password if provided
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(params.id) })
    
    // Remove password hash
    const { passwordHash, ...safeUser } = updatedUser!

    // Count related data
    const [tasksCount, projectsCount, ticketsCount] = await Promise.all([
      collections.tasks().then(col => col.countDocuments({ assigneeId: updatedUser!._id.toString() })),
      collections.projects().then(col => col.countDocuments({ assigneeId: updatedUser!._id.toString() })),
      collections.tickets().then(col => col.countDocuments({ assigneeId: updatedUser!._id.toString() })),
    ])

    return NextResponse.json({
      ...safeUser,
      _count: {
        tasks: tasksCount,
        projects: projectsCount,
        tickets: ticketsCount,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Error updating user:', error)
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
    const userId = new ObjectId(params.id)

    // Prevent deletion of own account
    if (user.id === params.id) {
      return NextResponse.json(
        { error: 'Sie können Ihr eigenes Konto nicht löschen' },
        { status: 400 }
      )
    }

    // First, get the user data for audit logging
    const usersCollection = await collections.staff()
    const userToDelete = await usersCollection.findOne({ _id: userId })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create audit log entry before deletion
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId.toString(),
      userId: user.id,
      userEmail: user.email,
      details: {
        userName: userToDelete.name,
        userEmail: userToDelete.email,
        reason: 'GDPR compliant deletion',
        deletedAt: new Date()
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    // Delete related data first (GDPR compliant cascade deletion)
    const deletionResults = await Promise.all([
      // Update tasks to remove assignee
      collections.tasks().then(col => col.updateMany(
        { assigneeId: userId.toString() },
        { $unset: { assigneeId: 1 } }
      )),
      // Update projects to remove assignee
      collections.projects().then(col => col.updateMany(
        { assigneeId: userId.toString() },
        { $unset: { assigneeId: 1 } }
      )),
      // Update tickets to remove assignee
      collections.tickets().then(col => col.updateMany(
        { assigneeId: userId.toString() },
        { $unset: { assigneeId: 1 } }
      )),
    ])

    // Finally, delete the user
    const result = await usersCollection.deleteOne({ _id: userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'User and all related data deleted successfully (GDPR compliant)',
      deletedCounts: {
        user: result.deletedCount,
        tasksUpdated: deletionResults[0].modifiedCount,
        projectsUpdated: deletionResults[1].modifiedCount,
        ticketsUpdated: deletionResults[2].modifiedCount,
      }
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
