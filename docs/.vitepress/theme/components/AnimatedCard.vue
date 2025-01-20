<template>
  <div 
    class="animated-card"
    :class="{ 'has-hover': enableHover }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="card-content" :style="transformStyle">
      <div class="card-image" v-if="image">
        <img 
          :src="image" 
          :alt="imageAlt"
          loading="lazy"
          @load="handleImageLoad"
        >
        <div class="image-skeleton" v-if="!imageLoaded"></div>
      </div>
      
      <div class="card-body">
        <div class="card-meta" v-if="date || readTime">
          <time v-if="date">{{ formatDate(date) }}</time>
          <span v-if="date && readTime" class="meta-divider">·</span>
          <span v-if="readTime">{{ readTime }}</span>
        </div>
        
        <h3 class="card-title">{{ title }}</h3>
        
        <p class="card-excerpt">{{ excerpt }}</p>
        
        <div class="card-tags" v-if="tags && tags.length">
          <span 
            v-for="tag in tags" 
            :key="tag"
            class="tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>
      
      <div class="card-footer">
        <slot name="footer">
          <button class="read-more">
            Read More
            <svg class="arrow-icon" viewBox="0 0 24 24">
              <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
            </svg>
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: String,
  excerpt: String,
  image: String,
  imageAlt: String,
  date: String,
  readTime: String,
  tags: Array,
  enableHover: {
    type: Boolean,
    default: true
  }
})

const imageLoaded = ref(false)
const mousePosition = ref({ x: 0, y: 0 })
const isHovered = ref(false)

const transformStyle = computed(() => {
  if (!props.enableHover || !isHovered.value) return {}
  
  const { x, y } = mousePosition.value
  const transform = `
    perspective(1000px)
    rotateX(${(y - 50) * 0.02}deg)
    rotateY(${(x - 50) * 0.02}deg)
  `
  return { transform }
})

const handleMouseEnter = (e) => {
  if (!props.enableHover) return
  isHovered.value = true
  updateMousePosition(e)
}

const handleMouseLeave = () => {
  isHovered.value = false
}

const updateMousePosition = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  mousePosition.value = { x, y }
}

const handleImageLoad = () => {
  imageLoaded.value = true
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.animated-card {
  position: relative;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition: all 0.3s ease;
  overflow: hidden;
}

.animated-card.has-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
}

.card-content {
  padding: 20px;
  transition: transform 0.1s ease;
}

.card-image {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.card-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.animated-card:hover .card-image img {
  transform: scale(1.05);
}

.image-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--vp-c-bg-alt) 0%,
    var(--vp-c-bg-soft) 50%,
    var(--vp-c-bg-alt) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.meta-divider {
  color: var(--vp-c-divider);
}

.card-title {
  margin: 0 0 12px 0;
  font-size: 1.4em;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.card-excerpt {
  margin: 0 0 16px 0;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  padding: 4px 8px;
  font-size: 0.8em;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.tag:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-mute);
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.read-more {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: var(--vp-c-brand);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s ease;
}

.read-more:hover {
  color: var(--vp-c-brand-dark);
}

.arrow-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  transition: transform 0.2s ease;
}

.read-more:hover .arrow-icon {
  transform: translateX(4px);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Dark mode adjustments */
:root.dark .animated-card {
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .animated-card.has-hover:hover {
    transform: none;
    box-shadow: none;
  }
  
  .card-content {
    transform: none !important;
  }
}
</style>