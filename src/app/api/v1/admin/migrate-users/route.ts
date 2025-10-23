import { NextRequest, NextResponse } from 'next/server'
import { requireManagerOrAdmin } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    // For migration purposes, we'll allow this without authentication
    // In production, you should add proper authentication here

    console.log('🔄 Starte Benutzer-Daten-Migration...')
    
    const staffCollection = await collections.staff()
    const consumersCollection = await collections.consumers()
    
    // Update old role values in staff collection
    const roleUpdates = await staffCollection.updateMany(
      { role: 'STAFF' },
      { $set: { role: 'USER' } }
    )
    console.log(`✅ ${roleUpdates.modifiedCount} Benutzer-Rollen von 'STAFF' zu 'USER' aktualisiert`)
    
    // Update old status values in staff collection
    const statusUpdates = await staffCollection.updateMany(
      { status: 'SUSPENDED' },
      { $set: { status: 'INACTIVE' } }
    )
    console.log(`✅ ${statusUpdates.modifiedCount} Benutzer-Status von 'SUSPENDED' zu 'INACTIVE' aktualisiert`)
    
    // Add missing fields for existing staff users
    const missingFieldsUpdates = await staffCollection.updateMany(
      { 
        $or: [
          { createdAt: { $exists: false } },
          { updatedAt: { $exists: false } }
        ]
      },
      { 
        $set: { 
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    )
    console.log(`✅ ${missingFieldsUpdates.modifiedCount} Benutzer mit fehlenden Zeitstempeln aktualisiert`)
    
    // Show current staff data
    const staffUsers = await staffCollection.find({}).toArray()
    const staffSummary = staffUsers.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      userType: user.userType || 'NOT SET'
    }))
    
    // Show current consumer data
    const consumerUsers = await consumersCollection.find({}).toArray()
    const consumerSummary = consumerUsers.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      userType: user.userType || 'NOT SET',
      customerName: user.customerName
    }))
    
    console.log('🎉 Benutzer-Daten-Migration abgeschlossen!')
    
    return NextResponse.json({
      message: 'Benutzer-Daten-Migration erfolgreich abgeschlossen',
      results: {
        rolesUpdated: roleUpdates.modifiedCount,
        statusUpdated: statusUpdates.modifiedCount,
        fieldsUpdated: missingFieldsUpdates.modifiedCount,
        totalStaff: staffUsers.length,
        totalConsumers: consumerUsers.length
      },
      staff: staffSummary,
      consumers: consumerSummary
    })
    
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Migration', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
