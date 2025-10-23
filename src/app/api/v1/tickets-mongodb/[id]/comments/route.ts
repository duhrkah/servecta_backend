import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { collections, findUserById } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Kommentar-Inhalt ist erforderlich'),
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

    const commentsCollection = await collections.comments()
    
    const comments = await commentsCollection
      .find({ ticketId: params.id })
      .sort({ createdAt: -1 })
      .toArray()

    // Enrich comments with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await findUserById(comment.authorId)
        return {
          ...comment,
          authorName: author?.name || 'Unbekannt',
          author: author ? { _id: author._id, name: author.name, email: author.email } : null,
        }
      })
    )

    return NextResponse.json({ comments: enrichedComments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    const commentsCollection = await collections.comments()
    
    const comment = {
      content: validatedData.content,
      ticketId: params.id,
      authorId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await commentsCollection.insertOne(comment)
    
    // Create audit log
    await collections.auditLogs().then(col => col.insertOne({
      action: 'CREATE',
      entityType: 'COMMENT',
      entityId: result.insertedId.toString(),
      userId: user.id,
      userEmail: user.email,
      changes: {
        created: comment,
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }))

    // Fetch the created comment with author data
    const createdComment = await commentsCollection.findOne({ _id: result.insertedId })
    const author = createdComment ? await findUserById(createdComment.authorId) : null
    
    const enrichedComment = createdComment ? {
      ...createdComment,
      authorName: author?.name || 'Unbekannt',
      author: author ? { _id: author._id, name: author.name, email: author.email } : null,
    } : null

    // Update ticket's updatedAt timestamp
    await collections.tickets().then(col => col.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { updatedAt: new Date() } }
    ))

    return NextResponse.json(enrichedComment || null, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
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
