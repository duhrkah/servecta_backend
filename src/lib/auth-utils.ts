import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { collections } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  try {
    // Search in both staff and consumers collections
    const staffCollection = await collections.staff()
    const consumersCollection = await collections.consumers()
    
    const userId = new ObjectId(session.user.id)
    
    // Try to find user in staff collection first
    let user = await staffCollection.findOne({ _id: userId })
    
    // If not found in staff, try consumers collection
    if (!user) {
      user = await consumersCollection.findOne({ _id: userId })
    }

    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  return user
}

export async function requireManagerOrAdmin() {
  const user = await requireAuth()
  if (!['ADMIN', 'MANAGER'].includes(user.role)) {
    throw new Error('Manager or Admin access required')
  }
  return user
}

export async function requireStaffOrAbove() {
  const user = await requireAuth()
  if (!['ADMIN', 'MANAGER', 'STAFF'].includes(user.role)) {
    throw new Error('Staff access or above required')
  }
  return user
}
