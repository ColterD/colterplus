<template>
  <div class="engagement-container">
    <div class="engagement-actions">
      <div class="reactions">
        <button 
          v-for="(count, reaction) in reactions" 
          :key="reaction"
          class="reaction-button"
          :class="{ active: userReactions[reaction] }"
          @click="toggleReaction(reaction)"
        >
          <span class="reaction-emoji">{{ reactionEmojis[reaction] }}</span>
          <span class="reaction-count">{{ count }}</span>
        </button>
      </div>

      <div class="action-buttons">
        <button 
          class="action-button bookmark"
          :class="{ active: isBookmarked }"
          @click="toggleBookmark"
        >
          <svg viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          {{ isBookmarked ? 'Bookmarked' : 'Bookmark' }}
        </button>

        <button 
          class="action-button share"
          @click="shareContent"
        >
          <svg viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
          </svg>
          Share
        </button>
      </div>
    </div>

    <div class="comments-section" v-if="showComments">
      <h3>Comments ({{ comments.length }})</h3>
      
      <div class="comment-form">
        <textarea
          v-model="newComment"
          placeholder="Add a comment..."
          rows="3"
          @focus="checkAuth"
        ></textarea>
        <div class="form-actions">
          <button 
            class="submit-button"
            :disabled="!newComment.trim()"
            @click="submitComment"
          >
            Post Comment
          </button>
        </div>
      </div>

      <div class="comments-list">
        <div 
          v-for="comment in sortedComments" 
          :key="comment.id"
          class="comment"
        >
          <div class="comment-header">
            <div class="user-info">
              <img :src="comment.avatar" :alt="comment.author" class="avatar">
              <span class="author">{{ comment.author }}</span>
              <span class="timestamp">{{ formatDate(comment.timestamp) }}</span>
            </div>
            <div class="comment-actions" v-if="canModerate(comment)">
              <button 
                class="action-button edit"
                @click="editComment(comment)"
              >
                Edit
              </button>
              <button 
                class="action-button delete"
                @click="deleteComment(comment.id)"
              >
                Delete
              </button>
            </div>
          </div>

          <div class="comment-content">
            <template v-if="editingComment?.id === comment.id">
              <textarea
                v-model="editingComment.content"
                rows="3"
              ></textarea>
              <div class="edit-actions">
                <button @click="saveEdit">Save</button>
                <button @click="cancelEdit">Cancel</button>
              </div>
            </template>
            <template v-else>
              {{ comment.content }}
            </template>
          </div>

          <div class="comment-footer">
            <button 
              class="reply-button"
              @click="replyToComment(comment)"
            >
              Reply
            </button>
            <div class="comment-reactions">
              <button 
                v-for="reaction in ['like', 'heart']"
                :key="reaction"
                class="comment-reaction"
                :class="{ active: comment.userReactions?.[reaction] }"
                @click="toggleCommentReaction(comment.id, reaction)"
              >
                {{ reactionEmojis[reaction] }}
                <span>{{ comment.reactions?.[reaction] || 0 }}</span>
              </button>
            </div>
          </div>

          <!-- Nested replies -->
          <div 
            v-if="comment.replies?.length"
            class="replies"
          >
            <div 
              v-for="reply in comment.replies"
              :key="reply.id"
              class="reply"
            >
              <!-- Similar structure to comment -->
              <div class="comment-header">
                <div class="user-info">
                  <img :src="reply.avatar" :alt="reply.author" class="avatar">
                  <span class="author">{{ reply.author }}</span>
                  <span class="timestamp">{{ formatDate(reply.timestamp) }}</span>
                </div>
              </div>
              <div class="comment-content">
                {{ reply.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  path: {
    type: String,
    required: true
  },
  showComments: {
    type: Boolean,
    default: true
  }
})

// State
const reactions = ref({
  like: 0,
  heart: 0,
  celebrate: 0,
  thinking: 0
})

const userReactions = ref({})
const isBookmarked = ref(false)
const comments = ref([])
const newComment = ref('')
const editingComment = ref(null)

// Emoji mappings
const reactionEmojis = {
  like: '👍',
  heart: '❤️',
  celebrate: '🎉',
  thinking: '🤔'
}

// Computed
const sortedComments = computed(() => {
  return [...comments.value].sort((a, b) => b.timestamp - a.timestamp)
})

// Methods
const toggleReaction = (reaction) => {
  if (userReactions.value[reaction]) {
    reactions.value[reaction]--
    userReactions.value[reaction] = false
  } else {
    reactions.value[reaction]++
    userReactions.value[reaction] = true
  }
  saveReactions()
}

const toggleBookmark = () => {
  isBookmarked.value = !isBookmarked.value
  if (isBookmarked.value) {
    saveBookmark()
    window.$notify?.success('Bookmarked', 'Article added to your bookmarks')
  } else {
    removeBookmark()
    window.$notify?.info('Removed', 'Article removed from your bookmarks')
  }
}

const shareContent = async () => {
  const url = window.location.href
  const title = document.title

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url
      })
    } catch (err) {
      console.error('Error sharing:', err)
    }
  } else {
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url)
      window.$notify?.success('Copied!', 'Link copied to clipboard')
    } catch (err) {
      window.$notify?.error('Error', 'Failed to copy link')
    }
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return

  const comment = {
    id: Date.now(),
    content: newComment.value,
    author: 'Current User', // Replace with actual user info
    avatar: '/default-avatar.png',
    timestamp: new Date(),
    reactions: {},
    replies: []
  }

  comments.value.unshift(comment)
  newComment.value = ''
  saveComments()
  window.$notify?.success('Comment Posted', 'Your comment has been added')
}

const editComment = (comment) => {
  editingComment.value = { ...comment }
}

const saveEdit = () => {
  if (!editingComment.value) return

  const index = comments.value.findIndex(c => c.id === editingComment.value.id)
  if (index !== -1) {
    comments.value[index] = { ...editingComment.value }
    editingComment.value = null
    saveComments()
    window.$notify?.success('Updated', 'Comment has been updated')
  }
}

const cancelEdit = () => {
  editingComment.value = null
}

const deleteComment = async (id) => {
  if (!confirm('Are you sure you want to delete this comment?')) return

  comments.value = comments.value.filter(c => c.id !== id)
  saveComments()
  window.$notify?.info('Deleted', 'Comment has been removed')
}

const toggleCommentReaction = (commentId, reaction) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (!comment) return

  comment.reactions = comment.reactions || {}
  comment.userReactions = comment.userReactions || {}

  if (comment.userReactions[reaction]) {
    comment.reactions[reaction]--
    comment.userReactions[reaction] = false
  } else {
    comment.reactions[reaction] = (comment.reactions[reaction] || 0) + 1
    comment.userReactions[reaction] = true
  }

  saveComments()
}

const formatDate = (date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    .format(Math.round((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)), 'day')
}

// Storage helpers
const saveReactions = () => {
  localStorage.setItem(`reactions-${props.path}`, JSON.stringify(userReactions.value))
}

const saveBookmark = () => {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
  bookmarks.push({
    path: props.path,
    title: document.title,
    timestamp: new Date()
  })
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
}

const removeBookmark = () => {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
  const filtered = bookmarks.filter(b => b.path !== props.path)
  localStorage.setItem('bookmarks', JSON.stringify(filtered))
}

const saveComments = () => {
  localStorage.setItem(`comments-${props.path}`, JSON.stringify(comments.value))
}

const loadSavedData = () => {
  // Load reactions
  const savedReactions = localStorage.getItem(`reactions-${props.path}`)
  if (savedReactions) {
    userReactions.value = JSON.parse(savedReactions)
  }

  // Load bookmark status
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
  isBookmarked.value = bookmarks.some(b => b.path === props.path)

  // Load comments
  const savedComments = localStorage.getItem(`comments-${props.path}`)
  if (savedComments) {
    comments.value = JSON.parse(savedComments)
  }
}

// Auth check (replace with your auth logic)
const checkAuth = () => {
  const isAuthenticated = false // Replace with actual auth check
  if (!isAuthenticated) {
    window.$notify?.info('Sign In Required', 'Please sign in to comment')
  }
}

const canModerate = (comment) => {
  // Replace with actual permission check
  return true
}

// Initialize
loadSavedData()
</script>

<style scoped>
.engagement-container {
  margin: 2rem 0;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.engagement-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.reactions {
  display: flex;
  gap: 0.5rem;
}

.reaction-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.reaction-button:hover {
  background: var(--vp-c-bg-mute);
}

.reaction-button.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: white;
}

.reaction-emoji {
  font-size: 1.1em;
}

.reaction-count {
  font-size: 0.9em;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.action-button:hover {
  background: var(--vp-c-bg-mute);
}

.action-button.active {
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
}

.comments-section {
  margin-top: 2rem;
}

.comment-form {
  margin: 1rem 0;
}

.comment-form textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.submit-button {
  padding: 6px 16px;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comments-list {
  margin-top: 2rem;
}

.comment {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.author {
  font-weight: 500;
}

.timestamp {
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.comment-content {
  margin: 0.5rem 0;
  line-height: 1.5;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.reply-button {
  padding: 4px 8px;
  background: none;
  border: none;
  color: var(--vp-c-brand);
  cursor: pointer;
}

.comment-reactions {
  display: flex;
  gap: 8px;
}

.comment-reaction {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: none;
  cursor: pointer;
  font-size: 0.9em;
}

.comment-reaction.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: white;
}

.replies {
  margin-left: 2rem;
  margin-top: 1rem;
  padding-left: 1rem;
  border-left: 2px solid var(--vp-c-divider);
}

.reply {
  margin-bottom: 1rem;
}

/* Mobile styles */
@media (max-width: 768px) {
  .engagement-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: center;
  }
}
</style>