import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireManagerOrAdmin } from '@/lib/auth-utils'
import { collections } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, commentId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commentsCollection = await collections.comments()
    const comment = await commentsCollection.findOne({ _id: new ObjectId(params.commentId) })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Verify comment belongs to the specified task
    if (comment.taskId !== params.id) {
      return NextResponse.json({ error: 'Comment does not belong to this task' }, { status: 400 })
    }

    // Check permissions: user can delete their own comments or managers/admins can delete any
    const isOwner = comment.authorId === user.id
    const isManagerOrAdmin = user.role === 'MANAGER' || user.role === 'ADMIN'

    if (!isOwner && !isManagerOrAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create audit log entry before deletion
    const auditLogsCollection = await collections.auditLogs()
    await auditLogsCollection.insertOne({
      action: 'DELETE_COMMENT',
      entityType: 'comment',
      entityId: params.commentId,
      userId: user.id,
      userEmail: user.email,
      details: {
        taskId: params.id,
        commentContent: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
        reason: isOwner ? 'User deleted own comment' : 'Manager/Admin deleted comment',
        deletedAt: new Date()
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    const result = await commentsCollection.deleteOne({ _id: new ObjectId(params.commentId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Comment deleted successfully',
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
