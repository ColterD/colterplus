<template>
  <div class="search-container">
    <div
      class="search-button"
      role="button"
      tabindex="0"
      @click="openSearch"
      @keyup.enter="openSearch"
    >
      <svg class="search-icon" viewBox="0 0 24 24">
        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.43,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.43C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
      </svg>
      <span class="search-text">Search... <kbd>⌘</kbd><kbd>K</kbd></span>
    </div>

    <Transition name="fade">
      <div v-if="isOpen" class="search-modal" @click="closeOnBackdrop">
        <div class="search-modal-content" ref="modalContent">
          <div class="search-header">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              @keydown.esc="closeSearch"
              @keydown.up.prevent="navigateResults(-1)"
              @keydown.down.prevent="navigateResults(1)"
              @keydown.enter="selectResult"
            >
            <button class="close-button" @click="closeSearch">
              <span class="sr-only">Close</span>
              ✕
            </button>
          </div>

          <div v-if="recentSearches.length && !searchQuery" class="recent-searches">
            <h3>Recent Searches</h3>
            <ul>
              <li v-for="search in recentSearches" :key="search">
                <button @click="loadRecentSearch(search)">
                  <svg viewBox="0 0 24 24">
                    <path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3" />
                  </svg>
                  {{ search }}
                </button>
              </li>
            </ul>
          </div>

          <div v-if="searchQuery" class="search-results">
            <div v-if="loading" class="loading">
              <div class="spinner"></div>
            </div>
            <div v-else-if="results.length" class="results-list">
              <div
                v-for="(result, index) in results"
                :key="result.id"
                :class="['result-item', { active: index === activeIndex }]"
                @click="selectResult(result)"
                @mouseenter="activeIndex = index"
              >
                <h4>{{ result.title }}</h4>
                <p v-if="result.excerpt" v-html="highlightMatch(result.excerpt)"></p>
                <div class="meta">
                  <span v-if="result.section">{{ result.section }}</span>
                  <span v-if="result.readingTime">{{ result.readingTime }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="searchQuery" class="no-results">
              No results found for "{{ searchQuery }}"
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()
const isOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)
const modalContent = ref(null)
const loading = ref(false)
const results = ref([])
const activeIndex = ref(0)
const recentSearches = ref([])

// Load recent searches from localStorage
onMounted(() => {
  recentSearches.value = JSON.parse(localStorage.getItem('recentSearches') || '[]')
  
  // Add keyboard shortcut listener
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    openSearch()
  }
}

function openSearch() {
  isOpen.value = true
  // Focus input after transition
  setTimeout(() => {
    searchInput.value?.focus()
  }, 100)
}

function closeSearch() {
  isOpen.value = false
  searchQuery.value = ''
}

function closeOnBackdrop(e) {
  if (!modalContent.value?.contains(e.target)) {
    closeSearch()
  }
}

function navigateResults(direction) {
  if (results.value.length) {
    activeIndex.value = (activeIndex.value + direction + results.value.length) % results.value.length
  }
}

function selectResult(result) {
  if (result) {
    addToRecentSearches(searchQuery.value)
    router.go(result.url)
    closeSearch()
  }
}

function loadRecentSearch(query) {
  searchQuery.value = query
}

function addToRecentSearches(query) {
  if (query && !recentSearches.value.includes(query)) {
    recentSearches.value.unshift(query)
    recentSearches.value = recentSearches.value.slice(0, 5) // Keep only 5 recent searches
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
  }
}

function highlightMatch(text) {
  if (!searchQuery.value) return text
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Debounced search
let searchTimeout
watch(searchQuery, (newQuery) => {
  loading.value = true
  clearTimeout(searchTimeout)
  
  if (!newQuery) {
    results.value = []
    loading.value = false
    return
  }

  searchTimeout = setTimeout(async () => {
    // Implement your search logic here
    // This is a placeholder that you'll need to replace with your actual search implementation
    results.value = [] // Replace with actual search results
    loading.value = false
  }, 300)
})
</script>

<style scoped>
.search-container {
  position: relative;
}

.search-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-button:hover {
  background: var(--vp-c-bg-soft);
}

.search-icon {
  width: 20px;
  height: 20px;
  fill: var(--vp-c-text-2);
}

.search-text {
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.search-text kbd {
  display: inline-block;
  padding: 2px 4px;
  font-size: 0.8em;
  line-height: 1;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.2);
}

.search-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 80px;
  z-index: 100;
}

.search-modal-content {
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  background: var(--vp-c-bg);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
}

/* Add more styles for results, animations, etc. */
</style>

<template>
  <!-- In your existing Search.vue -->
  <div class="advanced-search-link">
    <a href="/search">Advanced Search</a>
  </div>
</template>