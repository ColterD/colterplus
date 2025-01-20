<template>
  <div class="comment-system">
    <!-- Comment Header -->
    <div class="comment-header">
      <h3>Comments ({{ totalComments }})</h3>
      <div class="comment-controls">
        <div class="sort-control">
          <select v-model="sortBy">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
        <button 
          class="filter-btn"
          @click="showFilters = !showFilters"
        >
          <i class="i-carbon-filter"></i>
          Filters
        </button>
      </div>
    </div>

    <!-- Filters Panel -->
    <div 
      v-if="showFilters"
      class="filters-panel"
    >
      <div class="filter-options">
        <label class="checkbox">
          <input 
            type="checkbox"
            v-model="filters.showReplies"
          >
          Show Replies
        </label>
        <label class="checkbox">
          <input 
            type="checkbox"
            v-model="filters.onlyVerified"
          >
          Verified Users Only
        </label>
      </div>
    </div>

    <!-- New Comment Form -->
    <div class="comment-form">
      <div class="user-avatar">
        <img 
          :src="currentUser?.avatar || '/default-avatar.png'"
          :alt="currentUser?.name || 'Anonymous'"
        >
      </div>
      <div class="form-content">
        <div class="editor-wrapper">
          <div class="editor-tabs">
            <button 
              :class="{ active: !isPreview }"
              @click="isPreview = false"
            >
              Write
            </button>
            <button 
              :class="{ active: isPreview }"
              @click="isPreview = true"
            >
              Preview
            </button>
          </div>
          <div class="editor-content">
            <textarea
              v-if="!isPreview"
              v-model="newComment"
              placeholder="Write your comment..."
              @keydown.tab.prevent="handleTab"
              ref="commentInput"
            ></textarea>
            <div 
              v-else
              class="preview-content"
              v-html="renderedComment"
            ></div>
          </div>
          <div class="editor-toolbar">
            <button 
              v-for="tool in editorTools"
              :key="tool.label"
              @click="applyTool(tool.action)"
              :title="tool.label"
            >
              <i :class="tool.icon"></i>
            </button>
          </div>
        </div>
        <div class="form-actions">
          <button 
            class="cancel-btn"
            @click="resetForm"
            v-if="newComment"
          >
            Cancel
          </button>
          <button 
            class="submit-btn"
            @click="submitComment"
            :disabled="!canSubmit"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <div class="comments-list">
      <TransitionGroup name="comment">
        <div
          v-for="comment in sortedComments"
          :key="comment.id"
          class="comment-thread"
        >
          <div class="comment-item">
            <div class="comment-avatar">
              <img 
                :src="comment.user.avatar"
                :alt="comment.user.name"
              >
              <div 
                v-if="comment.user.isOnline"
                class="online-indicator"
              ></div>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <div class="user-info">
                  <span class="username">{{ comment.user.name }}</span>
                  <span 
                    v-if="comment.user.isVerified"
                    class="verified-badge"
                    title="Verified User"
                  >
                    <i class="i-carbon-checkmark-filled"></i>
                  </span>
                  <span class="timestamp">
                    {{ formatTimestamp(comment.timestamp) }}
                  </span>
                </div>
                <div class="comment-actions">
                  <button 
                    v-if="canModerate(comment)"
                    @click="toggleEditMode(comment)"
                  >
                    <i class="i-carbon-edit"></i>
                  </button>
                  <button 
                    v-if="canModerate(comment)"
                    @click="deleteComment(comment)"
                  >
                    <i class="i-carbon-trash-can"></i>
                  </button>
                  <button @click="reportComment(comment)">
                    <i class="i-carbon-flag"></i>
                  </button>
                </div>
              </div>
              
              <!-- Comment Body -->
              <div 
                v-if="!comment.isEditing"
                class="comment-body"
                v-html="renderMarkdown(comment.content)"
              ></div>
              <div 
                v-else
                class="comment-edit"
              >
                <textarea
                  v-model="comment.editContent"
                  rows="3"
                ></textarea>
                <div class="edit-actions">
                  <button 
                    class="cancel-btn"
                    @click="cancelEdit(comment)"
                  >
                    Cancel
                  </button>
                  <button 
                    class="save-btn"
                    @click="saveEdit(comment)"
                  >
                    Save
                  </button>
                </div>
              </div>

              <!-- Comment Footer -->
              <div class="comment-footer">
                <div class="vote-buttons">
                  <button 
                    :class="{ active: comment.userVote === 'up' }"
                    @click="vote(comment, 'up')"
                  >
                    <i class="i-carbon-arrow-up"></i>
                    {{ comment.upvotes }}
                  </button>
                  <button 
                    :class="{ active: comment.userVote === 'down' }"
                    @click="vote(comment, 'down')"
                  >
                    <i class="i-carbon-arrow-down"></i>
                    {{ comment.downvotes }}
                  </button>
                </div>
                <button 
                  class="reply-btn"
                  @click="toggleReply(comment)"
                >
                  <i class="i-carbon-reply"></i>
                  Reply
                </button>
              </div>

              <!-- Reply Form -->
              <div 
                v-if="comment.showReplyForm"
                class="reply-form"
              >
                <textarea
                  v-model="comment.replyContent"
                  placeholder="Write a reply..."
                  rows="3"
                ></textarea>
                <div class="reply-actions">
                  <button 
                    class="cancel-btn"
                    @click="cancelReply(comment)"
                  >
                    Cancel
                  </button>
                  <button 
                    class="submit-btn"
                    @click="submitReply(comment)"
                    :disabled="!comment.replyContent.trim()"
                  >
                    Reply
                  </button>
                </div>
              </div>

              <!-- Nested Replies -->
              <div 
                v-if="comment.replies?.length"
                class="nested-replies"
              >
                <button 
                  class="toggle-replies"
                  @click="toggleReplies(comment)"
                >
                  <i :class="comment.showReplies ? 'i-carbon-subtract' : 'i-carbon-add'"></i>
                  {{ comment.showReplies ? 'Hide' : 'Show' }} 
                  {{ comment.replies.length }} 
                  {{ comment.replies.length === 1 ? 'reply' : 'replies' }}
                </button>
                <TransitionGroup 
                  name="reply"
                  v-if="comment.showReplies"
                >
                  <div
                    v-for="reply in comment.replies"
                    :key="reply.id"
                    class="reply-item"
                  >
                    <!-- Nested Reply Content (Similar to Comment) -->
                    <div class="comment-avatar">
                      <img 
                        :src="reply.user.avatar"
                        :alt="reply.user.name"
                      >
                    </div>
                    <div class="reply-content">
                      <!-- Reply Header -->
                      <div class="comment-header">
                        <div class="user-info">
                          <span class="username">{{ reply.user.name }}</span>
                          <span class="timestamp">
                            {{ formatTimestamp(reply.timestamp) }}
                          </span>
                        </div>
                      </div>
                      <!-- Reply Body -->
                      <div 
                        class="comment-body"
                        v-html="renderMarkdown(reply.content)"
                      ></div>
                      <!-- Reply Footer -->
                      <div class="comment-footer">
                        <div class="vote-buttons">
                          <button 
                            :class="{ active: reply.userVote === 'up' }"
                            @click="vote(reply, 'up')"
                          >
                            <i class="i-carbon-arrow-up"></i>
                            {{ reply.upvotes }}
                          </button>
                          <button 
                            :class="{ active: reply.userVote === 'down' }"
                            @click="vote(reply, 'down')"
                          >
                            <i class="i-carbon-arrow-down"></i>
                            {{ reply.downvotes }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Load More -->
    <div 
      v-if="hasMoreComments"
      class="load-more"
    >
      <button 
        @click="loadMoreComments"
        :disabled="isLoading"
      >
        <i 
          v-if="isLoading"
          class="i-carbon-rotate-360 spinning"
        ></i>
        {{ isLoading ? 'Loading...' : 'Load More Comments' }}
      </button>
    </div>

    <!-- Report Modal -->
    <teleport to="body">
      <modal-dialog
        v-if="showReportModal"
        @close="closeReportModal"
        title="Report Comment"
      >
        <div class="report-form">
          <p>Why are you reporting this comment?</p>
          <div class="report-options">
            <label 
              v-for="option in reportOptions"
              :key="option.value"
              class="radio"
            >
              <input
                type="radio"
                v-model="reportReason"
                :value="option.value"
              >
              {{ option.label }}
            </label>
          </div>
          <textarea
            v-model="reportDescription"
            placeholder="Additional details (optional)"
            rows="3"
          ></textarea>
        </div>
        <template #footer>
          <button 
            class="cancel-btn"
            @click="closeReportModal"
          >
            Cancel
          </button>
          <button 
            class="submit-btn"
            @click="submitReport"
            :disabled="!reportReason"
          >
            Submit Report
          </button>
        </template>
      </modal-dialog>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import markdownIt from 'markdown-it'
import ModalDialog from './ModalDialog.vue'

const md = markdownIt({
  html: false,
  breaks: true,
  linkify: true
})

// Props & Emits
const props = defineProps({
  postId: {
    type: String,
    required: true
  },
  initialComments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['comment-added', 'comment-updated', 'comment-deleted'])

// State
const comments = ref([...props.initialComments])
const newComment = ref('')
const isPreview = ref(false)
const showFilters = ref(false)
const sortBy = ref('newest')
const isLoading = ref(false)
const showReportModal = ref(false)
const reportReason = ref('')
const reportDescription = ref('')
const reportedComment = ref(null)
const page = ref(1)
const perPage = ref(10)

// Filters
const filters = ref({
  showReplies: true,
  onlyVerified: false
})

// Mock current user (replace with actual auth)
const currentUser = ref({
  id: 'user1',
  name: 'Demo User',
  avatar: '/default-avatar.png',
  isVerified: true
})

// Editor Tools
const editorTools = [
  { label: 'Bold', icon: 'i-carbon-text-bold', action: '**' },
  { label: 'Italic', icon: 'i-carbon-text-italic', action: '*' },
  { label: 'Link', icon: 'i-carbon-link', action: '[](url)' },
  { label: 'Code', icon: 'i-carbon-code', action: '`' },
  { label: 'Quote', icon: 'i-carbon-quote', action: '> ' },
  { label: 'List', icon: 'i-carbon-list', action: '- ' }
]

// Report Options
const reportOptions = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'offensive', label: 'Offensive content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' }
]

// Computed
const totalComments = computed(() => {
  return comments.value.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0)
  }, 0)
})

const sortedComments = computed(() => {
  let sorted = [...comments.value]

  // Apply filters
  if (filters.value.onlyVerified) {
    sorted = sorted.filter(comment => comment.user.isVerified)
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'oldest':
      sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      break
    case 'popular':
      sorted.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
      break
    default: // newest
      sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  return sorted
})

const renderedComment = computed(() => {
  return md.render(newComment.value)
})

const canSubmit = computed(() => {
  return newComment.value.trim().length > 0
})

const hasMoreComments = computed(() => {
  // Implement pagination logic
  return false // Placeholder
})

// Methods
const handleTab = (e) => {
  const textarea = e.target
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  newComment.value = 
    newComment.value.substring(0, start) +
    '  ' +
    newComment.value.substring(end)

  // Move cursor position
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 2
  })
}

const applyTool = (tool) => {
  const textarea = document.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = newComment.value.substring(start, end)

  let insertion
  switch (tool) {
    case '**':
      insertion = `**${selected}**`
      break
    case '*':
      insertion = `*${selected}*`
      break
    case '[](url)':
      insertion = selected ? `[${selected}](url)` : '[](url)'
      break
    case '`':
      insertion = `\`${selected}\``
      break
    default:
      insertion = tool + selected
  }

  newComment.value = 
    newComment.value.substring(0, start) +
    insertion +
    newComment.value.substring(end)

  // Reset cursor position
  setTimeout(() => {
    textarea.focus()
    if (selected) {
      textarea.selectionStart = start
      textarea.selectionEnd = start + insertion.length
    } else {
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length
    }
  })
}

const submitComment = async () => {
  if (!canSubmit.value) return

  const newCommentObj = {
    id: Date.now().toString(),
    content: newComment.value,
    user: currentUser.value,
    timestamp: new Date().toISOString(),
    upvotes: 0,
    downvotes: 0,
    replies: [],
    userVote: null
  }

  try {
    // Add to local state
    comments.value.unshift(newCommentObj)
    
    // Emit event
    emit('comment-added', newCommentObj)
    
    // Reset form
    resetForm()
  } catch (error) {
    console.error('Failed to submit comment:', error)
    // Remove from local state if API call fails
    comments.value = comments.value.filter(c => c.id !== newCommentObj.id)
  }
}

const resetForm = () => {
  newComment.value = ''
  isPreview.value = false
}

const toggleEditMode = (comment) => {
  comment.isEditing = !comment.isEditing
  comment.editContent = comment.content
}

const saveEdit = async (comment) => {
  try {
    const originalContent = comment.content
    comment.content = comment.editContent
    comment.isEditing = false
    
    emit('comment-updated', comment)
  } catch (error) {
    console.error('Failed to update comment:', error)
    comment.content = originalContent
  }
}

const cancelEdit = (comment) => {
  comment.isEditing = false
  comment.editContent = comment.content
}

const deleteComment = async (comment) => {
  if (!confirm('Are you sure you want to delete this comment?')) return

  try {
    comments.value = comments.value.filter(c => c.id !== comment.id)
    emit('comment-deleted', comment)
  } catch (error) {
    console.error('Failed to delete comment:', error)
    // Restore comment if API call fails
    comments.value.push(comment)
  }
}

const vote = async (comment, type) => {
  const originalVote = comment.userVote
  
  try {
    if (comment.userVote === type) {
      // Remove vote
      comment.userVote = null
      comment[type + 'votes']--
    } else {
      // Add/change vote
      if (comment.userVote) {
        comment[comment.userVote + 'votes']--
      }
      comment.userVote = type
      comment[type + 'votes']++
    }
  } catch (error) {
    console.error('Failed to update vote:', error)
    // Restore original state
    comment.userVote = originalVote
    // Revert vote counts
    // Implementation depends on your voting logic
  }
}

const toggleReply = (comment) => {
  comment.showReplyForm = !comment.showReplyForm
  if (!comment.showReplyForm) {
    comment.replyContent = ''
  }
}

const submitReply = async (comment) => {
  if (!comment.replyContent?.trim()) return

  const reply = {
    id: Date.now().toString(),
    content: comment.replyContent,
    user: currentUser.value,
    timestamp: new Date().toISOString(),
    upvotes: 0,
    downvotes: 0,
    userVote: null
  }

  try {
    comment.replies = comment.replies || []
    comment.replies.push(reply)
    comment.showReplyForm = false
    comment.replyContent = ''
  } catch (error) {
    console.error('Failed to submit reply:', error)
    // Remove reply if API call fails
    comment.replies = comment.replies.filter(r => r.id !== reply.id)
  }
}

const cancelReply = (comment) => {
  comment.showReplyForm = false
  comment.replyContent = ''
}

const toggleReplies = (comment) => {
  comment.showReplies = !comment.showReplies
}

const reportComment = (comment) => {
  reportedComment.value = comment
  showReportModal.value = true
}

const submitReport = async () => {
  try {
    // Implementation depends on your reporting system
    console.log('Report submitted:', {
      comment: reportedComment.value,
      reason: reportReason.value,
      description: reportDescription.value
    })
    closeReportModal()
  } catch (error) {
    console.error('Failed to submit report:', error)
  }
}

const closeReportModal = () => {
  showReportModal.value = false
  reportedComment.value = null
  reportReason.value = ''
  reportDescription.value = ''
}

const loadMoreComments = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    page.value++
    // Implement pagination loading
  } catch (error) {
    console.error('Failed to load more comments:', error)
    page.value--
  } finally {
    isLoading.value = false
  }
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // Convert milliseconds to minutes/hours/days
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else if (days < 7) {
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

const renderMarkdown = (content) => {
  return md.render(content)
}

const canModerate = (comment) => {
  return currentUser.value?.id === comment.user.id
}

// Lifecycle
onMounted(() => {
  // Initialize comments
})
</script>

<style scoped>
.comment-system {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

/* Header Styles */
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.comment-header h3 {
  margin: 0;
}

.comment-controls {
  display: flex;
  gap: 1rem;
}

.sort-control select {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

/* Filters Panel */
.filters-panel {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.filter-options {
  display: flex;
  gap: 1rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Comment Form */
.comment-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-content {
  flex: 1;
}

.editor-wrapper {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  border-bottom: 1px solid var(--vp-c-divider);
}

.editor-tabs button {
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.editor-tabs button.active {
  color: var(--vp-c-brand);
  border-bottom: 2px solid var(--vp-c-brand);
}

.editor-content {
  min-height: 150px;
}

.editor-content textarea {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  border: none;
  resize: vertical;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

.preview-content {
  padding: 1rem;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.editor-toolbar button {
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 4px;
}

.editor-toolbar button:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

/* Comments List */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-thread {
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 1.5rem;
}

.comment-item {
  display: flex;
  gap: 1rem;
}

.comment-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: var(--vp-c-green);
  border-radius: 50%;
  border: 2px solid var(--vp-c-bg);
}

.comment-content {
  flex: 1;
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
  gap: 0.5rem;
}

.username {
  font-weight: 500;
}

.verified-badge {
  color: var(--vp-c-brand);
}

.timestamp {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
}

.comment-actions button {
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 4px;
}

.comment-actions button:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text);
}

.comment-body {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.vote-buttons {
  display: flex;
  gap: 0.25rem;
}

.vote-buttons button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.vote-buttons button.active {
  background: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
}

.reply-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.reply-btn:hover {
  color: var(--vp-c-text);
}

/* Nested Replies */
.nested-replies {
  margin-left: 3rem;
  margin-top: 1rem;
}

.toggle-replies {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--vp-c-brand);
  cursor: pointer;
  font-size: 0.875rem;
}

.reply-item {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-left: 1rem;
  border-left: 2px solid var(--vp-c-divider);
}

/* Reply Form */
.reply-form {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.reply-form textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  resize: vertical;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

/* Common Button Styles */
button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.primary {
  background: var(--vp-c-brand);
  color: white;
  border: none;
}

button.secondary {
  background: var(--vp-c-bg-soft);
}

/* Report Modal */
.report-form {
  padding: 1rem;
}

.report-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Load More */
.load-more {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transitions */
.comment-enter-active,
.comment-leave-active,
.reply-enter-active,
.reply-leave-active {
  transition: all 0.3s ease;
}

.comment-enter-from,
.comment-leave-to,
.reply-enter-from,
.reply-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .comment-controls {
    width: 100%;
  }

  .sort-control {
    flex: 1;
  }

  .sort-control select {
    width: 100%;
  }

  .filter-options {
    flex-direction: column;
  }

  .nested-replies {
    margin-left: 1rem;
  }

  .comment-actions {
    position: relative;
    top: -0.5rem;
  }
}
</style>