<template>
  <div class="learning-progress">
    <div class="progress-header">
      <div class="progress-overview">
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-label">Overall Progress</span>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${overallProgress}%` }"
              >
                {{ Math.round(overallProgress) }}%
              </div>
            </div>
          </div>
          <div class="stat-grid">
            <div class="stat-box">
              <span class="stat-value">{{ completedSections }}</span>
              <span class="stat-label">Sections Complete</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">{{ earnedPoints }}</span>
              <span class="stat-label">Points Earned</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">{{ currentStreak }}</span>
              <span class="stat-label">Day Streak</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="latestAchievement" class="achievement-alert">
        <div class="achievement-icon">🏆</div>
        <div class="achievement-info">
          <h4>{{ latestAchievement.title }}</h4>
          <p>{{ latestAchievement.description }}</p>
        </div>
        <button class="close-alert" @click="dismissAchievement">×</button>
      </div>
    </div>

    <div class="learning-paths">
      <div 
        v-for="path in learningPaths" 
        :key="path.id"
        class="learning-path"
      >
        <div class="path-header">
          <h3>{{ path.title }}</h3>
          <div class="path-progress">
            {{ path.completedSections }}/{{ path.totalSections }} completed
          </div>
        </div>

        <div class="path-sections">
          <div 
            v-for="section in path.sections" 
            :key="section.id"
            class="section-item"
            :class="{
              'completed': section.completed,
              'current': section.isCurrent,
              'locked': section.locked
            }"
          >
            <div class="section-status">
              <div v-if="section.completed" class="status-icon completed">✓</div>
              <div v-else-if="section.locked" class="status-icon locked">🔒</div>
              <div v-else class="status-icon">●</div>
            </div>

            <div class="section-content">
              <div class="section-header">
                <h4>{{ section.title }}</h4>
                <span class="section-points">+{{ section.points }} pts</span>
              </div>
              <p class="section-description">{{ section.description }}</p>
              
              <div class="section-meta">
                <span class="reading-time">
                  {{ section.readingTime }} min read
                </span>
                <span 
                  v-if="section.difficulty"
                  class="difficulty-badge"
                  :class="section.difficulty.toLowerCase()"
                >
                  {{ section.difficulty }}
                </span>
              </div>

              <div class="section-progress" v-if="section.subsections">
                <div 
                  v-for="(subsection, index) in section.subsections"
                  :key="index"
                  class="subsection-item"
                  :class="{ completed: subsection.completed }"
                >
                  <span class="subsection-checkbox">
                    <input 
                      type="checkbox"
                      :checked="subsection.completed"
                      @change="toggleSubsection(section.id, index)"
                      :disabled="section.locked"
                    >
                  </span>
                  <span class="subsection-title">{{ subsection.title }}</span>
                </div>
              </div>

              <div class="section-actions">
                <button 
                  v-if="!section.completed && !section.locked"
                  class="start-button"
                  @click="startSection(section)"
                >
                  {{ section.isCurrent ? 'Continue' : 'Start' }}
                </button>
                <button 
                  v-if="section.completed"
                  class="review-button"
                  @click="reviewSection(section)"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="achievements-section">
      <h3>Achievements</h3>
      <div class="achievements-grid">
        <div 
          v-for="achievement in achievements"
          :key="achievement.id"
          class="achievement-card"
          :class="{ unlocked: achievement.unlocked }"
        >
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-content">
            <h4>{{ achievement.title }}</h4>
            <p>{{ achievement.description }}</p>
            <div class="achievement-progress" v-if="!achievement.unlocked">
              {{ achievement.progress }}/{{ achievement.required }}
            </div>
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

// State
const learningPaths = ref([
  {
    id: 1,
    title: 'Getting Started',
    completedSections: 2,
    totalSections: 4,
    sections: [
      {
        id: 101,
        title: 'Introduction',
        description: 'Basic concepts and setup',
        points: 10,
        readingTime: 5,
        difficulty: 'Beginner',
        completed: true,
        subsections: [
          { title: 'Overview', completed: true },
          { title: 'Installation', completed: true },
          { title: 'Configuration', completed: true }
        ]
      },
      {
        id: 102,
        title: 'Core Concepts',
        description: 'Understanding fundamental principles',
        points: 20,
        readingTime: 15,
        difficulty: 'Intermediate',
        completed: true,
        isCurrent: false,
        subsections: [
          { title: 'Components', completed: true },
          { title: 'State Management', completed: true },
          { title: 'Routing', completed: false }
        ]
      },
      {
        id: 103,
        title: 'Advanced Features',
        description: 'Exploring advanced capabilities',
        points: 30,
        readingTime: 25,
        difficulty: 'Advanced',
        completed: false,
        isCurrent: true,
        subsections: [
          { title: 'Custom Plugins', completed: false },
          { title: 'Performance Optimization', completed: false },
          { title: 'Security', completed: false }
        ]
      },
      {
        id: 104,
        title: 'Expert Techniques',
        description: 'Master-level concepts',
        points: 40,
        readingTime: 30,
        difficulty: 'Expert',
        locked: true,
        subsections: [
          { title: 'Architecture Patterns', completed: false },
          { title: 'Testing Strategies', completed: false },
          { title: 'Deployment', completed: false }
        ]
      }
    ]
  }
])

const achievements = ref([
  {
    id: 1,
    title: 'First Steps',
    description: 'Complete your first section',
    icon: '🎯',
    unlocked: true,
    progress: 1,
    required: 1
  },
  {
    id: 2,
    title: 'Quick Learner',
    description: 'Complete 5 sections',
    icon: '⚡',
    unlocked: false,
    progress: 2,
    required: 5
  },
  {
    id: 3,
    title: 'Persistent',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    unlocked: false,
    progress: 3,
    required: 7
  }
])

const latestAchievement = ref(null)
const currentStreak = ref(5)
const earnedPoints = ref(30)

// Computed
const completedSections = computed(() => {
  return learningPaths.value.reduce((total, path) => {
    return total + path.completedSections
  }, 0)
})

const overallProgress = computed(() => {
  const total = learningPaths.value.reduce((sum, path) => sum + path.totalSections, 0)
  return (completedSections.value / total) * 100
})

// Methods
const toggleSubsection = (sectionId, subsectionIndex) => {
  const section = findSection(sectionId)
  if (!section || section.locked) return

  const subsection = section.subsections[subsectionIndex]
  subsection.completed = !subsection.completed

  // Check if all subsections are completed
  const allCompleted = section.subsections.every(sub => sub.completed)
  if (allCompleted && !section.completed) {
    completeSection(section)
  }

  saveProgress()
}

const startSection = (section) => {
  if (section.locked) return
  
  section.isCurrent = true
  router.go(`/docs/${section.id}`)
}

const reviewSection = (section) => {
  router.go(`/docs/${section.id}`)
}

const completeSection = (section) => {
  section.completed = true
  section.isCurrent = false
  earnedPoints.value += section.points
  
  // Update path progress
  const path = learningPaths.value.find(p => 
    p.sections.some(s => s.id === section.id)
  )
  if (path) {
    path.completedSections++
  }

  checkAchievements()
  saveProgress()
}

const findSection = (sectionId) => {
  for (const path of learningPaths.value) {
    const section = path.sections.find(s => s.id === sectionId)
    if (section) return section
  }
  return null
}

const checkAchievements = () => {
  for (const achievement of achievements.value) {
    if (!achievement.unlocked) {
      switch (achievement.id) {
        case 1:
          if (completedSections.value >= 1) {
            unlockAchievement(achievement)
          }
          break
        case 2:
          if (completedSections.value >= 5) {
            unlockAchievement(achievement)
          }
          break
        case 3:
          if (currentStreak.value >= 7) {
            unlockAchievement(achievement)
          }
          break
      }
    }
  }
}

const unlockAchievement = (achievement) => {
  achievement.unlocked = true
  latestAchievement.value = achievement
  
  window.$notify?.success(
    'Achievement Unlocked!',
    achievement.title
  )
}

const dismissAchievement = () => {
  latestAchievement.value = null
}

const saveProgress = () => {
  localStorage.setItem('learning-progress', JSON.stringify({
    paths: learningPaths.value,
    achievements: achievements.value,
    points: earnedPoints.value,
    streak: currentStreak.value
  }))
}

const loadProgress = () => {
  const saved = localStorage.getItem('learning-progress')
  if (saved) {
    const data = JSON.parse(saved)
    learningPaths.value = data.paths
    achievements.value = data.achievements
    earnedPoints.value = data.points
    currentStreak.value = data.streak
  }
}

// Lifecycle
onMounted(() => {
  loadProgress()
})
</script>

<style scoped>
.learning-progress {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.progress-header {
  margin-bottom: 2rem;
}

.progress-overview {
  margin-bottom: 1rem;
}

.progress-stats {
  display: grid;
  gap: 1rem;
}

.stat-item {
  background: var(--vp-c-bg);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.progress-bar {
  height: 24px;
  background: var(--vp-c-bg-mute);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--vp-c-brand);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  transition: width 0.3s ease;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-box {
  background: var(--vp-c-bg);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5em;
  font-weight: 600;
  color: var(--vp-c-brand);
}

.stat-label {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.achievement-alert {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--vp-c-brand);
  color: white;
  border-radius: 6px;
  margin-top: 1rem;
}

.achievement-icon {
  font-size: 1.5em;
}

.achievement-info h4 {
  margin: 0;
}

.achievement-info p {
  margin: 0.25rem 0 0 0;
  opacity: 0.9;
}

.close-alert {
  margin-left: auto;
  background: none;
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.close-alert:hover {
  opacity: 1;
}

.learning-paths {
  margin-bottom: 2rem;
}

.learning-path {
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.path-header {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.path-header h3 {
  margin: 0;
}

.path-progress {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.section-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  transition: background-color 0.2s ease;
}

.section-item:last-child {
  border-bottom: none;
}

.section-item.completed {
  background: var(--vp-c-bg-soft);
}

.section-item.current {
  background: var(--vp-c-bg-alt);
}

.section-item.locked {
  opacity: 0.7;
  cursor: not-allowed;
}

.section-status {
  display: flex;
  align-items: center;
}

.status-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-2);
}

.status-icon.completed {
  background: var(--vp-c-green);
  color: white;
}

.status-icon.locked {
  background: var(--vp-c-text-3);
}

.section-content {
  flex: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.section-header h4 {
  margin: 0;
}

.section-points {
  font-size: 0.9em;
  color: var(--vp-c-brand);
}

.section-description {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.section-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.reading-time {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.difficulty-badge {
  font-size: 0.8em;
  padding: 2px 8px;
  border-radius: 12px;
}

.difficulty-badge.beginner {
  background: var(--vp-c-green);
  color: white;
}

.difficulty-badge.intermediate {
  background: var(--vp-c-brand);
  color: white;
}

.difficulty-badge.advanced {
  background: var(--vp-c-yellow);
  color: var(--vp-c-text-1);
}

.difficulty-badge.expert {
  background: var(--vp-c-red);
  color: white;
}

.section-progress {
  margin: 1rem 0;
}

.subsection-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.subsection-checkbox input {
  margin: 0;
}

.subsection-title {
  font-size: 0.9em;
}

.subsection-item.completed .subsection-title {
  color: var(--vp-c-text-2);
  text-decoration: line-through;
}

.section-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.start-button,
.review-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-button {
  background: var(--vp-c-brand);
  color: white;
  border: none;
}

.review-button {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.start-button:hover {
  background: var(--vp-c-brand-dark);
}

.review-button:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.achievements-section {
  margin-top: 2rem;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.achievement-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  opacity: 0.7;
}

.achievement-card.unlocked {
  opacity: 1;
  border-color: var(--vp-c-brand);
}

.achievement-card .achievement-icon {
  font-size: 2em;
}

.achievement-card h4 {
  margin: 0;
}

.achievement-card p {
  margin: 0.25rem 0;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.achievement-progress {
  margin-top: 0.5rem;
  font-size: 0.8em;
  color: var(--vp-c-brand);
}

/* Mobile styles */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
  
  .achievements-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .section-actions {
    flex-direction: column;
  }
  
  .section-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>