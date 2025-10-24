import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force dynamic rendering
import { getCurrentUser } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      customersCollection,
      projectsCollection,
      tasksCollection,
      ticketsCollection
    ] = await Promise.all([
      collections.customers(),
      collections.projects(),
      collections.tasks(),
      collections.tickets()
    ])

    // Basierend auf der Benutzerrolle unterschiedliche Daten laden
    let customerFilter = {}
    let projectFilter = {}
    let taskFilter = {}
    let ticketFilter = {}

    if (user.role === 'MITARBEITER') {
      // MITARBEITER: Nur eigene Daten
      customerFilter = { assignedUsers: user.id }
      projectFilter = { assignedUsers: user.id }
      taskFilter = { assignedUsers: user.id }
      ticketFilter = { assignedUsers: user.id }
    } else if (user.role === 'KUNDE') {
      // KUNDE: Nur Daten des eigenen Kunden
      const customerId = (user as any).customerId
      if (customerId) {
        customerFilter = { _id: new ObjectId(customerId) }
        projectFilter = { customerId: new ObjectId(customerId) }
        taskFilter = { customerId: new ObjectId(customerId) }
        ticketFilter = { customerId: new ObjectId(customerId) }
      }
    } else if (user.role === 'MANAGER') {
      // MANAGER: Alle Daten außer Admin-spezifische
      // Keine Filter - alle Daten
    } else if (user.role === 'ADMIN') {
      // ADMIN: Alle Daten
      // Keine Filter - alle Daten
    }

    // Statistiken sammeln
    const [
      customers,
      projects,
      tasks,
      tickets
    ] = await Promise.all([
      customersCollection.find(customerFilter).toArray(),
      projectsCollection.find(projectFilter).toArray(),
      tasksCollection.find(taskFilter).toArray(),
      ticketsCollection.find(ticketFilter).toArray()
    ])

    // Berechne Statistiken
    const stats = {
      customers: {
        total: customers.length,
        active: customers.filter(c => c.status === 'ACTIVE').length
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'ACTIVE').length,
        completed: projects.filter(p => p.status === 'COMPLETED').length
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'COMPLETED').length,
        overdue: tasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
        ).length
      },
      tickets: {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'OPEN').length,
        urgent: tickets.filter(t => t.priority === 'URGENT').length
      }
    }

    // Neueste Elemente (begrenzt auf 5 pro Kategorie)
    const recentItems = {
      customers: customers
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
      projects: projects
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
      tasks: tasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
      tickets: tickets
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    }

    return NextResponse.json({
      stats,
      recentItems,
      userRole: user.role
    })
  } catch (error) {
    console.error('Error fetching customer dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
