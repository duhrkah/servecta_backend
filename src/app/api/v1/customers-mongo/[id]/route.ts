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

const updateCustomerSchema = z.object({
  legalName: z.string().min(1, 'Rechtsname ist erforderlich').optional(),
  tradeName: z.string().optional(),
  vatId: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['STARTUP', 'SME', 'ENTERPRISE']).optional(),
  addresses: z.array(z.any()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
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

    const customersCollection = await collections.customers()
    
    const customer = await customersCollection.findOne({
      _id: new ObjectId(params.id),
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Load related addresses and contacts
    const [addresses, contacts] = await Promise.all([
      collections.addresses().then(col => col.find({ customerId: new ObjectId(params.id) }).toArray()),
      collections.contacts().then(col => col.find({ customerId: new ObjectId(params.id) }).toArray()),
    ])

    // Return customer with related data
    const customerWithRelations = {
      ...customer,
      addresses,
      contacts,
    }

    return NextResponse.json(customerWithRelations)
  } catch (error) {
    console.error('Error fetching customer:', error)
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
    const data = updateCustomerSchema.parse(body)

    const customersCollection = await collections.customers()

    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    const result = await customersCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const updatedCustomer = await customersCollection.findOne({
      _id: new ObjectId(params.id),
    })

    // Load related addresses and contacts
    const [addresses, contacts] = await Promise.all([
      collections.addresses().then(col => col.find({ customerId: new ObjectId(params.id) }).toArray()),
      collections.contacts().then(col => col.find({ customerId: new ObjectId(params.id) }).toArray()),
    ])

    // Return customer with related data
    const customerWithRelations = {
      ...updatedCustomer,
      addresses,
      contacts,
    }

    return NextResponse.json(customerWithRelations)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error updating customer:', error)
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
    const customerId = new ObjectId(params.id)

    // First, get the customer data for audit logging
    const customersCollection = await collections.customers()
    const customer = await customersCollection.findOne({ _id: customerId })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Create audit log entry before deletion
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'DELETE_CUSTOMER',
      entityType: 'customer',
      entityId: customerId.toString(),
      userId: user.id,
      userEmail: user.email,
      details: {
        customerName: customer.legalName,
        reason: 'GDPR compliant deletion',
        deletedAt: new Date()
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    // Delete all related data first (GDPR compliant cascade deletion)
    const deletionResults = await Promise.all([
      // Delete addresses
      collections.addresses().then(col => col.deleteMany({ customerId: customerId.toString() })),
      // Delete contacts
      collections.contacts().then(col => col.deleteMany({ customerId: customerId.toString() })),
      // Delete projects (and their related data)
      collections.projects().then(col => col.deleteMany({ customerId: customerId.toString() })),
      // Delete quotes
      collections.quotes().then(col => col.deleteMany({ customerId: customerId.toString() })),
      // Delete tickets
      collections.tickets().then(col => col.deleteMany({ customerId: customerId.toString() })),
      // Delete tasks
      collections.tasks().then(col => col.deleteMany({ customerId: customerId.toString() })),
    ])

    // Finally, delete the customer
    const result = await customersCollection.deleteOne({ _id: customerId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Customer and all related data deleted successfully (GDPR compliant)',
      deletedCounts: {
        customer: result.deletedCount,
        addresses: deletionResults[0].deletedCount,
        contacts: deletionResults[1].deletedCount,
        projects: deletionResults[2].deletedCount,
        quotes: deletionResults[3].deletedCount,
        tickets: deletionResults[4].deletedCount,
        tasks: deletionResults[5].deletedCount,
      }
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
