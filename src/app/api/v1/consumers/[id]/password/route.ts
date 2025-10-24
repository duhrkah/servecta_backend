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

    // Consumer-Benutzer suchen
    const consumersCollection = await collections.consumers()
    const consumer = await consumersCollection.findOne({ _id: new ObjectId(params.id) })

    if (!consumer) {
      return NextResponse.json({ error: 'Consumer-Benutzer nicht gefunden' }, { status: 404 })
    }

    // Aktuelles Passwort prüfen (nur wenn der Benutzer sein eigenes Passwort ändert)
    if (isOwnAccount && !isAdmin) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist erforderlich' }, { status: 400 })
      }
      const passwordField = consumer.password || consumer.passwordHash
      if (!passwordField) {
        return NextResponse.json({ error: 'Kein Passwort gefunden' }, { status: 400 })
      }
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, passwordField)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
      }
    }

    // Neues Passwort hashen
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Passwort aktualisieren
    await consumersCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          password: hashedNewPassword,
          passwordHash: hashedNewPassword, // Beide Felder für Kompatibilität
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ message: 'Passwort erfolgreich geändert' })

  } catch (error) {
    console.error('Error changing consumer password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
