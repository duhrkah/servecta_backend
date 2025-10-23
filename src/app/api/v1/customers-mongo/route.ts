import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireManagerOrAdmin, getCurrentUser } from '@/lib/auth-utils'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const createCustomerSchema = z.object({
  legalName: z.string().min(1, 'Rechtsname ist erforderlich'),
  tradeName: z.string().optional(),
  vatId: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['STARTUP', 'SME', 'ENTERPRISE']).optional(),
  addresses: z.array(z.any()).default([]),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

const updateCustomerSchema = createCustomerSchema.partial()

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
    const industry = searchParams.get('industry') || ''
    const size = searchParams.get('size') || ''

    const skip = (page - 1) * limit

    const customersCollection = await getCollection('customers')

    // Build query
    const query: any = {}
    
    if (search) {
      query.$or = [
        { legalName: { $regex: search, $options: 'i' } },
        { tradeName: { $regex: search, $options: 'i' } },
        { vatId: { $regex: search, $options: 'i' } },
      ]
    }
    
    if (industry) {
      query.industry = industry
    }
    
    if (size) {
      query.size = size
    }

    const [customers, total] = await Promise.all([
      customersCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      customersCollection.countDocuments(query),
    ])

    // Enrich customers with related data counts
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const [contactsCount, projectsCount] = await Promise.all([
          getCollection('contacts').then(col => col.countDocuments({ customerId: customer._id.toString() })),
          getCollection('projects').then(col => col.countDocuments({ customerId: customer._id.toString() })),
        ])

        return {
          ...customer,
          contacts: [], // Empty array for now, could be populated with actual contacts
          projects: [], // Empty array for now, could be populated with actual projects
          _count: {
            contacts: contactsCount,
            projects: projectsCount,
          }
        }
      })
    )

    return NextResponse.json({
      customers: enrichedCustomers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
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
    const data = createCustomerSchema.parse(body)

    const customersCollection = await getCollection('customers')

    const customer = {
      ...data,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await customersCollection.insertOne(customer)
    
    const createdCustomer = {
      ...customer,
      _id: result.insertedId,
    }

    return NextResponse.json(createdCustomer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
