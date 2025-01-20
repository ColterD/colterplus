<template>
  <div class="skeleton-wrapper">
    <div class="skeleton-header">
      <div class="skeleton-title"></div>
      <div class="skeleton-meta">
        <div class="skeleton-date"></div>
        <div class="skeleton-reading-time"></div>
      </div>
    </div>
    
    <div class="skeleton-content">
      <div v-for="n in 3" :key="n" class="skeleton-paragraph">
        <div class="skeleton-line" v-for="l in 4" :key="l"
             :style="{ width: `${Math.random() * 40 + 60}%` }">
        </div>
      </div>
    </div>
    
    <div class="skeleton-footer">
      <div class="skeleton-tags">
        <div class="skeleton-tag" v-for="n in 3" :key="n"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-wrapper {
  padding: 20px;
  background: var(--vp-c-bg);
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-header {
  margin-bottom: 24px;
}

.skeleton-title {
  height: 32px;
  width: 80%;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  margin-bottom: 16px;
  animation: pulse 1.5s infinite;
}

.skeleton-meta {
  display: flex;
  gap: 16px;
}

.skeleton-date,
.skeleton-reading-time {
  height: 20px;
  width: 100px;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.skeleton-paragraph {
  margin-bottom: 24px;
}

.skeleton-line {
  height: 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  margin-bottom: 8px;
  animation: pulse 1.5s infinite;
}

.skeleton-tags {
  display: flex;
  gap: 8px;
}

.skeleton-tag {
  height: 24px;
  width: 80px;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>