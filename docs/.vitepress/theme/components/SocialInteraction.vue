<template>
  <div class="social-interaction">
    <!-- Share Section -->
    <div class="share-section">
      <button 
        class="share-toggle"
        @click="isShareMenuOpen = !isShareMenuOpen"
      >
        <span class="share-icon">🔗</span>
        Share
      </button>

      <div 
        v-if="isShareMenuOpen"
        class="share-menu"
        v-click-outside="closeShareMenu"
      >
        <div class="share-options">
          <button 
            v-for="platform in sharePlatforms"
            :key="platform.name"
            class="share-button"
            :class="platform.name.toLowerCase()"
            @click="shareContent(platform)"
          >
            <span class="platform-icon">{{ platform.icon }}</span>
            {{ platform.name }}
          </button>
        </div>

        <div class="direct-share">
          <div class="url-share">
            <input 
              type="text"
              :value="currentUrl"
              readonly
              ref="urlInput"
            >
            <button 
              class="copy-button"
              @click="copyUrl"
            >
              {{ hasCopied ? '✓' : 'Copy' }}
            </button>
          </div>
          
          <div class="embed-code" v-if="allowEmbed">
            <button 
              class="embed-toggle"
              @click="showEmbedCode = !showEmbedCode"
            >
              Embed
            </button>
            <div v-if="showEmbedCode" class="embed-preview">
              <textarea
                readonly
                :value="embedCode"
                rows="3"
              ></textarea>
              <button 
                class="copy-button"
                @click="copyEmbed"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collaboration Section -->
    <div class="collab-section">
      <div class="active-users">
        <div 
          v-for="user in activeUsers"
          :key="user.id"
          class="user-avatar"
          :title="user.name"
        >
          <img :src="user.avatar" :alt="user.name">
          <span 
            class="user-status"
            :class="user.status"
          ></span>
        </div>
        <button 
          v-if="activeUsers.length > maxDisplayedUsers"
          class="more-users"
        >
          +{{ activeUsers.length - maxDisplayedUsers }}
        </button>
      </div>

      <div class="collab-actions">
        <button 
          class="collab-button"
          @click="toggleCollabMode"
          :class="{ active: isCollabMode }"
        >
          <span class="collab-icon">👥</span>
          {{ isCollabMode ? 'Exit Collab' : 'Collaborate' }}
        </button>

        <div v-if="isCollabMode" class="collab-tools">
          <button 
            v-for="tool in collabTools"
            :key="tool.name"
            class="tool-button"
            :class="{ active: currentTool === tool.name }"
            @click="selectTool(tool)"
            :title="tool.description"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Comments Section -->
    <div 
      v-if="showComments"
      class="comments-section"
    >
      <div class="comments-header">
        <h3>Comments ({{ comments.length }})</h3>
        <div class="comments-filter">
          <select v-model="commentSort">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      <div class="comment-list">
        <div 
          v-for="comment in sortedComments"
          :key="comment.id"
          class="comment-item"
        >
          <div class="comment-header">
            <div class="comment-author">
              <img :src="comment.author.avatar" :alt="comment.author.name">
              <div class="author-info">
                <span class="author-name">{{ comment.author.name }}</span>
                <span class="comment-time">{{ formatTime(comment.timestamp) }}</span>
              </div>
            </div>
            <div class="comment-actions">
              <button 
                v-if="canModifyComment(comment)"
                @click="editComment(comment)"
              >
                Edit
              </button>
              <button 
                v-if="canModifyComment(comment)"
                @click="deleteComment(comment)"
                class="delete"
              >
                Delete
              </button>
              <button @click="replyToComment(comment)">
                Reply
              </button>
            </div>
          </div>

          <div 
            class="comment-content"
            :class="{ 'is-editing': editingComment?.id === comment.id }"
          >
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
              <p>{{ comment.content }}</p>
            </template>
          </div>

          <div class="comment-footer">
            <div class="comment-reactions">
              <button 
                v-for="reaction in reactions"
                :key="reaction.name"
                class="reaction-button"
                :class="{ active: comment.userReactions?.includes(reaction.name) }"
                @click="toggleReaction(comment, reaction.name)"
              >
                <span class="reaction-icon">{{ reaction.icon }}</span>
                <span class="reaction-count">
                  {{ comment.reactions?.[reaction.name] || 0 }}
                </span>
              </button>
            </div>
          </div>

          <!-- Nested Replies -->
          <div 
            v-if="comment.replies?.length"
            class="comment-replies"
          >
            <div 
              v-for="reply in comment.replies"
              :key="reply.id"
              class="reply-item"
            >
              <!-- Similar structure to comment -->
            </div>
          </div>
        </div>
      </div>

      <!-- Comment Form -->
      <div class="comment-form">
        <textarea
          v-model="newComment"
          placeholder="Add a comment..."
          :rows="commentRows"
          @focus="handleCommentFocus"
        ></textarea>
        <div class="form-actions">
          <div class="formatting-tools">
            <button 
              v-for="tool in formatTools"
              :key="tool.name"
              @click="formatText(tool.action)"
              :title="tool.description"
            >
              {{ tool.icon }}
            </button>
          </div>
          <button 
            class="submit-button"
            @click="submitComment"
            :disabled="!newComment.trim()"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vitepress'

// Props
const props = defineProps({
  allowEmbed: {
    type: Boolean,
    default: true
  },
  showComments: {
    type: Boolean,
    default: true
  }
})

// Route and State
const route = useRoute()
const isShareMenuOpen = ref(false)
const hasCopied = ref(false)
const showEmbedCode = ref(false)
const isCollabMode = ref(false)
const currentTool = ref(null)
const commentSort = ref('newest')
const newComment = ref('')
const editingComment = ref(null)
const commentRows = ref(3)
const maxDisplayedUsers = 5

// Mock Data
const activeUsers = ref([
  { 
    id: 1, 
    name: 'John Doe', 
    avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=John', 
    status: 'online' 
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Jane', 
    status: 'away' 
  }
])

const comments = ref([
  {
    id: 1,
    author: {
      name: 'John Doe',
      avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=John'
    },
    content: 'This is a great article!',
    timestamp: Date.now() - 3600000,
    reactions: {
      like: 5,
      love: 2
    },
    userReactions: ['like'],
    replies: []
  },
  {
    id: 2,
    author: {
      name: 'Jane Smith',
      avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Jane'
    },
    content: 'Very helpful information, thanks!',
    timestamp: Date.now() - 7200000,
    reactions: {
      like: 3,
      thinking: 1
    },
    userReactions: [],
    replies: []
  }
])

// Constants
const sharePlatforms = [
  { name: 'Twitter', icon: '🐦', url: 'https://twitter.com/intent/tweet?url=' },
  { name: 'LinkedIn', icon: '💼', url: 'https://www.linkedin.com/shareArticle?mini=true&url=' },
  { name: 'Facebook', icon: '📘', url: 'https://www.facebook.com/sharer/sharer.php?u=' },
  { name: 'Reddit', icon: '🤖', url: 'https://reddit.com/submit?url=' }
]

const collabTools = [
  { name: 'cursor', icon: '👆', description: 'Show Cursor' },
  { name: 'chat', icon: '💬', description: 'Chat' },
  { name: 'draw', icon: '✏️', description: 'Draw' },
  { name: 'highlight', icon: '🖍️', description: 'Highlight' }
]

const reactions = [
  { name: 'like', icon: '👍' },
  { name: 'love', icon: '❤️' },
  { name: 'laugh', icon: '😄' },
  { name: 'thinking', icon: '🤔' }
]

const formatTools = [
  { name: 'bold', icon: 'B', action: 'bold', description: 'Bold' },
  { name: 'italic', icon: 'I', action: 'italic', description: 'Italic' },
  { name: 'link', icon: '🔗', action: 'link', description: 'Add Link' },
  { name: 'code', icon: '📝', action: 'code', description: 'Code Block' }
]

// Computed
const currentUrl = computed(() => window.location.href)

const embedCode = computed(() => {
  return `<iframe src="${currentUrl.value}" width="100%" height="500" frameborder="0"></iframe>`
})

const sortedComments = computed(() => {
  const sorted = [...comments.value]
  switch (commentSort.value) {
    case 'newest':
      return sorted.sort((a, b) => b.timestamp - a.timestamp)
    case 'oldest':
      return sorted.sort((a, b) => a.timestamp - b.timestamp)
    case 'popular':
      return sorted.sort((a, b) => {
        const aReactions = Object.values(a.reactions || {}).reduce((sum, val) => sum + val, 0)
        const bReactions = Object.values(b.reactions || {}).reduce((sum, val) => sum + val, 0)
        return bReactions - aReactions
      })
    default:
      return sorted
  }
})

// Methods
const closeShareMenu = () => {
  isShareMenuOpen.value = false
}

const shareContent = (platform) => {
  const url = encodeURIComponent(currentUrl.value)
  const shareUrl = `${platform.url}${url}`
  window.open(shareUrl, '_blank')
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(currentUrl.value)
    hasCopied.value = true
    setTimeout(() => {
      hasCopied.value = false
    }, 2000)
    window.$notify?.success('Copied!', 'URL copied to clipboard')
  } catch (error) {
    window.$notify?.error('Error', 'Failed to copy URL')
  }
}

const copyEmbed = async () => {
  try {
    await navigator.clipboard.writeText(embedCode.value)
    window.$notify?.success('Copied!', 'Embed code copied to clipboard')
  } catch (error) {
    window.$notify?.error('Error', 'Failed to copy embed code')
  }
}

const toggleCollabMode = () => {
  isCollabMode.value = !isCollabMode.value
}

const selectTool = (tool) => {
  currentTool.value = currentTool.value === tool.name ? null : tool.name
}

const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  
  return new Date(timestamp).toLocaleDateString()
}

const canModifyComment = (comment) => {
  // Mock authentication check - replace with actual auth logic
  return true
}

const handleCommentFocus = () => {
  // Check auth status
  const isAuthenticated = true // Replace with actual auth check
  if (!isAuthenticated) {
    window.$notify?.info('Sign In Required', 'Please sign in to comment')
  }
}

const formatText = (action) => {
  // Implement text formatting
  console.log('Formatting text:', action)
}

const submitComment = () => {
  if (!newComment.value.trim()) return

  const comment = {
    id: comments.value.length + 1,
    author: {
      name: 'Current User',
      avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=current'
    },
    content: newComment.value,
    timestamp: Date.now(),
    reactions: {},
    userReactions: [],
    replies: []
  }

  comments.value.unshift(comment)
  newComment.value = ''
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
    window.$notify?.success('Comment Updated', 'Your changes have been saved')
  }
}

const cancelEdit = () => {
  editingComment.value = null
}

const deleteComment = (comment) => {
  if (!confirm('Are you sure you want to delete this comment?')) return

  const index = comments.value.findIndex(c => c.id === comment.id)
  if (index !== -1) {
    comments.value.splice(index, 1)
    window.$notify?.success('Comment Deleted', 'The comment has been removed')
  }
}

const replyToComment = (comment) => {
  // Implement reply functionality
  console.log('Replying to comment:', comment)
}

const toggleReaction = (comment, reactionName) => {
  if (!comment.reactions) comment.reactions = {}
  if (!comment.userReactions) comment.userReactions = []

  const hasReacted = comment.userReactions.includes(reactionName)
  
  if (hasReacted) {
    comment.reactions[reactionName]--
    comment.userReactions = comment.userReactions.filter(r => r !== reactionName)
  } else {
    comment.reactions[reactionName] = (comment.reactions[reactionName] || 0) + 1
    comment.userReactions.push(reactionName)
  }
}

// Click outside directive
const clickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}

// Lifecycle
onMounted(() => {
  // Initialize real-time connections or other setup
})

onUnmounted(() => {
  // Cleanup
})
</script>

<style scoped>
/* Social Interaction Container */
.social-interaction {
  margin: 2rem 0;
  font-family: var(--vp-font-family-base);
}

/* Share Section */
.share-section {
  position: relative;
  margin-bottom: 1rem;
}

.share-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-toggle:hover {
  background: var(--vp-c-bg-mute);
}

.share-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  width: 300px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 1rem;
}

.share-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-button:hover {
  background: var(--vp-c-bg-mute);
}

.direct-share {
  padding: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.url-share {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.url-share input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text);
}

/* Collaboration Section */
.collab-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.active-users {
  display: flex;
  align-items: center;
  gap: -0.5rem;
}

.user-avatar {
  position: relative;
  width: 32px;
  height: 32px;
  border: 2px solid var(--vp-c-bg);
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar:not(:first-child) {
  margin-left: -8px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--vp-c-bg);
}

.user-status.online {
  background: var(--vp-c-green);
}

.user-status.away {
  background: var(--vp-c-yellow);
}

.more-users {
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  font-size: 0.8em;
}

/* Comments Section */
.comments-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.comment-list {
  margin-bottom: 2rem;
}

.comment-item {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 500;
}

.comment-time {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.comment-actions button {
  padding: 0.25rem 0.5rem;
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.comment-actions button:hover {
  color: var(--vp-c-text-1);
}

.comment-actions button.delete:hover {
  color: var(--vp-c-danger);
}

.comment-content {
  margin: 0.5rem 0;
  line-height: 1.5;
}

.comment-content textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  resize: vertical;
}

.comment-reactions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.reaction-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  cursor: pointer;
}

.reaction-button:hover {
  background: var(--vp-c-bg-soft);
}

.reaction-button.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
}

.comment-form {
  margin-top: 1rem;
}

.comment-form textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.formatting-tools {
  display: flex;
  gap: 0.5rem;
}

.formatting-tools button {
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
}

.submit-button {
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.submit-button:hover {
  background: var(--vp-c-brand-dark);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .share-menu {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    margin: 0;
    border-radius: 12px 12px 0 0;
  }

  .collab-section {
    flex-direction: column;
    gap: 1rem;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .comment-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .formatting-tools {
    width: 100%;
    justify-content: center;
  }

  .submit-button {
    width: 100%;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>