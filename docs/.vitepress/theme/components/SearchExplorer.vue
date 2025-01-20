<template>
  <div class="search-explorer">
    <!-- Header -->
    <div class="explorer-header">
      <h1>Advanced Search</h1>
      <div class="search-stats" v-if="totalResults">
        {{ totalResults }} results ({{ searchTime }}ms)
      </div>
    </div>

    <!-- Main Search Interface -->
    <div class="search-interface">
      <!-- Search Input -->
      <div class="search-input-wrapper">
        <div class="search-field">
          <i class="i-carbon-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search documentation..."
            @input="handleSearch"
            ref="searchInput"
          >
          <button 
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-btn"
          >
            <i class="i-carbon-close"></i>
          </button>
        </div>
        <div class="search-actions">
          <button
            class="view-toggle"
            @click="toggleView"
            :title="isGridView ? 'Switch to list view' : 'Switch to grid view'"
          >
            <i :class="isGridView ? 'i-carbon-list' : 'i-carbon-grid'"></i>
          </button>
          <button
            class="save-search"
            @click="saveCurrentSearch"
            :disabled="!searchQuery"
            title="Save this search"
          >
            <i class="i-carbon-bookmark"></i>
          </button>
        </div>
      </div>

      <!-- Search History -->
      <div 
        v-if="searchHistory.length"
        class="search-history"
      >
        <span class="history-label">Recent:</span>
        <div class="history-tags">
          <button
            v-for="(item, index) in recentSearches"
            :key="index"
            class="history-tag"
            @click="applyHistorySearch(item)"
          >
            {{ item }}
            <i class="i-carbon-close" @click.stop="removeFromHistory(index)"></i>
          </button>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="search-content">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar">
          <div class="filters-header">
            <h3>Filters</h3>
            <button 
              v-if="hasActiveFilters"
              @click="clearAllFilters"
              class="clear-filters"
            >
              Clear all
            </button>
          </div>

          <!-- Category Filter -->
          <div class="filter-group">
            <h4>Categories</h4>
            <div class="filter-options">
              <label 
                v-for="category in categories"
                :key="category.id"
                class="checkbox-label"
              >
                <input
                  type="checkbox"
                  v-model="selectedCategories"
                  :value="category.id"
                >
                {{ category.name }}
                <span class="count">({{ category.count }})</span>
              </label>
            </div>
          </div>

          <!-- Date Filter -->
          <div class="filter-group">
            <h4>Date Range</h4>
            <div class="date-filters">
              <select v-model="dateFilter">
                <option value="all">All time</option>
                <option value="day">Last 24 hours</option>
                <option value="week">Last week</option>
                <option value="month">Last month</option>
                <option value="year">Last year</option>
                <option value="custom">Custom range</option>
              </select>
              
              <div 
                v-if="dateFilter === 'custom'"
                class="custom-date-range"
              >
                <input
                  type="date"
                  v-model="customDateRange.start"
                  :max="today"
                >
                <span>to</span>
                <input
                  type="date"
                  v-model="customDateRange.end"
                  :max="today"
                >
              </div>
            </div>
          </div>

          <!-- Type Filter -->
          <div class="filter-group">
            <h4>Content Type</h4>
            <div class="filter-options">
              <label 
                v-for="type in contentTypes"
                :key="type.id"
                class="checkbox-label"
              >
                <input
                  type="checkbox"
                  v-model="selectedTypes"
                  :value="type.id"
                >
                {{ type.name }}
                <span class="count">({{ type.count }})</span>
              </label>
            </div>
          </div>

          <!-- Tags Filter -->
          <div class="filter-group">
            <h4>Tags</h4>
            <div class="tags-input">
              <div class="selected-tags">
                <span
                  v-for="tag in selectedTags"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                  <button @click="removeTag(tag)">×</button>
                </span>
              </div>
              <input
                v-model="tagInput"
                @keyup.enter="addTag"
                placeholder="Add tag..."
                list="available-tags"
              >
              <datalist id="available-tags">
                <option
                  v-for="tag in availableTags"
                  :key="tag"
                  :value="tag"
                />
              </datalist>
            </div>
          </div>
        </aside>

        <!-- Results Area -->
        <main class="results-area">
          <!-- Results Header -->
          <div class="results-header">
            <div class="results-count">
              {{ filteredResults.length }} results
            </div>
            <div class="sort-controls">
              <select v-model="sortBy">
                <option value="relevance">Most Relevant</option>
                <option value="date">Latest</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>

          <!-- Results Grid/List -->
          <div 
            class="results-container"
            :class="{ 'grid-view': isGridView }"
          >
            <TransitionGroup name="result">
              <div
                v-for="result in paginatedResults"
                :key="result.id"
                class="result-card"
                :class="{ 'grid-item': isGridView }"
              >
                <!-- Result Header -->
                <div class="result-header">
                  <div class="result-type">
                    <i :class="getTypeIcon(result.type)"></i>
                    {{ result.type }}
                  </div>
                  <div class="result-meta">
                    <span class="date">
                      {{ formatDate(result.date) }}
                    </span>
                    <span 
                      v-if="result.readingTime"
                      class="reading-time"
                    >
                      {{ result.readingTime }} min read
                    </span>
                  </div>
                </div>

                <!-- Result Content -->
                <div class="result-content">
                  <h3>
                    <a :href="result.url">
                      {{ result.title }}
                    </a>
                  </h3>
                  <p class="result-excerpt">
                    {{ result.excerpt }}
                  </p>
                  
                  <!-- Code Preview if available -->
                  <pre
                    v-if="result.codeSnippet"
                    class="code-preview"
                  ><code>{{ result.codeSnippet }}</code></pre>

                  <!-- Result Tags -->
                  <div class="result-tags">
                    <span
                      v-for="tag in result.tags"
                      :key="tag"
                      class="tag"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>

                <!-- Result Footer -->
                <div class="result-footer">
                  <div class="result-metrics">
                    <span class="views">
                      <i class="i-carbon-view"></i>
                      {{ formatNumber(result.views) }}
                    </span>
                    <span class="likes">
                      <i class="i-carbon-favorite"></i>
                      {{ formatNumber(result.likes) }}
                    </span>
                  </div>
                  <button 
                    class="bookmark-btn"
                    :class="{ active: isBookmarked(result.id) }"
                    @click="toggleBookmark(result)"
                  >
                    <i :class="isBookmarked(result.id) ? 'i-carbon-bookmark-filled' : 'i-carbon-bookmark'"></i>
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Pagination -->
          <div 
            v-if="totalPages > 1"
            class="pagination"
          >
            <button
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              <i class="i-carbon-arrow-left"></i>
              Previous
            </button>
            <div class="page-numbers">
              <button
                v-for="page in displayedPages"
                :key="page"
                :class="{ active: currentPage === page }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>
            <button
              :disabled="currentPage === totalPages"
              @click="nextPage"
            >
              Next
              <i class="i-carbon-arrow-right"></i>
            </button>
          </div>
        </main>
      </div>
    </div>

    <!-- Saved Searches Modal -->
    <teleport to="body">
      <modal-dialog
        v-if="showSavedSearches"
        @close="showSavedSearches = false"
        title="Saved Searches"
      >
        <div class="saved-searches">
          <div
            v-for="(search, index) in savedSearches"
            :key="index"
            class="saved-search-item"
          >
            <div class="saved-search-info">
              <h4>{{ search.name || search.query }}</h4>
              <p class="search-details">
                {{ formatDate(search.date) }} • 
                {{ search.filters.length }} filters
              </p>
            </div>
            <div class="saved-search-actions">
              <button
                @click="applySavedSearch(search)"
                title="Apply this search"
              >
                <i class="i-carbon-play"></i>
              </button>
              <button
                @click="deleteSavedSearch(index)"
                title="Delete saved search"
              >
                <i class="i-carbon-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </modal-dialog>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useData } from 'vitepress'
import ModalDialog from './ModalDialog.vue'

const { theme } = useData()

// State
const searchQuery = ref('')
const isGridView = ref(true)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showSavedSearches = ref(false)
const searchTime = ref(0)
const isLoading = ref(false)
const tagInput = ref('')
const dateFilter = ref('all')
const sortBy = ref('relevance')

// Filters State
const selectedCategories = ref([])
const selectedTypes = ref([])
const selectedTags = ref([])
const customDateRange = ref({
  start: '',
  end: ''
})

// Search History
const searchHistory = ref([])
const savedSearches = ref([])

// Mock Data (Replace with actual data source)
const categories = [
  { id: 'docs', name: 'Documentation', count: 156 },
  { id: 'api', name: 'API Reference', count: 89 },
  { id: 'guides', name: 'Guides', count: 45 },
  { id: 'tutorials', name: 'Tutorials', count: 32 }
]

const contentTypes = [
  { id: 'article', name: 'Articles', count: 124 },
  { id: 'video', name: 'Videos', count: 45 },
  { id: 'code', name: 'Code Examples', count: 78 },
  { id: 'reference', name: 'References', count: 92 }
]

const availableTags = [
  'javascript', 'vue', 'react', 'typescript', 'api',
  'frontend', 'backend', 'database', 'security'
]

// Computed
const hasActiveFilters = computed(() => {
  return selectedCategories.value.length > 0 ||
    selectedTypes.value.length > 0 ||
    selectedTags.value.length > 0 ||
    dateFilter.value !== 'all'
})

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const recentSearches = computed(() => {
  return searchHistory.value.slice(0, 5)
})

const filteredResults = computed(() => {
  let results = [...mockResults] // Replace with actual results

  // Apply filters
  if (selectedCategories.value.length) {
    results = results.filter(r => selectedCategories.value.includes(r.category))
  }

  if (selectedTypes.value.length) {
    results = results.filter(r => selectedTypes.value.includes(r.type))
  }

  if (selectedTags.value.length) {
    results = results.filter(r => 
      selectedTags.value.every(tag => r.tags.includes(tag))
    )
  }

  // Apply date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    let cutoff = new Date()

    switch (dateFilter.value) {
      case 'day':
        cutoff.setDate(now.getDate() - 1)
        break
      case 'week':
        cutoff.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoff.setMonth(now.getMonth() - 1)
        break
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1)
        break
      case 'custom':
        if (customDateRange.value.start && customDateRange.value.end) {
          results = results.filter(r => {
            const date = new Date(r.date)
            return date >= new Date(customDateRange.value.start) &&
                   date <= new Date(customDateRange.value.end)
          })
        }
        break
    }

    if (dateFilter.value !== 'custom') {
      results = results.filter(r => new Date(r.date) >= cutoff)
    }
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'date':
      results.sort((a, b) => new Date(b.date) - new Date(a.date))
      break
    case 'popularity':
      results.sort((a, b) => b.views - a.views)
      break
    default: // relevance
      // Implement relevance scoring logic
      break
  }

  return results
})

const totalResults = computed(() => filteredResults.value.length)

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / itemsPerPage.value)
})

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredResults.value.slice(start, end)
})

const displayedPages = computed(() => {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= totalPages.value; i++) {
    if (
      i === 1 ||
      i === totalPages.value ||
      (i >= currentPage.value - delta && i <= currentPage.value + delta)
    ) {
      range.push(i)
    }
  }

  range.forEach(i => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
})

// Methods
const handleSearch = () => {
  // Debounce implementation
  clearTimeout(handleSearch.timeout)
  handleSearch.timeout = setTimeout(async () => {
    if (!searchQuery.value.trim()) return

    isLoading.value = true
    const start = performance.now()

    try {
      // Implement actual search logic
      await mockSearchDelay()
      
      // Add to search history
      if (!searchHistory.value.includes(searchQuery.value)) {
        searchHistory.value.unshift(searchQuery.value)
        if (searchHistory.value.length > 10) {
          searchHistory.value.pop()
        }
      }
    } finally {
      isLoading.value = false
      searchTime.value = Math.round(performance.now() - start)
    }
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const toggleView = () => {
  isGridView.value = !isGridView.value
}

const addTag = () => {
  const tag = tagInput.value.trim().toLowerCase()
  if (tag && !selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (tag) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

const clearAllFilters = () => {
  selectedCategories.value = []
  selectedTypes.value = []
  selectedTags.value = []
  dateFilter.value = 'all'
  customDateRange.value = { start: '', end: '' }
}

const saveCurrentSearch = () => {
  const search = {
    query: searchQuery.value,
    filters: {
      categories: [...selectedCategories.value],
      types: [...selectedTypes.value],
      tags: [...selectedTags.value],
      date: dateFilter.value,
      customRange: { ...customDateRange.value }
    },
    date: new Date().toISOString()
  }

  savedSearches.value.unshift(search)
  // Optionally save to localStorage
  localStorage.setItem('savedSearches', JSON.stringify(savedSearches.value))
}

const applySavedSearch = (search) => {
  searchQuery.value = search.query
  selectedCategories.value = search.filters.categories
  selectedTypes.value = search.filters.types
  selectedTags.value = search.filters.tags
  dateFilter.value = search.filters.date
  customDateRange.value = search.filters.customRange
  showSavedSearches.value = false
  handleSearch()
}

const deleteSavedSearch = (index) => {
  savedSearches.value.splice(index, 1)
  localStorage.setItem('savedSearches', JSON.stringify(savedSearches.value))
}

const applyHistorySearch = (query) => {
  searchQuery.value = query
  handleSearch()
}

const removeFromHistory = (index) => {
  searchHistory.value.splice(index, 1)
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPage = (page) => {
  currentPage.value = page
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num)
}

const getTypeIcon = (type) => {
  const icons = {
    article: 'i-carbon-document',
    video: 'i-carbon-video',
    code: 'i-carbon-code',
    reference: 'i-carbon-book'
  }
  return icons[type] || 'i-carbon-document'
}

const isBookmarked = (id) => {
  // Implement bookmark check logic
  return false
}

const toggleBookmark = (result) => {
  // Implement bookmark toggle logic
}

// Mock helpers
const mockSearchDelay = () => new Promise(resolve => setTimeout(resolve, 500))

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1
})

watch([selectedCategories, selectedTypes, selectedTags, dateFilter], () => {
  currentPage.value = 1
}, { deep: true })

// Lifecycle
onMounted(() => {
  // Load saved searches from localStorage
  const saved = localStorage.getItem('savedSearches')
  if (saved) {
    savedSearches.value = JSON.parse(saved)
  }

  // Focus search input
  document.querySelector('.search-field input')?.focus()
})
</script>

<style scoped>
.search-explorer {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.explorer-header h1 {
  margin: 0;
}

.search-stats {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

/* Search Input */
.search-input-wrapper {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-field {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  gap: 0.5rem;
}

.search-field input {
  flex: 1;
  border: none;
  background: none;
  font-size: 1rem;
  color: var(--vp-c-text);
  outline: none;
}

.search-field i {
  color: var(--vp-c-text-2);
  font-size: 1.25rem;
}

.search-actions {
  display: flex;
  gap: 0.5rem;
}

.search-actions button {
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-actions button:hover {
  background: var(--vp-c-bg-soft);
}

/* Search History */
.search-history {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.history-label {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.history-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-tag:hover {
  background: var(--vp-c-bg-mute);
}

/* Main Content Layout */
.search-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
}

/* Filters Sidebar */
.filters-sidebar {
  position: sticky;
  top: 2rem;
  height: fit-content;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h3 {
  margin: 0;
}

.clear-filters {
  font-size: 0.875rem;
  color: var(--vp-c-brand);
  background: none;
  border: none;
  cursor: pointer;
}

.filter-group {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.filter-group:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.filter-group h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.count {
  color: var(--vp-c-text-2);
  margin-left: auto;
}

.date-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-filters select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

.custom-date-range {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-date-range input {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

/* Results Area */
.results-area {
  min-width: 0; /* Prevents grid blow-out */
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.results-count {
  color: var(--vp-c-text-2);
}

.sort-controls select {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

/* Results Grid/List View */
.results-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.results-container.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.result-card {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.result-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.result-content h3 {
  margin: 0 0 0.5rem 0;
}

.result-content a {
  color: var(--vp-c-text);
  text-decoration: none;
}

.result-content a:hover {
  color: var(--vp-c-brand);
}

.result-excerpt {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  line-height: 1.6;
}

.code-preview {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  font-size: 0.875rem;
  overflow-x: auto;
}

.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.result-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.result-metrics {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.result-metrics span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.bookmark-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.bookmark-btn.active {
  color: var(--vp-c-brand);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

/* Saved Searches Modal */
.saved-searches {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.saved-search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.saved-search-info h4 {
  margin: 0 0 0.25rem 0;
}

.search-details {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.saved-search-actions {
  display: flex;
  gap: 0.5rem;
}

/* Transitions */
.result-enter-active,
.result-leave-active {
  transition: all 0.3s ease;
}

.result-enter-from,
.result-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .search-explorer {
    padding: 1rem;
  }

  .search-content {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
    margin-bottom: 1.5rem;
  }

  .results-container.grid-view {
    grid-template-columns: 1fr;
  }

  .search-input-wrapper {
    flex-direction: column;
  }

  .search-actions {
    justify-content: flex-end;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>