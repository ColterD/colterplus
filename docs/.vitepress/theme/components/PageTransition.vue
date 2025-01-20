<template>
  <div class="page-container">
    <Transition
      name="fade-slide"
      mode="out-in"
      @before-enter="onBeforeEnter"
      @after-enter="onAfterEnter"
      @enter-cancelled="onEnterCancelled"
    >
      <div v-if="!isLoading" class="page-content">
        <slot></slot>
      </div>
      <PageSkeleton v-else />
    </Transition>
    
    <div class="page-progress" v-show="isNavigating">
      <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vitepress'
import PageSkeleton from './PageSkeleton.vue'

const router = useRouter()
const isLoading = ref(true)
const isNavigating = ref(false)
const progress = ref(0)
let progressInterval

const startProgress = () => {
  progress.value = 0
  progressInterval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 10
    }
  }, 200)
}

const completeProgress = () => {
  progress.value = 100
  clearInterval(progressInterval)
  setTimeout(() => {
    isNavigating.value = false
    progress.value = 0
  }, 200)
}

onMounted(() => {
  // Simulate initial page load
  setTimeout(() => {
    isLoading.value = false
  }, 500)

  // Handle route changes
  router.onBeforeRouteChange = () => {
    isNavigating.value = true
    startProgress()
  }

  router.onAfterRouteChanged = () => {
    completeProgress()
  }
})

const onBeforeEnter = () => {
  document.body.style.overflow = 'hidden'
}

const onAfterEnter = () => {
  document.body.style.overflow = ''
}

const onEnterCancelled = () => {
  document.body.style.overflow = ''
}
</script>

<style scoped>
.page-container {
  position: relative;
  min-height: 200px;
}

.page-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  z-index: 1000;
}

.progress-bar {
  height: 100%;
  background: var(--vp-c-brand);
  transition: width 0.2s ease;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>