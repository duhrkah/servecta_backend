import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const contactSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Gültige E-Mail-Adresse ist erforderlich'),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  isPrimary: z.boolean().default(false),
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

    const contactsCollection = await collections.contacts()
    
    const contacts = await contactsCollection.find({
      customerId: new ObjectId(params.id),
    }).toArray()

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
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
    const user = await requireManagerOrAdmin()
    const body = await request.json()
    const data = contactSchema.parse(body)

    const contactsCollection = await collections.contacts()

    // If this is set as primary, unset other primaries for this customer
    if (data.isPrimary) {
      await contactsCollection.updateMany(
        { customerId: new ObjectId(params.id) },
        { $set: { isPrimary: false } }
      )
    }

    const contact = {
      ...data,
      customerId: new ObjectId(params.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await contactsCollection.insertOne(contact)

    if (result.acknowledged) {
      return NextResponse.json({ 
        message: 'Contact created successfully', 
        id: result.insertedId 
      }, { status: 201 })
    } else {
      throw new Error('Failed to create contact')
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
