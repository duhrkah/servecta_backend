import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { collections } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!newPassword) {
      return NextResponse.json({ error: 'Neues Passwort ist erforderlich' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' }, { status: 400 })
    }

    // Prüfen ob der Benutzer sein eigenes Passwort ändert oder Admin ist
    const isOwnAccount = session.user.id === params.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwnAccount && !isAdmin) {
      return NextResponse.json({ error: 'Sie können nur Ihr eigenes Passwort ändern' }, { status: 403 })
    }

    // Benutzer in beiden Collections suchen
    const [staffCollection, consumersCollection] = await Promise.all([
      collections.staff(),
      collections.consumers()
    ])

    const [staffUser, consumerUser] = await Promise.all([
      staffCollection.findOne({ _id: new ObjectId(params.id) }),
      consumersCollection.findOne({ _id: new ObjectId(params.id) })
    ])

    const user = staffUser || consumerUser
    const userCollection = staffUser ? staffCollection : consumersCollection

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Aktuelles Passwort prüfen (nur wenn der Benutzer sein eigenes Passwort ändert)
    if (isOwnAccount && !isAdmin) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist erforderlich' }, { status: 400 })
      }
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
      }
    }

    // Neues Passwort hashen
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Passwort aktualisieren
    await userCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ message: 'Passwort erfolgreich geändert' })

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
