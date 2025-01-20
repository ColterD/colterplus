<template>
  <div class="search-analytics">
    <div class="trending-searches" v-if="trendingSearches.length">
      <h3>
        <span class="icon trending">🔥</span>
        Trending Searches
      </h3>
      <div class="trending-list">
        <button
          v-for="search in trendingSearches"
          :key="search.term"
          class="trending-item"
          @click="executeSearch(search.term)"
        >
          <div class="trend-info">
            <span class="trend-term">{{ search.term }}</span>
            <span class="trend-count">{{ search.count }} searches</span>
          </div>
          <div class="trend-change" :class="search.trend">
            {{ search.trend === 'up' ? '↑' : '↓' }}
            {{ search.change }}%
          </div>
        </button>
      </div>
    </div>

    <div class="search-insights">
      <div class="insights-header">
        <h3>Search Insights</h3>
        <div class="time-filter">
          <button
            v-for="period in timePeriods"
            :key="period"
            :class="{ active: currentPeriod === period }"
            @click="changeTimePeriod(period)"
          >
            {{ period }}
          </button>
        </div>
      </div>

      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-header">
            <span class="icon">🎯</span>
            <h4>Most Clicked</h4>
          </div>
          <div class="insight-content">
            <div
              v-for="result in topResults"
              :key="result.path"
              class="insight-item"
            >
              <span class="item-title">{{ result.title }}</span>
              <span class="item-stat">{{ result.clicks }} clicks</span>
            </div>
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-header">
            <span class="icon">⚡</span>
            <h4>Quick Finds</h4>
          </div>
          <div class="insight-content">
            <div
              v-for="term in quickFinds"
              :key="term.query"
              class="insight-item"
            >
              <span class="item-title">{{ term.query }}</span>
              <span class="item-stat">{{ term.time }}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="search-suggestions">
      <h3>You Might Be Interested In</h3>
      <div class="suggestions-grid">
        <button
          v-for="suggestion in personalizedSuggestions"
          :key="suggestion.term"
          class="suggestion-item"
          @click="executeSearch(suggestion.term)"
        >
          <div class="suggestion-content">
            <span class="suggestion-term">{{ suggestion.term }}</span>
            <span class="suggestion-category">{{ suggestion.category }}</span>
          </div>
          <div class="relevance-score">
            {{ Math.round(suggestion.relevance * 100) }}% relevant
          </div>
        </button>
      </div>
    </div>

    <div class="recent-searches" v-if="recentSearches.length">
      <div class="recent-header">
        <h3>Recent Searches</h3>
        <button class="clear-button" @click="clearRecentSearches">
          Clear History
        </button>
      </div>
      <div class="recent-list">
        <div
          v-for="search in recentSearches"
          :key="search.timestamp"
          class="recent-item"
        >
          <div class="search-info">
            <span class="search-term" @click="executeSearch(search.term)">
              {{ search.term }}
            </span>
            <span class="search-time">
              {{ formatTime(search.timestamp) }}
            </span>
          </div>
          <button
            class="remove-search"
            @click="removeRecentSearch(search.timestamp)"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <div class="analytics-graph" v-if="showGraph">
      <canvas ref="searchGraph"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

// State
const trendingSearches = ref([
  { term: 'Vue 3 Composition API', count: 156, trend: 'up', change: 23 },
  { term: 'TypeScript Setup', count: 98, trend: 'up', change: 15 },
  { term: 'Vite Configuration', count: 87, trend: 'down', change: 8 }
])

const topResults = ref([
  { title: 'Getting Started Guide', path: '/guide', clicks: 234 },
  { title: 'API Reference', path: '/api', clicks: 189 },
  { title: 'Best Practices', path: '/best-practices', clicks: 145 }
])

const quickFinds = ref([
  { query: 'installation', time: 1.2 },
  { query: 'deployment', time: 1.5 },
  { query: 'configuration', time: 1.8 }
])

const personalizedSuggestions = ref([
  { term: 'Advanced Components', category: 'Components', relevance: 0.95 },
  { term: 'State Management', category: 'Architecture', relevance: 0.88 },
  { term: 'Performance Tips', category: 'Optimization', relevance: 0.82 }
])

const recentSearches = ref([])
const currentPeriod = ref('Week')
const timePeriods = ['Day', 'Week', 'Month']
const searchGraph = ref(null)
const showGraph = ref(true)

// Methods
const executeSearch = (term) => {
  // Implement search execution
  console.log('Searching for:', term)
  addToRecentSearches(term)
  updateSearchAnalytics(term)
}

const addToRecentSearches = (term) => {
  const search = {
    term,
    timestamp: Date.now()
  }
  
  recentSearches.value.unshift(search)
  if (recentSearches.value.length > 10) {
    recentSearches.value.pop()
  }
  
  saveRecentSearches()
}

const removeRecentSearch = (timestamp) => {
  recentSearches.value = recentSearches.value.filter(
    search => search.timestamp !== timestamp
  )
  saveRecentSearches()
}

const clearRecentSearches = () => {
  recentSearches.value = []
  localStorage.removeItem('recent-searches')
}

const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}

const changeTimePeriod = (period) => {
  currentPeriod.value = period
  updateGraph()
}

const updateSearchAnalytics = (term) => {
  // Update analytics data
  const analytics = JSON.parse(localStorage.getItem('search-analytics') || '{}')
  analytics[term] = (analytics[term] || 0) + 1
  localStorage.setItem('search-analytics', JSON.stringify(analytics))
  updateGraph()
}

const saveRecentSearches = () => {
  localStorage.setItem('recent-searches', JSON.stringify(recentSearches.value))
}

const loadRecentSearches = () => {
  const saved = localStorage.getItem('recent-searches')
  if (saved) {
    recentSearches.value = JSON.parse(saved)
  }
}

const updateGraph = () => {
  if (!searchGraph.value) return
  
  const ctx = searchGraph.value.getContext('2d')
  if (searchGraph.value.chart) {
    searchGraph.value.chart.destroy()
  }
  
  // Sample data - replace with real analytics
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Search Volume',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: true,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }
  
  searchGraph.value.chart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

// Lifecycle hooks
onMounted(() => {
  loadRecentSearches()
  updateGraph()
})

watch(currentPeriod, () => {
  updateGraph()
})
</script>

<style scoped>
.search-analytics {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.trending-searches {
  margin-bottom: 2rem;
}

h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1.1em;
  color: var(--vp-c-text-1);
}

.icon {
  font-size: 1.2em;
}

.trending-list {
  display: grid;
  gap: 0.5rem;
}

.trending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trending-item:hover {
  background: var(--vp-c-bg-mute);
}

.trend-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.trend-term {
  font-weight: 500;
}

.trend-count {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.trend-change {
  font-size: 0.9em;
}

.trend-change.up {
  color: var(--vp-c-green);
}

.trend-change.down {
  color: var(--vp-c-red);
}

.search-insights {
  margin-bottom: 2rem;
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.time-filter {
  display: flex;
  gap: 0.5rem;
}

.time-filter button {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-filter button.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.insight-card {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1rem;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.insight-header h4 {
  margin: 0;
  font-size: 1em;
}

.insight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.insight-item:last-child {
  border-bottom: none;
}

.item-title {
  font-size: 0.9em;
}

.item-stat {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.suggestion-item {
  padding: 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-item:hover {
  background: var(--vp-c-bg-mute);
}

.suggestion-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.suggestion-term {
  font-weight: 500;
}

.suggestion-category {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.relevance-score {
  margin-top: 0.5rem;
  font-size: 0.8em;
  color: var(--vp-c-brand);
}

.recent-searches {
  margin-top: 2rem;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.clear-button {
  padding: 0.25rem 0.75rem;
  background: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.search-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-term {
  cursor: pointer;
  color: var(--vp-c-brand);
}

.search-time {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.remove-search {
  padding: 0.25rem 0.5rem;
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 1.2em;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.remove-search:hover {
  opacity: 1;
}

.analytics-graph {
  margin-top: 2rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

/* Mobile styles */
@media (max-width: 768px) {
  .insights-grid {
    grid-template-columns: 1fr;
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  .insights-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .time-filter {
    width: 100%;
    justify-content: center;
  }
}
</style>