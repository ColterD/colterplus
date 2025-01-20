<template>
  <div class="notification-center">
    <!-- Notification Trigger Button -->
    <button 
      class="notification-trigger"
      @click="togglePanel"
      :class="{ 'has-unread': hasUnreadNotifications }"
    >
      <i class="i-carbon-notification"></i>
      <span 
        v-if="unreadCount"
        class="notification-badge"
      >
        {{ formatCount(unreadCount) }}
      </span>
    </button>

    <!-- Notification Panel -->
    <div 
      v-show="isPanelOpen"
      class="notification-panel"
    >
      <div class="panel-header">
        <h3>Notifications</h3>
        <div class="header-actions">
          <button
            v-if="hasUnreadNotifications"
            class="mark-all-read"
            @click="markAllAsRead"
          >
            Mark all as read
          </button>
          <button
            class="settings-btn"
            @click="showSettings = true"
            title="Notification Settings"
          >
            <i class="i-carbon-settings"></i>
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="notification-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
          <span 
            v-if="getTabCount(tab.id)"
            class="tab-count"
          >
            {{ getTabCount(tab.id) }}
          </span>
        </button>
      </div>

      <!-- Notifications List -->
      <div 
        v-if="filteredNotifications.length"
        class="notifications-list"
      >
        <TransitionGroup name="notification">
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{
              unread: !notification.read,
              [notification.type]: true
            }"
          >
            <!-- Notification Icon -->
            <div class="notification-icon">
              <i :class="getNotificationIcon(notification)"></i>
            </div>

            <!-- Notification Content -->
            <div class="notification-content">
              <div class="notification-header">
                <span class="notification-type">
                  {{ formatType(notification.type) }}
                </span>
                <span class="notification-time">
                  {{ formatTime(notification.timestamp) }}
                </span>
              </div>
              
              <div class="notification-body">
                <h4>{{ notification.title }}</h4>
                <p>{{ notification.message }}</p>
                
                <!-- Action Buttons -->
                <div 
                  v-if="notification.actions?.length"
                  class="notification-actions"
                >
                  <button
                    v-for="action in notification.actions"
                    :key="action.id"
                    :class="action.style"
                    @click="handleAction(notification, action)"
                  >
                    {{ action.label }}
                  </button>
                </div>

                <!-- Preview Content -->
                <div 
                  v-if="notification.preview"
                  class="notification-preview"
                  :class="notification.preview.type"
                >
                  <div 
                    v-if="notification.preview.type === 'image'"
                    class="image-preview"
                  >
                    <img 
                      :src="notification.preview.content"
                      :alt="notification.preview.alt || ''"
                    >
                  </div>
                  <pre 
                    v-else-if="notification.preview.type === 'code'"
                    class="code-preview"
                  ><code>{{ notification.preview.content }}</code></pre>
                  <div 
                    v-else
                    class="text-preview"
                  >
                    {{ notification.preview.content }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Notification Controls -->
            <div class="notification-controls">
              <button
                v-if="!notification.read"
                class="mark-read"
                @click="markAsRead(notification)"
                title="Mark as read"
              >
                <i class="i-carbon-checkmark"></i>
              </button>
              <button
                class="remove"
                @click="removeNotification(notification)"
                title="Remove notification"
              >
                <i class="i-carbon-close"></i>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Empty State -->
      <div 
        v-else
        class="empty-state"
      >
        <i class="i-carbon-notification-off"></i>
        <p>No notifications to show</p>
      </div>

      <!-- Load More -->
      <div 
        v-if="hasMoreNotifications"
        class="load-more"
      >
        <button 
          @click="loadMoreNotifications"
          :disabled="isLoading"
        >
          <i 
            v-if="isLoading"
            class="i-carbon-rotate-360 spinning"
          ></i>
          {{ isLoading ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in activeToasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
        >
          <i :class="getToastIcon(toast.type)"></i>
          <div class="toast-content">
            <h4>{{ toast.title }}</h4>
            <p>{{ toast.message }}</p>
          </div>
          <button @click="dismissToast(toast.id)">
            <i class="i-carbon-close"></i>
          </button>
          <div 
            class="toast-progress"
            :style="{ animationDuration: `${toast.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Settings Modal -->
    <teleport to="body">
      <modal-dialog
        v-if="showSettings"
        @close="showSettings = false"
        title="Notification Settings"
      >
        <div class="notification-settings">
          <!-- Notification Preferences -->
          <div class="settings-section">
            <h4>Notification Types</h4>
            <div class="preferences-list">
              <label 
                v-for="pref in notificationPreferences"
                :key="pref.id"
                class="preference-item"
              >
                <div class="preference-info">
                  <span class="preference-label">{{ pref.label }}</span>
                  <span class="preference-desc">{{ pref.description }}</span>
                </div>
                <div class="preference-controls">
                  <select v-model="pref.channel">
                    <option value="none">Disabled</option>
                    <option value="toast">Toast Only</option>
                    <option value="panel">Panel Only</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </label>
            </div>
          </div>

          <!-- Display Settings -->
          <div class="settings-section">
            <h4>Display Settings</h4>
            <div class="display-settings">
              <label class="setting-item">
                <span>Toast Duration</span>
                <input
                  v-model.number="settings.toastDuration"
                  type="number"
                  min="1000"
                  max="10000"
                  step="1000"
                > ms
              </label>
              <label class="setting-item">
                <span>Sound Enabled</span>
                <input
                  v-model="settings.soundEnabled"
                  type="checkbox"
                >
              </label>
              <label class="setting-item">
                <span>Desktop Notifications</span>
                <button 
                  @click="requestNotificationPermission"
                  :disabled="!canRequestPermission"
                >
                  {{ notificationPermissionStatus }}
                </button>
              </label>
            </div>
          </div>
        </div>

        <template #footer>
          <button 
            class="cancel-btn"
            @click="showSettings = false"
          >
            Cancel
          </button>
          <button 
            class="save-btn"
            @click="saveSettings"
          >
            Save Changes
          </button>
        </template>
      </modal-dialog>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { useData } from 'vitepress'
import { useVirtualList } from '@vueuse/core'
import ModalDialog from './ModalDialog.vue'

const { theme } = useData()

// State
const isPanelOpen = ref(false)
const currentTab = ref('all')
const showSettings = ref(false)
const isLoading = ref(false)
const notifications = ref([])
const activeToasts = ref([])
const page = ref(1)
const perPage = ref(10)

// Settings
const settings = ref({
  toastDuration: 5000,
  soundEnabled: true,
  desktopNotifications: false
})

// Notification Sound
const notificationSound = new Audio('/notification-sound.mp3') // Add your sound file

// Tabs Configuration
const tabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'system', label: 'System' }
]

// Notification Preferences
const notificationPreferences = ref([
  {
    id: 'mentions',
    label: 'Mentions',
    description: 'When someone mentions you in a comment',
    channel: 'both'
  },
  {
    id: 'comments',
    label: 'Comments',
    description: 'Replies to your comments',
    channel: 'panel'
  },
  {
    id: 'updates',
    label: 'Updates',
    description: 'System updates and announcements',
    channel: 'both'
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Security-related notifications',
    channel: 'both'
  }
])

// Computed
const hasUnreadNotifications = computed(() => {
  return notifications.value.some(n => !n.read)
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const filteredNotifications = computed(() => {
  let filtered = [...notifications.value]

  switch (currentTab.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.read)
      break
    case 'mentions':
      filtered = filtered.filter(n => n.type === 'mention')
      break
    case 'system':
      filtered = filtered.filter(n => n.type === 'system')
      break
  }

  return filtered
})

const hasMoreNotifications = computed(() => {
  // Implement pagination logic
  return false // Placeholder
})

const canRequestPermission = computed(() => {
  return (
    'Notification' in window &&
    Notification.permission === 'default'
  )
})

const notificationPermissionStatus = computed(() => {
  if (!('Notification' in window)) return 'Not Supported'
  
  switch (Notification.permission) {
    case 'granted':
      return 'Enabled'
    case 'denied':
      return 'Blocked'
    default:
      return 'Enable'
  }
})

// Methods
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}

const markAsRead = async (notification) => {
  try {
    notification.read = true
    // Implement API call to update read status
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    notification.read = false
  }
}

const markAllAsRead = async () => {
  try {
    notifications.value.forEach(n => n.read = true)
    // Implement API call to update all notifications
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    // Revert changes on error
    notifications.value.forEach(n => n.read = false)
  }
}

const removeNotification = async (notification) => {
  try {
    notifications.value = notifications.value.filter(n => n.id !== notification.id)
    // Implement API call to delete notification
  } catch (error) {
    console.error('Failed to remove notification:', error)
    // Restore notification on error
    notifications.value.push(notification)
  }
}

const handleAction = (notification, action) => {
  // Implement action handling based on action.type
  switch (action.type) {
    case 'link':
      window.location.href = action.url
      break
    case 'function':
      action.handler(notification)
      break
    default:
      console.warn('Unknown action type:', action.type)
  }
}

const loadMoreNotifications = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    page.value++
    // Implement pagination loading
    await mockLoadMore()
  } catch (error) {
    console.error('Failed to load more notifications:', error)
    page.value--
  } finally {
    isLoading.value = false
  }
}

const showToast = (toast) => {
  const id = Date.now()
  const newToast = {
    id,
    duration: settings.value.toastDuration,
    ...toast
  }
  
  activeToasts.value.push(newToast)
  
  if (settings.value.soundEnabled) {
    notificationSound.play().catch(() => {
      // Handle autoplay restrictions
    })
  }

  setTimeout(() => {
    dismissToast(id)
  }, newToast.duration)
}

const dismissToast = (id) => {
  activeToasts.value = activeToasts.value.filter(t => t.id !== id)
}

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return

  try {
    const permission = await Notification.requestPermission()
    settings.value.desktopNotifications = permission === 'granted'
  } catch (error) {
    console.error('Failed to request notification permission:', error)
  }
}

const showDesktopNotification = (notification) => {
  if (
    !settings.value.desktopNotifications ||
    Notification.permission !== 'granted'
  ) return

  new Notification(notification.title, {
    body: notification.message,
    icon: '/notification-icon.png' // Add your icon
  })
}

const saveSettings = () => {
  // Save settings to localStorage or backend
  localStorage.setItem('notificationSettings', JSON.stringify(settings.value))
  localStorage.setItem(
    'notificationPreferences',
    JSON.stringify(notificationPreferences.value)
  )
  showSettings.value = false
  
  // Show confirmation toast
  showToast({
    type: 'success',
    title: 'Settings Saved',
    message: 'Your notification preferences have been updated.'
  })
}

// Utility Methods
const formatCount = (count) => {
  return count > 99 ? '99+' : count
}

const formatTime = (timestamp) => {
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

const formatType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const getNotificationIcon = (notification) => {
  const icons = {
    success: 'i-carbon-checkmark-filled',
    error: 'i-carbon-error-filled',
    warning: 'i-carbon-warning-filled',
    info: 'i-carbon-information-filled',
    mention: 'i-carbon-user-mention',
    system: 'i-carbon-system'
  }
  return icons[notification.type] || 'i-carbon-notification'
}

const getToastIcon = (type) => {
  return getNotificationIcon({ type })
}

const getTabCount = (tabId) => {
  switch (tabId) {
    case 'unread':
      return unreadCount.value
    case 'mentions':
      return notifications.value.filter(n => n.type === 'mention').length
    case 'system':
      return notifications.value.filter(n => n.type === 'system').length
    default:
      return notifications.value.length
  }
}

// Mock Methods
const mockLoadMore = () => new Promise(resolve => setTimeout(resolve, 1000))

// Lifecycle Hooks
onMounted(() => {
  // Load saved settings
  const savedSettings = localStorage.getItem('notificationSettings')
  if (savedSettings) {
    settings.value = JSON.parse(savedSettings)
  }

  const savedPreferences = localStorage.getItem('notificationPreferences')
  if (savedPreferences) {
    notificationPreferences.value = JSON.parse(savedPreferences)
  }

  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Event Handlers
const handleClickOutside = (event) => {
  const panel = document.querySelector('.notification-panel')
  const trigger = document.querySelector('.notification-trigger')
  
  if (
    isPanelOpen.value &&
    !panel?.contains(event.target) &&
    !trigger?.contains(event.target)
  ) {
    isPanelOpen.value = false
  }
}

// Expose methods for external use
defineExpose({
  showToast,
  showNotification: (notification) => {
    notifications.value.unshift(notification)
    
    const preference = notificationPreferences.value.find(
      p => p.id === notification.type
    )
    
    if (!preference) return
    
    if (['toast', 'both'].includes(preference.channel)) {
      showToast(notification)
    }
    
    if (
      ['panel', 'both'].includes(preference.channel) &&
      settings.value.desktopNotifications
    ) {
      showDesktopNotification(notification)
    }
  }
})
</script>

<style scoped>
.notification-center {
  position: relative;
}

/* Trigger Button */
.notification-trigger {
  position: relative;
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: color 0.2s ease;
}

.notification-trigger:hover {
  color: var(--vp-c-text);
}

.notification-trigger.has-unread {
  color: var(--vp-c-brand);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--vp-c-brand);
  color: white;
  border-radius: 9px;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Notification Panel */
.notification-panel {
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
  max-height: 600px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.panel-header h3 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.mark-all-read {
  font-size: 0.875rem;
  color: var(--vp-c-brand);
  background: none;
  border: none;
  cursor: pointer;
}

.settings-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

/* Notification Tabs */
.notification-tabs {
  display: flex;
  padding: 0 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.notification-tabs button {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.875rem;
  position: relative;
}

.notification-tabs button.active {
  color: var(--vp-c-brand);
}

.notification-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--vp-c-brand);
}

.tab-count {
  margin-left: 0.5rem;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  font-size: 0.75rem;
}

/* Notifications List */
.notifications-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.notification-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background: var(--vp-c-bg-soft);
}

.notification-item.unread {
  background: var(--vp-c-bg-soft);
}

.notification-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--vp-c-bg-mute);
}

.notification-icon i {
  font-size: 1.25rem;
}

/* Notification Types */
.notification-item.success .notification-icon {
  background: var(--vp-c-green-dimm);
  color: var(--vp-c-green);
}

.notification-item.error .notification-icon {
  background: var(--vp-c-red-dimm);
  color: var(--vp-c-red);
}

.notification-item.warning .notification-icon {
  background: var(--vp-c-yellow-dimm);
  color: var(--vp-c-yellow);
}

.notification-item.info .notification-icon {
  background: var(--vp-c-blue-dimm);
  color: var(--vp-c-blue);
}

.notification-content {
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.notification-type {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.notification-time {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.notification-body h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.notification-body p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.notification-preview {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  font-size: 0.875rem;
}

.image-preview img {
  max-width: 100%;
  border-radius: 4px;
}

.code-preview {
  overflow-x: auto;
  font-family: monospace;
}

.notification-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-controls button {
  padding: 0.25rem;
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-item:hover .notification-controls button {
  opacity: 1;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  position: relative;
  overflow: hidden;
}

.toast.success {
  background: var(--vp-c-green-dimm);
  border-color: var(--vp-c-green);
}

.toast.error {
  background: var(--vp-c-red-dimm);
  border-color: var(--vp-c-red);
}

.toast.warning {
  background: var(--vp-c-yellow-dimm);
  border-color: var(--vp-c-yellow);
}

.toast.info {
  background: var(--vp-c-blue-dimm);
  border-color: var(--vp-c-blue);
}

.toast-content h4 {
  margin: 0 0 0.25rem 0;
}

.toast-content p {
  margin: 0;
  font-size: 0.875rem;
}

.toast button {
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--vp-c-brand);
  animation: progress linear forwards;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Settings Modal */
.notification-settings {
  padding: 1rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.preferences-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
}

.preference-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preference-label {
  font-weight: 500;
}

.preference-desc {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.preference-controls select {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

.display-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--vp-c-text-2);
}

.empty-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

/* Transitions */
.notification-enter-active,
.notification-leave-active,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Loading Animation */
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .notification-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }

  .toast-container {
    left: 1rem;
    right: 1rem;
  }

  .toast {
    width: auto;
  }
}
</style>