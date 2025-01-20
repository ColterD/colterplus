<template>
  <div 
    class="comparison-table-wrapper"
    :class="{ 'is-scrollable': isScrollable }"
  >
    <!-- Table Header Controls -->
    <div class="table-controls">
      <div class="table-title" v-if="title">
        <h3>{{ title }}</h3>
        <p v-if="description" class="table-description">
          {{ description }}
        </p>
      </div>

      <div class="table-actions">
        <!-- View Toggle -->
        <div class="view-toggle" v-if="allowViewToggle">
          <button
            v-for="view in viewOptions"
            :key="view.id"
            :class="{ active: currentView === view.id }"
            @click="currentView = view.id"
            :title="view.label"
          >
            <i :class="view.icon"></i>
          </button>
        </div>

        <!-- Feature Filter -->
        <div class="feature-filter" v-if="allowFiltering">
          <div class="search-input">
            <i class="i-carbon-search"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filter features..."
            >
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="clear-search"
            >
              <i class="i-carbon-close"></i>
            </button>
          </div>
        </div>

        <!-- Column Toggle -->
        <div class="column-toggle" v-if="allowColumnToggle">
          <button
            class="toggle-button"
            @click="showColumnSelect = !showColumnSelect"
          >
            <i class="i-carbon-table"></i>
            Columns
          </button>
          
          <div v-if="showColumnSelect" class="column-select">
            <div
              v-for="column in columns"
              :key="column.id"
              class="column-option"
            >
              <label>
                <input
                  type="checkbox"
                  v-model="visibleColumns"
                  :value="column.id"
                >
                {{ column.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div 
      v-if="currentView === 'table'"
      class="comparison-table"
      ref="tableRef"
    >
      <table>
        <thead>
          <tr>
            <!-- Feature Column Header -->
            <th class="feature-column">
              <div class="header-content">
                {{ featureColumnLabel }}
                <button 
                  v-if="allowSorting"
                  @click="toggleSort"
                  class="sort-button"
                  :class="{ active: sortDirection !== null }"
                >
                  <i :class="getSortIcon()"></i>
                </button>
              </div>
            </th>
            
            <!-- Dynamic Column Headers -->
            <th
              v-for="column in filteredColumns"
              :key="column.id"
              :class="[
                `column-${column.id}`,
                { 'highlight': column.highlight }
              ]"
            >
              <div class="header-content">
                <span>{{ column.label }}</span>
                <span 
                  v-if="column.subLabel"
                  class="sub-label"
                >
                  {{ column.subLabel }}
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Category Groups -->
          <template v-for="(group, groupIndex) in filteredFeatures" :key="group.category">
            <!-- Category Header -->
            <tr 
              v-if="group.category"
              class="category-row"
              :class="{ 'expanded': expandedCategories.includes(group.category) }"
            >
              <td :colspan="filteredColumns.length + 1">
                <button @click="toggleCategory(group.category)">
                  <i class="i-carbon-caret-right"></i>
                  {{ group.category }}
                </button>
              </td>
            </tr>

            <!-- Feature Rows -->
            <tr
              v-for="feature in group.features"
              :key="feature.id"
              v-show="!group.category || expandedCategories.includes(group.category)"
              class="feature-row"
            >
              <!-- Feature Name -->
              <td class="feature-column">
                <div class="feature-name">
                  {{ feature.name }}
                  <i
                    v-if="feature.tooltip"
                    class="i-carbon-information"
                    v-tooltip="feature.tooltip"
                  ></i>
                </div>
                <div 
                  v-if="feature.description"
                  class="feature-description"
                >
                  {{ feature.description }}
                </div>
              </td>

              <!-- Feature Values -->
              <td
                v-for="column in filteredColumns"
                :key="column.id"
                :class="[
                  `column-${column.id}`,
                  { 'highlight': column.highlight }
                ]"
              >
                <div class="feature-value">
                  <!-- Boolean Value -->
                  <template v-if="isBoolean(feature.values[column.id])">
                    <i
                      :class="getBooleanIcon(feature.values[column.id])"
                      :style="{ color: getBooleanColor(feature.values[column.id]) }"
                    ></i>
                  </template>

                  <!-- Rating Value -->
                  <template v-else-if="isRating(feature.values[column.id])">
                    <div class="rating-stars">
                      <i
                        v-for="n in 5"
                        :key="n"
                        :class="getRatingIcon(feature.values[column.id], n)"
                      ></i>
                    </div>
                  </template>

                  <!-- Custom Component -->
                  <component
                    v-else-if="isComponent(feature.values[column.id])"
                    :is="feature.values[column.id].component"
                    v-bind="feature.values[column.id].props"
                  />

                  <!-- Default Text Value -->
                  <template v-else>
                    {{ feature.values[column.id] }}
                  </template>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Card View -->
    <div 
      v-else
      class="comparison-cards"
    >
      <div
        v-for="column in filteredColumns"
        :key="column.id"
        class="comparison-card"
        :class="{ 'highlight': column.highlight }"
      >
        <!-- Card Header -->
        <div class="card-header">
          <h4>{{ column.label }}</h4>
          <span 
            v-if="column.subLabel"
            class="sub-label"
          >
            {{ column.subLabel }}
          </span>
        </div>

        <!-- Card Content -->
        <div class="card-content">
          <div
            v-for="(group, groupIndex) in filteredFeatures"
            :key="group.category"
            class="card-group"
          >
            <!-- Category Header -->
            <div 
              v-if="group.category"
              class="card-category"
              :class="{ 'expanded': expandedCategories.includes(group.category) }"
            >
              <button @click="toggleCategory(group.category)">
                <i class="i-carbon-caret-right"></i>
                {{ group.category }}
              </button>
            </div>

            <!-- Feature Items -->
            <div
              v-for="feature in group.features"
              :key="feature.id"
              v-show="!group.category || expandedCategories.includes(group.category)"
              class="card-feature"
            >
              <div class="feature-label">
                {{ feature.name }}
                <i
                  v-if="feature.tooltip"
                  class="i-carbon-information"
                  v-tooltip="feature.tooltip"
                ></i>
              </div>
              
              <div class="feature-value">
                <!-- Boolean Value -->
                <template v-if="isBoolean(feature.values[column.id])">
                  <i
                    :class="getBooleanIcon(feature.values[column.id])"
                    :style="{ color: getBooleanColor(feature.values[column.id]) }"
                  ></i>
                </template>

                <!-- Rating Value -->
                <template v-else-if="isRating(feature.values[column.id])">
                  <div class="rating-stars">
                    <i
                      v-for="n in 5"
                      :key="n"
                      :class="getRatingIcon(feature.values[column.id], n)"
                    ></i>
                  </div>
                </template>

                <!-- Custom Component -->
                <component
                  v-else-if="isComponent(feature.values[column.id])"
                  :is="feature.values[column.id].component"
                  v-bind="feature.values[column.id].props"
                />

                <!-- Default Text Value -->
                <template v-else>
                  {{ feature.values[column.id] }}
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div 
      v-if="filteredFeatures.length === 0"
      class="no-results"
    >
      <i class="i-carbon-search"></i>
      <p>No features match your search</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  featureColumnLabel: {
    type: String,
    default: 'Features'
  },
  columns: {
    type: Array,
    required: true,
    /* Example format:
    [
      {
        id: 'basic',
        label: 'Basic Plan',
        subLabel: '$10/month',
        highlight: false
      }
    ]
    */
  },
  features: {
    type: Array,
    required: true,
    /* Example format:
    [
      {
        category: 'General', // optional
        features: [
          {
            id: 'feature1',
            name: 'Feature Name',
            description: 'Feature description', // optional
            tooltip: 'More info', // optional
            values: {
              basic: true,
              pro: '10GB',
              enterprise: { component: 'CustomValue', props: { ... } }
            }
          }
        ]
      }
    ]
    */
  },
  allowViewToggle: {
    type: Boolean,
    default: true
  },
  allowFiltering: {
    type: Boolean,
    default: true
  },
  allowColumnToggle: {
    type: Boolean,
    default: true
  },
  allowSorting: {
    type: Boolean,
    default: true
  },
  defaultView: {
    type: String,
    default: 'table'
  }
})

const { theme } = useData()

// State
const currentView = ref(props.defaultView)
const searchQuery = ref('')
const sortDirection = ref(null)
const expandedCategories = ref([])
const visibleColumns = ref(props.columns.map(col => col.id))
const showColumnSelect = ref(false)
const isScrollable = ref(false)
const tableRef = ref(null)

// View Options
const viewOptions = [
  { id: 'table', label: 'Table View', icon: 'i-carbon-table' },
  { id: 'cards', label: 'Card View', icon: 'i-carbon-cards' }
]

// Computed
const filteredColumns = computed(() => {
  return props.columns.filter(col => visibleColumns.value.includes(col.id))
})

const filteredFeatures = computed(() => {
  const filtered = props.features.map(group => {
    const filteredFeatures = group.features.filter(feature => {
      if (!searchQuery.value) return true
      
      const searchRegex = new RegExp(searchQuery.value, 'i')
      return (
        searchRegex.test(feature.name) ||
        searchRegex.test(feature.description || '') ||
        Object.values(feature.values).some(value => 
          typeof value === 'string' && searchRegex.test(value)
        )
      )
    })

    if (filteredFeatures.length === 0) return null

    return {
      ...group,
      features: sortFeatures(filteredFeatures)
    }
  }).filter(Boolean)

  return filtered
})

// Methods
const sortFeatures = (features) => {
  if (!sortDirection.value) return features

  return [...features].sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()
    
    return sortDirection.value === 'asc'
      ? aName.localeCompare(bName)
      : bName.localeCompare(aName)
  })
}

const toggleSort = () => {
  if (sortDirection.value === null) {
    sortDirection.value = 'asc'
  } else if (sortDirection.value === 'asc') {
    sortDirection.value = 'desc'
  } else {
    sortDirection.value = null
  }
}

const getSortIcon = () => {
  switch (sortDirection.value) {
    case 'asc':
      return 'i-carbon-sort-ascending'
    case 'desc':
      return 'i-carbon-sort-descending'
    default:
      return 'i-carbon-sort'
  }
}

const toggleCategory = (category) => {
  const index = expandedCategories.value.indexOf(category)
  if (index === -1) {
    expandedCategories.value.push(category)
  } else {
    expandedCategories.value.splice(index, 1)
  }
}

const isBoolean = (value) => {
  return typeof value === 'boolean'
}

const getBooleanIcon = (value) => {
  return value 
    ? 'i-carbon-checkmark-filled' 
    : 'i-carbon-close-filled'
}

const getBooleanColor = (value) => {
  return value 
    ? 'var(--vp-c-green)' 
    : 'var(--vp-c-red)'
}

const isRating = (value) => {
  return typeof value === 'number' && value >= 0 && value <= 5
}

const getRatingIcon = (rating, position) => {
  if (rating >= position) {
    return 'i-carbon-star-filled'
  } else if (rating >= position - 0.5) {
    return 'i-carbon-star-half'
  } else {
    return 'i-carbon-star'
  }
}

const isComponent = (value) => {
  return value && typeof value === 'object' && value.component
}

const checkScrollable = () => {
  if (!tableRef.value) return
  
  const table = tableRef.value
  isScrollable.value = table.scrollWidth > table.clientWidth
}

// Lifecycle
onMounted(() => {
  // Expand all categories by default
  expandedCategories.value = props.features
    .filter(group => group.category)
    .map(group => group.category)

  // Check if table is scrollable
  checkScrollable()
  window.addEventListener('resize', checkScrollable)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScrollable)
})

// Watch for changes that might affect scrollability
watch(
  [() => filteredColumns.value.length, currentView],
  () => {
    nextTick(checkScrollable)
  }
)

// Click outside handling for column toggle
const handleClickOutside = (event) => {
  const toggle = document.querySelector('.column-toggle')
  if (
    showColumnSelect.value &&
    toggle &&
    !toggle.contains(event.target)
  ) {
    showColumnSelect.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Expose methods for external use
defineExpose({
  expandAll: () => {
    expandedCategories.value = props.features
      .filter(group => group.category)
      .map(group => group.category)
  },
  collapseAll: () => {
    expandedCategories.value = []
  },
  resetView: () => {
    currentView.value = props.defaultView
    searchQuery.value = ''
    sortDirection.value = null
    visibleColumns.value = props.columns.map(col => col.id)
  }
})
</script>

<style scoped>
.comparison-table-wrapper {
  width: 100%;
  overflow: hidden;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

/* Table Controls */
.table-controls {
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-title h3 {
  margin: 0;
  font-size: 1.25rem;
}

.table-description {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.table-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
}

.view-toggle button {
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.view-toggle button:hover {
  background: var(--vp-c-bg-mute);
}

.view-toggle button.active {
  background: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand);
}

/* Feature Filter */
.feature-filter {
  min-width: 200px;
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input i {
  position: absolute;
  left: 0.75rem;
  color: var(--vp-c-text-2);
}

.search-input input {
  width: 100%;
  padding: 0.5rem 2.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

/* Column Toggle */
.column-toggle {
  position: relative;
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
}

.column-select {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 200px;
}

.column-option {
  padding: 0.5rem;
}

.column-option label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Table View */
.comparison-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}

th {
  background: var(--vp-c-bg-soft);
  font-weight: 500;
}

.feature-column {
  position: sticky;
  left: 0;
  background: var(--vp-c-bg-soft);
  min-width: 200px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sub-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  font-weight: normal;
}

.sort-button {
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.sort-button:hover,
.sort-button.active {
  opacity: 1;
}

/* Category Rows */
.category-row {
  background: var(--vp-c-bg-soft);
}

.category-row button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: var(--vp-c-text);
  cursor: pointer;
  font-weight: 500;
  text-align: left;
}

.category-row i {
  transition: transform 0.2s ease;
}

.category-row.expanded i {
  transform: rotate(90deg);
}

/* Feature Rows */
.feature-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.feature-description {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.feature-value {
  display: flex;
  align-items: center;
  min-height: 24px;
}

/* Card View */
.comparison-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.comparison-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.comparison-card.highlight {
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 1px var(--vp-c-brand);
}

.card-header {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.card-header h4 {
  margin: 0;
}

.card-content {
  padding: 1rem;
}

.card-category {
  margin: 1rem 0;
}

.card-category button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border: none;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text);
  cursor: pointer;
  font-weight: 500;
  text-align: left;
  border-radius: 4px;
}

.card-feature {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.card-feature:last-child {
  border-bottom: none;
}

.feature-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* Rating Stars */
.rating-stars {
  display: flex;
  gap: 0.25rem;
  color: var(--vp-c-yellow);
}

/* No Results */
.no-results {
  padding: 3rem;
  text-align: center;
  color: var(--vp-c-text-2);
}

.no-results i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* Scrollable Indicator */
.is-scrollable::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 30px;
  background: linear-gradient(
    to right,
    transparent,
    var(--vp-c-bg) 50%
  );
  pointer-events: none;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .table-actions {
    flex-wrap: wrap;
  }

  .feature-filter {
    width: 100%;
  }

  .comparison-cards {
    grid-template-columns: 1fr;
  }
}
</style>