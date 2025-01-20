<template>
  <Teleport to="body">
    <TransitionRoot appear :show="isOpen">
      <div class="lightbox-overlay" @click="closeLightbox">
        <TransitionChild
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="lightbox-container" @click.stop>
            <div class="lightbox-content">
              <div class="lightbox-header">
                <span class="image-count" v-if="images.length > 1">
                  {{ currentIndex + 1 }} / {{ images.length }}
                </span>
                <button class="close-button" @click="closeLightbox" aria-label="Close lightbox">
                  <svg viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                  </svg>
                </button>
              </div>

              <div class="image-container" ref="imageContainer">
                <img
                  :src="currentImage.src"
                  :alt="currentImage.alt"
                  @mousedown="startPan"
                  @mousemove="pan"
                  @mouseup="endPan"
                  @wheel="handleZoom"
                  :style="imageStyle"
                >
              </div>

              <div class="lightbox-controls">
                <button
                  v-if="images.length > 1"
                  class="nav-button prev"
                  @click="prevImage"
                  :disabled="currentIndex === 0"
                  aria-label="Previous image"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                </button>

                <div class="zoom-controls">
                  <button @click="zoomOut" aria-label="Zoom out">
                    <svg viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </button>
                  <button @click="zoomIn" aria-label="Zoom in">
                    <svg viewBox="0 0 24 24">
                      <path d="M19 13H5v-2h14v2z"/>
                    </svg>
                  </button>
                  <button @click="resetZoom" aria-label="Reset zoom">
                    <svg viewBox="0 0 24 24">
                      <path d="M14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2-9c-4.97 0-9 4.03-9 9H0l4 4 4-4H5c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.44C8.04 20.3 9.94 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                    </svg>
                  </button>
                </div>

                <button
                  v-if="images.length > 1"
                  class="nav-button next"
                  @click="nextImage"
                  :disabled="currentIndex === images.length - 1"
                  aria-label="Next image"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </TransitionChild>
      </div>
    </TransitionRoot>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { TransitionRoot, TransitionChild } from '@headlessui/vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  startIndex: {
    type: Number,
    default: 0
  }
})

const isOpen = ref(false)
const currentIndex = ref(props.startIndex)
const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const startPosition = ref({ x: 0, y: 0 })
const imageContainer = ref(null)

const currentImage = computed(() => props.images[currentIndex.value])

const imageStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
  cursor: isPanning.value ? 'grabbing' : 'grab'
}))

const openLightbox = (index) => {
  currentIndex.value = index
  isOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  isOpen.value = false
  document.body.style.overflow = ''
  resetZoom()
}

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
    resetZoom()
  }
}

const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetZoom()
  }
}

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.5, 3)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.5, 0.5)
}

const resetZoom = () => {
  scale.value = 1
  position.value = { x: 0, y: 0 }
}

const handleZoom = (e) => {
  e.preventDefault()
  const delta = e.deltaY * -0.01
  scale.value = Math.max(0.5, Math.min(3, scale.value + delta))
}

const startPan = (e) => {
  isPanning.value = true
  startPosition.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
}

const pan = (e) => {
  if (!isPanning.value) return
  
  position.value = {
    x: e.clientX - startPosition.value.x,
    y: e.clientY - startPosition.value.y
  }
}

const endPan = () => {
  isPanning.value = false
}

const handleKeydown = (e) => {
  if (!isOpen.value) return

  switch (e.key) {
    case 'ArrowRight':
      nextImage()
      break
    case 'ArrowLeft':
      prevImage()
      break
    case 'Escape':
      closeLightbox()
      break
    case '+':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      resetZoom()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Expose methods to template refs
defineExpose({
  openLightbox,
  closeLightbox
})
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.lightbox-container {
  max-width: 90vw;
  max-height: 90vh;
  position: relative;
}

.lightbox-content {
  position: relative;
  display: flex;
  flex-direction: column;
}

.lightbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  color: white;
}

.image-count {
  font-size: 0.9rem;
  opacity: 0.8;
}

.close-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-button:hover {
  opacity: 1;
}

.close-button svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.image-container {
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.image-container img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  transition: transform 0.2s ease;
  user-select: none;
}

.lightbox-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.nav-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.nav-button:hover:not(:disabled) {
  opacity: 1;
}

.nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-button svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.zoom-controls {
  display: flex;
  gap: 1rem;
}

.zoom-controls button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.zoom-controls button:hover {
  opacity: 1;
}

.zoom-controls svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

/* Transitions */
.ease-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-300 {
  transition-duration: 300ms;
}

.opacity-0 {
  opacity: 0;
}

.opacity-100 {
  opacity: 1;
}
</style>