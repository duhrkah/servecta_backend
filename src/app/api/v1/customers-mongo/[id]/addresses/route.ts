import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const addressSchema = z.object({
  type: z.enum(['BUSINESS', 'BILLING', 'SHIPPING', 'OTHER']),
  street: z.string().min(1, 'Straße ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  postalCode: z.string().min(1, 'Postleitzahl ist erforderlich'),
  country: z.string().min(1, 'Land ist erforderlich'),
  isDefault: z.boolean().default(false),
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

    const addressesCollection = await collections.addresses()
    
    const addresses = await addressesCollection.find({
      customerId: new ObjectId(params.id),
    }).toArray()

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Error fetching addresses:', error)
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
    const data = addressSchema.parse(body)

    const addressesCollection = await collections.addresses()

    // If this is set as default, unset other defaults for this customer
    if (data.isDefault) {
      await addressesCollection.updateMany(
        { customerId: new ObjectId(params.id) },
        { $set: { isDefault: false } }
      )
    }

    const address = {
      ...data,
      customerId: new ObjectId(params.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await addressesCollection.insertOne(address)

    if (result.acknowledged) {
      return NextResponse.json({ 
        message: 'Address created successfully', 
        id: result.insertedId 
      }, { status: 201 })
    } else {
      throw new Error('Failed to create address')
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
