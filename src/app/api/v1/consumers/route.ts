import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

const createConsumerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
  customerId: z.string().min(1, 'Kunden-ID ist erforderlich'),
  role: z.enum(['KUNDE']).default('KUNDE'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('ACTIVE'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Nur MANAGER und ADMIN können Consumer-Benutzer erstellen
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createConsumerSchema.parse(body)

    const usersCollection = await collections.consumers()
    const customersCollection = await collections.customers()

    // Prüfen ob Kunde existiert
    const customer = await customersCollection.findOne({ _id: new ObjectId(validatedData.customerId) })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Prüfen ob E-Mail bereits existiert
    const existingUser = await usersCollection.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Consumer-Benutzer erstellen
    const consumerUser = {
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: 'KUNDE',
      status: validatedData.status,
      userType: 'CONSUMER', // Zusätzliches Feld zur Unterscheidung
      customerId: new ObjectId(validatedData.customerId),
      customerName: customer.legalName,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,
    }

    const result = await usersCollection.insertOne(consumerUser)

    // Audit-Log erstellen
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'CREATE',
      entityType: 'CONSUMER_USER',
      entityId: result.insertedId.toString(),
      userId: user.id,
      userEmail: user.email,
      changes: { 
        name: validatedData.name,
        email: validatedData.email,
        customerId: validatedData.customerId,
        customerName: customer.legalName
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    // Kunde aktualisieren - Consumer-Benutzer hinzufügen
    await customersCollection.updateOne(
      { _id: new ObjectId(validatedData.customerId) },
      { 
        $addToSet: { 
          consumerUsers: {
            userId: result.insertedId,
            userName: validatedData.name,
            userEmail: validatedData.email,
            createdAt: new Date()
          }
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Consumer user created successfully',
      userId: result.insertedId.toString()
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating consumer user:', error)
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
    const customerId = searchParams.get('customerId') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const usersCollection = await collections.consumers()

    // Build query - nur Consumer-Benutzer
    const query: any = { 
      userType: 'CONSUMER' // Nur Consumer-Benutzer
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ]
    }
    
    if (customerId) {
      query.customerId = new ObjectId(customerId)
    }
    
    if (status) {
      query.status = status
    }

    // Nur MANAGER und ADMIN können alle Consumer sehen
    if (user.role === 'MITARBEITER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const [consumers, total] = await Promise.all([
      usersCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      usersCollection.countDocuments(query)
    ])

    // Passwort-Hash aus Antwort entfernen
    const sanitizedConsumers = consumers.map(consumer => {
      const { passwordHash, ...sanitized } = consumer
      return sanitized
    })

    return NextResponse.json({
      consumers: sanitizedConsumers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching consumer users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
