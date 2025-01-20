<template>
  <div 
    class="reading-progress"
    :class="{ 'is-visible': isVisible, 'is-mobile': isMobile }"
  >
    <div class="progress-container">
      <div class="progress-info">
        <div class="current-section" v-if="currentSection">
          {{ currentSection }}
        </div>
        <div class="progress-stats">
          <span class="time-remaining" v-if="timeRemaining > 0">
            {{ timeRemaining }} min left
          </span>
          <span class="progress-percentage">
            {{ Math.round(progress) }}%
          </span>
        </div>
      </div>
      
      <div class="progress-bar-container">
        <div 
          class="progress-bar"
          :style="{ width: `${progress}%` }"
        ></div>
        
        <div class="section-markers">
          <div
            v-for="(section, index) in sections"
            :key="index"
            class="section-marker"
            :class="{ 'is-active': currentSectionIndex >= index }"
            :style="{ left: `${section.position}%` }"
            :title="section.title"
          >
            <div class="marker-tooltip">{{ section.title }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mini-toc" v-if="!isMobile">
      <div 
        v-for="(section, index) in sections"
        :key="index"
        class="toc-item"
        :class="{ 
          'is-active': currentSectionIndex === index,
          'is-past': currentSectionIndex > index
        }"
        @click="scrollToSection(section.element)"
      >
        {{ section.title }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)
const isMobile = ref(false)
const progress = ref(0)
const currentSection = ref('')
const currentSectionIndex = ref(0)
const timeRemaining = ref(0)
const sections = ref([])

const calculateReadingTime = (text) => {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

const detectSections = () => {
  const headings = Array.from(document.querySelectorAll('h2, h3'))
  const contentHeight = document.documentElement.scrollHeight - window.innerHeight
  
  sections.value = headings.map((heading, index) => {
    const position = (heading.offsetTop / contentHeight) * 100
    return {
      title: heading.textContent,
      position,
      element: heading
    }
  })
}

const updateProgress = () => {
  const winScroll = window.pageYOffset || document.documentElement.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
  progress.value = (winScroll / height) * 100

  // Update current section
  const scrollPosition = window.scrollY + window.innerHeight / 3
  let currentIndex = sections.value.length - 1

  for (let i = 0; i < sections.value.length; i++) {
    if (sections.value[i].element.offsetTop > scrollPosition) {
      currentIndex = Math.max(0, i - 1)
      break
    }
  }

  currentSectionIndex.value = currentIndex
  currentSection.value = sections.value[currentIndex]?.title || ''

  // Update time remaining
  const remainingHeight = height - winScroll
  const remainingText = document.documentElement.innerText.slice(
    Math.floor((winScroll / height) * document.documentElement.innerText.length)
  )
  timeRemaining.value = calculateReadingTime(remainingText)

  // Show/hide based on scroll position
  isVisible.value = winScroll > 100
}

const scrollToSection = (element) => {
  const offset = 80 // Adjust based on your header height
  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - offset

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  })
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  detectSections()
  updateProgress()
  checkMobile()
  
  window.addEventListener('scroll', updateProgress)
  window.addEventListener('resize', () => {
    checkMobile()
    detectSections()
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-divider);
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  z-index: 100;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reading-progress.is-visible {
  transform: translateY(0);
}

.progress-container {
  max-width: 1200px;
  margin: 0 auto;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.current-section {
  color: var(--vp-c-text-1);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
}

.progress-stats {
  display: flex;
  gap: 16px;
  color: var(--vp-c-text-2);
}

.progress-bar-container {
  position: relative;
  height: 4px;
  background: var(--vp-c-bg-soft);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--vp-c-brand);
  transition: width 0.2s ease;
}

.section-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
}

.section-marker {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--vp-c-text-3);
  transform: translateX(-50%);
  transition: background-color 0.2s ease;
}

.section-marker.is-active {
  background: var(--vp-c-brand);
}

.marker-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 0.8em;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
}

.section-marker:hover .marker-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-4px);
}

.mini-toc {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  max-height: 80vh;
  overflow-y: auto;
}

.toc-item {
  padding: 4px 8px;
  margin: 2px 0;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toc-item:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.toc-item.is-active {
  background: var(--vp-c-brand);
  color: white;
}

.toc-item.is-past {
  color: var(--vp-c-text-3);
}

/* Mobile styles */
.reading-progress.is-mobile .mini-toc {
  display: none;
}

.reading-progress.is-mobile .progress-info {
  font-size: 0.8em;
}

/* Scrollbar styles */
.mini-toc::-webkit-scrollbar {
  width: 4px;
}

.mini-toc::-webkit-scrollbar-track {
  background: var(--vp-c-bg-soft);
}

.mini-toc::-webkit-scrollbar-thumb {
  background: var(--vp-c-text-3);
  border-radius: 2px;
}

.mini-toc::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-2);
}
</style>