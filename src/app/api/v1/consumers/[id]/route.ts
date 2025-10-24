import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Force dynamic rendering

// Force dynamic rendering
import { z } from 'zod'

// Force dynamic rendering
import { getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering
import bcrypt from 'bcryptjs'

// Force dynamic rendering

const updateConsumerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
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

    const usersCollection = await collections.consumers()
    const consumer = await usersCollection.findOne({ 
      _id: new ObjectId(params.id),
      userType: 'CONSUMER'
    })

    if (!consumer) {
      return NextResponse.json({ error: 'Consumer user not found' }, { status: 404 })
    }

    // Nur MANAGER, ADMIN oder der Consumer selbst können die Daten sehen
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.id !== params.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Passwort-Hash entfernen
    const { password, passwordHash, ...sanitizedConsumer } = consumer

    return NextResponse.json(sanitizedConsumer)

  } catch (error) {
    console.error('Error fetching consumer user:', error)
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

    // Nur MANAGER und ADMIN können Consumer-Benutzer bearbeiten
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateConsumerSchema.parse(body)

    const usersCollection = await collections.consumers()
    
    // Prüfen ob Consumer existiert
    const existingConsumer = await usersCollection.findOne({ 
      _id: new ObjectId(params.id),
      userType: 'CONSUMER'
    })
    
    if (!existingConsumer) {
      return NextResponse.json({ error: 'Consumer user not found' }, { status: 404 })
    }

    // Update-Daten vorbereiten
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    }

    // Passwort hashen falls vorhanden
    if (validatedData.password) {
      const hashedPassword = await bcrypt.hash(validatedData.password, 12)
      updateData.password = hashedPassword // Für Kompatibilität mit Auth-System
      updateData.passwordHash = hashedPassword // Original-Feld
    }

    // Consumer aktualisieren
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Consumer user not found' }, { status: 404 })
    }

    // Audit-Log erstellen
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'UPDATE',
      entityType: 'CONSUMER_USER',
      entityId: params.id,
      userId: user.id,
      userEmail: user.email,
      changes: validatedData,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Consumer user updated successfully'
    })

  } catch (error) {
    console.error('Error updating consumer user:', error)
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

    // Nur ADMIN kann Consumer-Benutzer löschen
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const usersCollection = await collections.consumers()
    const customersCollection = await collections.customers()
    
    // Consumer-Benutzer finden
    const consumer = await usersCollection.findOne({ 
      _id: new ObjectId(params.id),
      userType: 'CONSUMER'
    })
    
    if (!consumer) {
      return NextResponse.json({ error: 'Consumer user not found' }, { status: 404 })
    }

    // Consumer-Benutzer löschen
    const result = await usersCollection.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Consumer user not found' }, { status: 404 })
    }

    // Consumer-Benutzer aus Kunde entfernen
    if (consumer.customerId) {
      await customersCollection.updateOne(
        { _id: consumer.customerId },
        { 
          $pull: { 
            consumerUsers: { userId: new ObjectId(params.id) }
          }
        } as any
      )
    }

    // Audit-Log erstellen
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'DELETE',
      entityType: 'CONSUMER_USER',
      entityId: params.id,
      userId: user.id,
      userEmail: user.email,
      changes: { 
        name: consumer.name,
        email: consumer.email,
        customerId: consumer.customerId?.toString(),
        customerName: consumer.customerName
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Consumer user deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting consumer user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
