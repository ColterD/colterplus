<template>
  <div class="content-suggestions">
    <div class="difficulty-indicator" v-if="difficulty">
      <div class="difficulty-label">
        Reading Level:
        <span :class="difficultyClass">{{ difficulty }}</span>
      </div>
      <div class="difficulty-details">
        <div class="detail-item">
          <span class="label">Time:</span>
          <span>{{ readingTime }} min read</span>
        </div>
        <div class="detail-item">
          <span class="label">Prerequisites:</span>
          <div class="tags">
            <span 
              v-for="prereq in prerequisites" 
              :key="prereq"
              class="tag"
            >
              {{ prereq }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="related-content" v-if="relatedArticles.length">
      <h3>Related Articles</h3>
      <div class="suggestions-grid">
        <div 
          v-for="article in relatedArticles" 
          :key="article.path"
          class="suggestion-card"
          @click="navigateToArticle(article.path)"
        >
          <div class="card-content">
            <div class="card-header">
              <h4>{{ article.title }}</h4>
              <span class="reading-time">{{ article.readingTime }} min read</span>
            </div>
            <p class="excerpt">{{ article.excerpt }}</p>
            <div class="card-meta">
              <div class="tags">
                <span 
                  v-for="tag in article.tags" 
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
              <div 
                class="similarity-score"
                :style="{ '--score': article.similarityScore }"
              >
                {{ Math.round(article.similarityScore * 100) }}% match
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="reading-path" v-if="learningPath.length">
      <h3>Learning Path</h3>
      <div class="path-timeline">
        <div 
          v-for="(step, index) in learningPath" 
          :key="index"
          class="path-step"
          :class="{ 'completed': step.completed }"
        >
          <div class="step-indicator">
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-line" v-if="index < learningPath.length - 1"></div>
          </div>
          <div class="step-content">
            <h4>{{ step.title }}</h4>
            <p>{{ step.description }}</p>
            <button 
              class="step-action"
              @click="navigateToArticle(step.path)"
            >
              {{ step.completed ? 'Review' : 'Start' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()

const props = defineProps({
  currentPath: {
    type: String,
    required: true
  },
  tags: {
    type: Array,
    default: () => []
  }
})

const difficulty = ref('Intermediate')
const readingTime = ref(5)
const prerequisites = ref(['JavaScript', 'Vue.js Basics'])
const relatedArticles = ref([])
const learningPath = ref([])

// Compute difficulty class for styling
const difficultyClass = computed(() => {
  const levels = {
    'Beginner': 'difficulty-beginner',
    'Intermediate': 'difficulty-intermediate',
    'Advanced': 'difficulty-advanced'
  }
  return levels[difficulty.value] || ''
})

// Calculate content difficulty based on various factors
const calculateDifficulty = (content) => {
  // This is a simplified example - you can make this more sophisticated
  const factors = {
    wordCount: content.split(/\s+/).length,
    codeBlockCount: (content.match(/```/g) || []).length / 2,
    technicalTerms: (content.match(/\b(async|await|promise|component|reactive|computed)\b/gi) || []).length
  }

  if (factors.technicalTerms > 20 || factors.codeBlockCount > 5) {
    return 'Advanced'
  } else if (factors.technicalTerms > 10 || factors.codeBlockCount > 3) {
    return 'Intermediate'
  }
  return 'Beginner'
}

// Find related articles based on tags and content similarity
const findRelatedArticles = async () => {
  // This would typically fetch from your content database
  // For demo purposes, we'll use mock data
  relatedArticles.value = [
    {
      title: 'Getting Started with Vue 3',
      path: '/guide/vue3-basics',
      excerpt: 'Learn the fundamentals of Vue 3 composition API...',
      readingTime: 8,
      tags: ['Vue', 'JavaScript', 'Basics'],
      similarityScore: 0.85
    },
    {
      title: 'Advanced Component Patterns',
      path: '/guide/component-patterns',
      excerpt: 'Explore advanced patterns for building robust components...',
      readingTime: 12,
      tags: ['Vue', 'Components', 'Advanced'],
      similarityScore: 0.72
    }
  ]
}

// Generate learning path based on current article
const generateLearningPath = () => {
  learningPath.value = [
    {
      title: 'Vue.js Fundamentals',
      description: 'Master the basics of Vue.js framework',
      path: '/guide/fundamentals',
      completed: true
    },
    {
      title: 'Component Composition',
      description: 'Learn how to build and compose components',
      path: '/guide/components',
      completed: true
    },
    {
      title: 'Advanced State Management',
      description: 'Explore advanced state management patterns',
      path: '/guide/state-management',
      completed: false
    }
  ]
}

const navigateToArticle = (path) => {
  router.go(path)
}

onMounted(async () => {
  // In a real application, you would:
  // 1. Fetch the current article's content
  // 2. Analyze its complexity
  // 3. Find related content
  // 4. Generate appropriate learning path
  
  await findRelatedArticles()
  generateLearningPath()
})
</script>

<style scoped>
.content-suggestions {
  margin: 2rem 0;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.difficulty-indicator {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.difficulty-label {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}

.difficulty-beginner {
  color: var(--vp-c-green);
}

.difficulty-intermediate {
  color: var(--vp-c-brand);
}

.difficulty-advanced {
  color: var(--vp-c-red);
}

.difficulty-details {
  display: grid;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9em;
}

.label {
  color: var(--vp-c-text-2);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 2px 8px;
  background: var(--vp-c-bg-mute);
  border-radius: 4px;
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.suggestion-card {
  background: var(--vp-c-bg);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--vp-c-divider);
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-content {
  padding: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.card-header h4 {
  margin: 0;
  font-size: 1.1em;
  color: var(--vp-c-text-1);
}

.reading-time {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.excerpt {
  margin: 0.5rem 0;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.similarity-score {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
  background: linear-gradient(90deg, 
    var(--vp-c-brand) calc(var(--score) * 100%),
    var(--vp-c-bg-soft) calc(var(--score) * 100%)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.reading-path {
  margin-top: 2rem;
}

.path-timeline {
  margin-top: 1rem;
}

.path-step {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
}

.completed .step-number {
  background: var(--vp-c-brand);
  color: white;
}

.step-line {
  flex: 1;
  width: 2px;
  background: var(--vp-c-divider);
  margin: 4px 0;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-1);
}

.step-content p {
  margin: 0;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.step-action {
  margin-top: 0.5rem;
  padding: 4px 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-action:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

/* Mobile styles */
@media (max-width: 768px) {
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  .difficulty-details {
    grid-template-columns: 1fr;
  }
}
</style>