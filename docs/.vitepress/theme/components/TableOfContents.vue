<template>
  <div class="toc-container" :class="{ 'is-sticky': isSticky }">
    <div class="toc-header">On This Page</div>
    <nav class="toc-nav">
      <ul>
        <li
          v-for="(heading, index) in headings"
          :key="index"
          :class="[
            `level-${heading.level}`,
            { active: activeHeading === heading.id }
          ]"
        >
          <a
            :href="`#${heading.id}`"
            :class="{ active: activeHeading === heading.id }"
            @click.prevent="scrollToHeading(heading.id)"
          >
            {{ heading.title }}
          </a>
        </li>
      </ul>
    </nav>
    <div class="toc-progress">
      <div
        class="progress-bar"
        :style="{ width: `${readingProgress}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const headings = ref([])
const activeHeading = ref('')
const isSticky = ref(false)
const readingProgress = ref(0)

// Get all headings from the page
const getHeadings = () => {
  const articleHeadings = document.querySelectorAll('h2, h3, h4')
  headings.value = Array.from(articleHeadings).map(heading => ({
    id: heading.id,
    title: heading.textContent,
    level: parseInt(heading.tagName.charAt(1)),
    element: heading
  }))
}

// Smooth scroll to heading
const scrollToHeading = (id) => {
  const element = document.getElementById(id)
  if (element) {
    const offset = 80 // Adjust based on your header height
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

// Update active heading based on scroll position
const updateActiveHeading = () => {
  const headingElements = headings.value
  if (headingElements.length === 0) return

  // Calculate scroll position with offset
  const scrollPosition = window.scrollY + 100

  // Find the current heading
  for (let i = headingElements.length - 1; i >= 0; i--) {
    const heading = headingElements[i]
    const element = heading.element

    if (element.offsetTop <= scrollPosition) {
      activeHeading.value = heading.id
      break
    }
  }

  // Calculate reading progress
  const docElement = document.documentElement
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop
  const height = docElement.scrollHeight - docElement.clientHeight
  readingProgress.value = (winScroll / height) * 100
}

// Check if TOC should be sticky
const checkSticky = () => {
  const tocOffset = 300 // Adjust based on your layout
  isSticky.value = window.scrollY > tocOffset
}

// Lifecycle hooks
onMounted(() => {
  getHeadings()
  updateActiveHeading()
  window.addEventListener('scroll', updateActiveHeading)
  window.addEventListener('scroll', checkSticky)
  window.addEventListener('resize', getHeadings)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveHeading)
  window.removeEventListener('scroll', checkSticky)
  window.removeEventListener('resize', getHeadings)
})
</script>

<style scoped>
.toc-container {
  position: relative;
  width: 200px;
  padding: 1rem;
  margin-left: 2rem;
  transition: all 0.3s ease;
}

.toc-container.is-sticky {
  position: fixed;
  top: 80px; /* Adjust based on your header height */
}

.toc-header {
  font-size: 0.9em;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}

.toc-nav {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.toc-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-nav li {
  margin: 0.2rem 0;
  line-height: 1.4;
}

.toc-nav a {
  display: block;
  padding: 0.2rem 0;
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-size: 0.9em;
  transition: color 0.2s ease;
}

.toc-nav a:hover,
.toc-nav a.active {
  color: var(--vp-c-brand);
}

.toc-nav .level-2 { padding-left: 0; }
.toc-nav .level-3 { padding-left: 1rem; }
.toc-nav .level-4 { padding-left: 2rem; }

.toc-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: var(--vp-c-divider);
}

.progress-bar {
  height: 100%;
  background: var(--vp-c-brand);
  transition: width 0.2s ease;
}

/* Mobile styles */
@media (max-width: 768px) {
  .toc-container {
    display: none;
  }
}
</style>