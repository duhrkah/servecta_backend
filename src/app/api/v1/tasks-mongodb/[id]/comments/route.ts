import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Force dynamic rendering

// Force dynamic rendering
import { z } from 'zod'

// Force dynamic rendering
import { getCurrentUser, requireManagerOrAdmin } from '@/lib/auth-utils'

// Force dynamic rendering
import { collections, findUserById } from '@/lib/mongodb'

// Force dynamic rendering
import { ObjectId } from 'mongodb'

// Force dynamic rendering

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
    const comments = await commentsCollection.find({
      taskId: params.id,
    }).sort({ createdAt: -1 }).toArray()

    // Enrich comments with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await findUserById(comment.authorId)
        
        return {
          ...comment,
          authorName: author?.name || 'Unbekannter Benutzer',
          authorEmail: author?.email || '',
        }
      })
    )

    return NextResponse.json(enrichedComments)
  } catch (error) {
    console.error('Error fetching comments:', error)
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createCommentSchema.parse(body)

    // Verify task exists
    const tasksCollection = await collections.tasks()
    const task = await tasksCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const comment = {
      content: data.content,
      taskId: params.id,
      authorId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const commentsCollection = await collections.comments()
    const result = await commentsCollection.insertOne(comment)

    if (result.acknowledged) {
      const createdComment = await commentsCollection.findOne({ _id: result.insertedId })
      
      return NextResponse.json({
        ...createdComment,
        authorName: user.name,
        authorEmail: user.email,
      }, { status: 201 })
    } else {
      throw new Error('Failed to create comment')
    }
  } catch (error) {
    console.error('Error creating comment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}