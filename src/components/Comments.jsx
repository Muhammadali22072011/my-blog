import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

function Comments({ postId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState(null)

  // Load comments
  useEffect(() => {
    loadComments()
    
    // Realtime subscription
    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, () => {
        loadComments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !authorName.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          author_name: authorName.trim(),
          content: newComment.trim(),
          parent_id: replyTo
        }])

      if (error) throw error
      
      setNewComment('')
      setReplyTo(null)
      loadComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Failed to submit comment')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Build comment tree
  const buildCommentTree = (comments) => {
    const map = {}
    const roots = []
    
    comments.forEach(c => { map[c.id] = { ...c, replies: [] } })
    comments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(map[c.id])
      } else {
        roots.push(map[c.id])
      }
    })
    
    return roots
  }

  const CommentItem = ({ comment, depth = 0 }) => (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {comment.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-gray-800 dark:text-white">{comment.author_name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{formatDate(comment.created_at)}</span>
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{comment.content}</p>
        <button
          onClick={() => setReplyTo(comment.id)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
        >
          Reply
        </button>
      </div>
      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  )

  const commentTree = buildCommentTree(comments)

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        {replyTo && (
          <div className="mb-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <span>Replying to comment</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-red-500 hover:underline">Cancel</button>
          </div>
        )}
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
          required
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim() || !authorName.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : commentTree.length > 0 ? (
        <div className="space-y-4">
          {commentTree.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No comments yet. Be the first to comment!</p>
      )}
    </div>
  )
}

export default Comments
