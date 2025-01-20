<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification"
          :class="notification.type"
        >
          <div class="notification-icon">
            <svg v-if="notification.type === 'success'" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <svg v-else-if="notification.type === 'error'" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
            <svg v-else-if="notification.type === 'info'" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <button 
            class="notification-close"
            @click="removeNotification(notification.id)"
            aria-label="Close notification"
          >
            ×
          </button>
          <div 
            class="notification-progress"
            :style="{ animationDuration: `${notification.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const notifications = ref([])
let nextId = 0

const addNotification = (notification) => {
  const id = nextId++
  const defaultDuration = 5000
  
  notifications.value.push({
    id,
    type: 'info',
    duration: defaultDuration,
    ...notification
  })

  setTimeout(() => {
    removeNotification(id)
  }, notification.duration || defaultDuration)
}

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
  }
}

// Expose methods to global window object
window.$notify = {
  success: (title, message, duration) => {
    addNotification({ type: 'success', title, message, duration })
  },
  error: (title, message, duration) => {
    addNotification({ type: 'error', title, message, duration })
  },
  info: (title, message, duration) => {
    addNotification({ type: 'info', title, message, duration })
  }
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  pointer-events: auto;
}

.notification.success {
  border-left: 4px solid var(--vp-c-green);
}

.notification.error {
  border-left: 4px solid var(--vp-c-red);
}

.notification.info {
  border-left: 4px solid var(--vp-c-brand);
}

.notification-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.notification-icon svg {
  width: 100%;
  height: 100%;
}

.success .notification-icon svg {
  fill: var(--vp-c-green);
}

.error .notification-icon svg {
  fill: var(--vp-c-red);
}

.info .notification-icon svg {
  fill: var(--vp-c-brand);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.notification-message {
  margin-top: 4px;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.notification-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-left: 12px;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  font-size: 18px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.notification-close:hover {
  opacity: 1;
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--vp-c-brand);
  transform-origin: left;
  animation: progress linear forwards;
}

.success .notification-progress {
  background: var(--vp-c-green);
}

.error .notification-progress {
  background: var(--vp-c-red);
}

/* Animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .notification-container {
    top: auto;
    bottom: 20px;
    left: 20px;
    right: 20px;
  }
  
  .notification {
    width: 100%;
  }
}
</style>