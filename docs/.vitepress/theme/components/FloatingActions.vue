<template>
  <Transition name="float">
    <div v-show="isVisible" class="floating-actions" :class="{ 'is-mobile': isMobile }">
      <div class="progress-ring">
        <svg class="progress-ring__circle" width="40" height="40">
          <circle
            class="progress-ring__background"
            stroke-width="2"
            fill="transparent"
            r="18"
            cx="20"
            cy="20"
          />
          <circle
            class="progress-ring__progress"
            stroke-width="2"
            fill="transparent"
            r="18"
            cx="20"
            cy="20"
            :style="{ strokeDashoffset: progressOffset }"
          />
        </svg>
        <span class="progress-text">{{ Math.round(scrollProgress) }}%</span>
      </div>

      <div class="action-buttons">
        <button 
          v-if="showShare"
          class="action-button share-button" 
          @click="toggleShare"
          aria-label="Share"
        >
          <svg viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
          </svg>
        </button>

        <button 
          class="action-button top-button"
          @click="scrollToTop"
          aria-label="Scroll to top"
        >
          <svg viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
        </button>
      </div>

      <!-- Share Modal -->
      <Transition name="fade">
        <div v-if="isShareOpen" class="share-modal">
          <div class="share-options">
            <button 
              v-for="option in shareOptions" 
              :key="option.name"
              class="share-option"
              @click="share(option)"
            >
              <img :src="option.icon" :alt="option.name">
              {{ option.name }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const isVisible = ref(false)
const scrollProgress = ref(0)
const isShareOpen = ref(false)
const isMobile = ref(false)

const showShare = computed(() => {
  return navigator.share !== undefined || !isMobile.value
})

const progressOffset = computed(() => {
  const circumference = 2 * Math.PI * 18
  return circumference - (scrollProgress.value / 100) * circumference
})

const shareOptions = [
  {
    name: 'Twitter',
    icon: '/icons/twitter.svg',
    action: (url, title) => `https://twitter.com/intent/tweet?url=${url}&text=${title}`
  },
  {
    name: 'LinkedIn',
    icon: '/icons/linkedin.svg',
    action: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
  },
  {
    name: 'Copy Link',
    icon: '/icons/link.svg',
    action: async () => {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }
]

const updateScroll = () => {
  const winScroll = document.documentElement.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
  scrollProgress.value = (winScroll / height) * 100
  isVisible.value = winScroll > 300
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const toggleShare = () => {
  if (navigator.share && isMobile.value) {
    navigator.share({
      title: document.title,
      url: window.location.href
    })
  } else {
    isShareOpen.value = !isShareOpen.value
  }
}

const share = async (option) => {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(document.title)

  if (typeof option.action === 'function') {
    await option.action(url, title)
  } else {
    window.open(option.action(url, title), '_blank')
  }
  
  isShareOpen.value = false
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('scroll', updateScroll)
  window.addEventListener('resize', checkMobile)
  checkMobile()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScroll)
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.floating-actions {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 100;
}

.progress-ring {
  position: relative;
  width: 40px;
  height: 40px;
}

.progress-ring__circle {
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.progress-ring__background {
  stroke: var(--vp-c-bg-soft);
}

.progress-ring__progress {
  stroke: var(--vp-c-brand);
  stroke-dasharray: 113.097;
  transition: stroke-dashoffset 0.1s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  color: var(--vp-c-text-1);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--vp-c-bg-soft);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-button:hover {
  background: var(--vp-c-brand);
  transform: translateY(-2px);
}

.action-button svg {
  width: 24px;
  height: 24px;
  fill: var(--vp-c-text-1);
}

.action-button:hover svg {
  fill: white;
}

.share-modal {
  position: absolute;
  right: 100%;
  bottom: 0;
  margin-right: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.share-option:hover {
  background: var(--vp-c-bg-mute);
}

.share-option img {
  width: 20px;
  height: 20px;
}

/* Transitions */
.float-enter-active,
.float-leave-active {
  transition: all 0.3s ease;
}

.float-enter-from,
.float-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile styles */
.floating-actions.is-mobile {
  right: 1rem;
  bottom: 1rem;
}

@media (max-width: 768px) {
  .share-modal {
    right: 0;
    bottom: 100%;
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>