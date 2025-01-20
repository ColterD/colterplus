// types/analytics.ts
export interface Metric {
  id: string
  title: string
  value: number
  trend: number
  history: number[]
}

export interface Activity {
  id: number
  type: 'view' | 'search' | 'interaction'
  text: string
  time: number
}

export interface Page {
  title: string
  path: string
  views: number
  avgTime: number
  bounceRate: number
}

export interface Insight {
  id: number
  type: 'trend' | 'warning' | 'success'
  icon: string
  title: string
  description: string
  metric?: {
    label: string
    value: string
  }
  action?: {
    label: string
    handler: string
  }
}

export interface ExportFormat {
  type: 'csv' | 'pdf' | 'json'
  label: string
  icon: string
}

// composables/useTimeRange.ts
import { ref, computed } from 'vue'
import { format, subDays } from 'date-fns'

export function useTimeRange() {
  const timeRanges = ['24h', '7d', '30d', '90d']
  const currentRange = ref('7d')
  const showCustomRange = ref(false)
  const customStartDate = ref('')
  const customEndDate = ref('')

  const today = computed(() => format(new Date(), 'yyyy-MM-dd'))
  
  const dateRange = computed(() => {
    if (currentRange.value === 'custom') {
      return {
        start: new Date(customStartDate.value),
        end: new Date(customEndDate.value)
      }
    }

    const end = new Date()
    const days = parseInt(currentRange.value)
    const start = subDays(end, days)
    
    return { start, end }
  })

  const changeTimeRange = (range: string) => {
    currentRange.value = range
    showCustomRange.value = false
  }

  const toggleCustomRange = () => {
    showCustomRange.value = !showCustomRange.value
    if (showCustomRange.value) {
      currentRange.value = 'custom'
    }
  }

  const applyCustomRange = () => {
    if (customStartDate.value && customEndDate.value) {
      showCustomRange.value = false
    }
  }

  return {
    timeRanges,
    currentRange,
    showCustomRange,
    customStartDate,
    customEndDate,
    today,
    dateRange,
    changeTimeRange,
    toggleCustomRange,
    applyCustomRange
  }
}

// composables/useAnalytics.ts
import { ref, computed } from 'vue'
import type { Metric, Activity, Page, Insight } from '../types/analytics'

export function useAnalytics() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const metrics = ref<Metric[]>([])
  const activities = ref<Activity[]>([])
  const pages = ref<Page[]>([])
  const insights = ref<Insight[]>([])

  const fetchAnalytics = async (start: Date, end: Date) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ start, end })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      metrics.value = data.metrics
      activities.value = data.activities
      pages.value = data.pages
      insights.value = data.insights
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An error occurred'
    } finally {
      isLoading.value = false
    }
  }

  const formattedMetrics = computed(() => 
    metrics.value.map(metric => ({
      ...metric,
      formattedValue: formatNumber(metric.value)
    }))
  )

  const recentActivities = computed(() => 
    activities.value
      .sort((a, b) => b.time - a.time)
      .slice(0, 10)
  )

  return {
    isLoading,
    error,
    metrics: formattedMetrics,
    activities: recentActivities,
    pages,
    insights,
    fetchAnalytics
  }
}

// composables/useExport.ts
import { ref } from 'vue'
import type { ExportFormat } from '../types/analytics'

export function useExport() {
  const exportStartDate = ref('')
  const exportEndDate = ref('')
  const isExporting = ref(false)
  const exportError = ref<string | null>(null)

  const exportFormats: ExportFormat[] = [
    { type: 'csv', label: 'CSV', icon: '📊' },
    { type: 'pdf', label: 'PDF', icon: '📄' },
    { type: 'json', label: 'JSON', icon: '{ }' }
  ]

  const exportData = async (format: 'csv' | 'pdf' | 'json') => {
    isExporting.value = true
    exportError.value = null

    try {
      const data = await prepareExportData(format)
      await downloadFile(data, format)
      window.$notify?.success('Export Success', `Data exported as ${format.toUpperCase()}`)
    } catch (e) {
      exportError.value = e instanceof Error ? e.message : 'Export failed'
      window.$notify?.error('Export Failed', exportError.value)
    } finally {
      isExporting.value = false
    }
  }

  return {
    exportStartDate,
    exportEndDate,
    isExporting,
    exportError,
    exportFormats,
    exportData
  }
}

<!-- components/MetricCard.vue -->
<template>
  <div 
    class="metric-card"
    :class="{ 'positive': metric.trend > 0, 'negative': metric.trend < 0 }"
  >
    <div class="metric-header">
      <h3>{{ metric.title }}</h3>
      <div class="metric-trend">
        {{ metric.trend > 0 ? '↑' : '↓' }}
        {{ Math.abs(metric.trend) }}%
      </div>
    </div>
    <div class="metric-value">{{ formatNumber(metric.value) }}</div>
    <div class="metric-chart">
      <apexchart
        type="area"
        :options="chartOptions"
        :series="[{ data: metric.history }]"
        height="50"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Metric } from '../types/analytics'
import { formatNumber } from '../utils/formatters'

const props = defineProps<{
  metric: Metric
}>()

const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    sparkline: { enabled: true },
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
    }
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.3,
      stops: [0, 90, 100]
    }
  },
  colors: [props.metric.trend >= 0 ? '#10B981' : '#EF4444'],
  tooltip: {
    enabled: true,
    theme: 'dark'
  }
}))
</script>

<style scoped>
.metric-card {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* ... (rest of the styles from original component) ... */
</style>

<!-- components/ChartCard.vue -->
<template>
  <div :class="['chart-card', { wide }]">
    <div class="chart-header">
      <h3>{{ title }}</h3>
      <div class="chart-controls" v-if="$slots.controls">
        <slot name="controls" />
      </div>
    </div>
    <div class="chart-content" :style="{ height }">
      <div v-if="loading" class="chart-loading">
        <div class="loading-spinner" />
      </div>
      <div v-else-if="error" class="chart-error">
        {{ error }}
      </div>
      <apexchart
        v-else
        :type="type"
        :options="chartOptions"
        :series="series"
        :height="height"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  type: string
  options: Record<string, any>
  series: any[]
  height?: string | number
  loading?: boolean
  error?: string | null
  wide?: boolean
}>()

const chartOptions = computed(() => ({
  ...props.options,
  theme: {
    mode: 'dark'
  },
  animations: {
    enabled: true,
    dynamicAnimation: {
      speed: 800
    }
  }
}))
</script>

<!-- components/ActivityFeed.vue -->
<template>
  <div class="activity-feed">
    <TransitionGroup 
      name="list"
      tag="div"
      class="activity-list"
    >
      <div 
        v-for="activity in activities"
        :key="activity.id"
        class="activity-item"
      >
        <div class="activity-icon" :class="activity.type">
          {{ activityIcons[activity.type] }}
        </div>
        <div class="activity-content">
          <div class="activity-text">{{ activity.text }}</div>
          <div class="activity-time">{{ formatRelativeTime(activity.time) }}</div>
        </div>
      </div>
    </TransitionGroup>
    <div 
      v-if="loading" 
      class="activity-loading"
    >
      Loading...
    </div>
    <div 
      v-if="error" 
      class="activity-error"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '../utils/formatters'
import type { Activity } from '../types/analytics'

defineProps<{
  activities: Activity[]
  loading?: boolean
  error?: string | null
}>()

const activityIcons = {
  view: '👀',
  search: '🔍',
  interaction: '💬'
}
</script>

<!-- components/InsightCard.vue -->
<template>
  <div 
    class="insight-card"
    :class="insight.type"
    role="article"
  >
    <div class="insight-icon">{{ insight.icon }}</div>
    <div class="insight-content">
      <h4>{{ insight.title }}</h4>
      <p>{{ insight.description }}</p>
      <div 
        v-if="insight.metric" 
        class="insight-metric"
      >
        <span class="metric-label">{{ insight.metric.label }}:</span>
        <span class="metric-value">{{ insight.metric.value }}</span>
      </div>
    </div>
    <button 
      v-if="insight.action"
      @click="handleAction"
      class="insight-action-btn"
    >
      {{ insight.action.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Insight } from '../types/analytics'

const props = defineProps<{
  insight: Insight
}>()

const emit = defineEmits<{
  (e: 'action', insight: Insight): void
}>()

const handleAction = () => {
  emit('action', props.insight)
}
</script>

<!-- components/ErrorBoundary.vue -->
<template>
  <div class="error-boundary">
    <slot v-if="!error" />
    <div v-else class="error-content">
      <h3>Something went wrong</h3>
      <p>{{ error }}</p>
      <button @click="retry">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)
const retry = () => {
  error.value = null
}

onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>

<!-- AnalyticsDashboard.vue -->
<template>
  <ErrorBoundary>
    <div 
      class="analytics-dashboard"
      role="region"
      aria-label="Analytics Dashboard"
    >
      <!-- Loading State -->
      <div 
        v-if="isLoading && !metrics.length" 
        class="dashboard-loading"
      >
        <LoadingSpinner />
      </div>

      <!-- Error State -->
      <div 
        v-else-if="error" 
        class="dashboard-error"
      >
        <AlertCircle class="error-icon" />
        <p>{{ error }}</p>
        <button @click="refreshData">Retry</button>
      </div>

      <template v-else>
        <!-- Dashboard Header -->
        <header class="dashboard-header">
          <h2>Site Analytics</h2>
          <div class="time-controls">
            <div class="time-range">
              <button 
                v-for="range in timeRanges"
                :key="range"
                :class="{ active: currentRange === range }"
                @click="changeTimeRange(range)"
                :aria-pressed="currentRange === range"
              >
                {{ range }}
              </button>
              <button 
                :class="{ active: currentRange === 'custom' }"
                @click="toggleCustomRange"
                :aria-expanded="showCustomRange"
              >
                Custom
              </button>
            </div>

            <Transition name="fade">
              <div 
                v-if="showCustomRange"
                class="custom-range-picker"
              >
                <input 
                  type="date" 
                  v-model="customStartDate"
                  :max="today"
                  aria-label="Start date"
                >
                <span>to</span>
                <input 
                  type="date" 
                  v-model="customEndDate"
                  :max="today"
                  aria-label="End date"
                >
                <button 
                  class="apply-range"
                  @click="applyCustomRange"
                  :disabled="!isValidDateRange"
                >
                  Apply
                </button>
              </div>
            </Transition>
          </div>
        </header>

        <!-- Metrics Grid -->
        <div class="metrics-grid">
          <MetricCard
            v-for="metric in metrics"
            :key="metric.id"
            :metric="metric"
            @click="handleMetricClick(metric)"
          />
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <ChartCard
            title="Page Views"
            type="area"
            :options="pageViewsOptions"
            :series="pageViewsSeries"
            :loading="chartsLoading"
            :error="chartsError"
            wide
          />

          <ChartCard
            title="Content Engagement"
            type="radar"
            :options="engagementOptions"
            :series="engagementSeries"
            :loading="chartsLoading"
            :error="chartsError"
          />

          <ChartCard
            title="User Activity"
            type="heatmap"
            :options="activityOptions"
            :series="activitySeries"
            :loading="chartsLoading"
            :error="chartsError"
          />
        </div>

        <!-- Data Tables -->
        <div class="data-tables">
          <div class="table-section">
            <h3>Top Pages</h3>
            <div class="table-wrapper">
              <VirtualScroller
                :items="topPages"
                :item-height="50"
                class="scroller"
              >
                <template #default="{ item: page }">
                  <div class="table-row">
                    <div class="page-title">{{ page.title }}</div>
                    <div>{{ formatNumber(page.views) }}</div>
                    <div>{{ formatTime(page.avgTime) }}</div>
                    <div>{{ page.bounceRate }}%</div>
                  </div>
                </template>
              </VirtualScroller>
            </div>
          </div>

          <div class="table-section">
            <h3>Recent Activity</h3>
            <ActivityFeed
              :activities="recentActivity"
              :loading="activitiesLoading"
              :error="activitiesError"
              @retry="fetchActivities"
            />
          </div>
        </div>

        <!-- Insights Section -->
        <div class="insights-section">
          <h3>Key Insights</h3>
          <div class="insights-grid">
            <InsightCard
              v-for="insight in insights"
              :key="insight.id"
              :insight="insight"
              @action="handleInsightAction"
            />
          </div>
        </div>

        <!-- Export Section -->
        <div class="export-section">
          <h3>Export Data</h3>
          <div class="export-options">
            <div class="export-date-range">
              <input 
                type="date" 
                v-model="exportStartDate"
                :max="today"
                aria-label="Export start date"
              >
              <span>to</span>
              <input 
                type="date" 
                v-model="exportEndDate"
                :max="today"
                aria-label="Export end date"
              >
            </div>
            <div class="export-buttons">
              <button 
                v-for="format in exportFormats"
                :key="format.type"
                class="export-button"
                @click="exportData(format.type)"
                :disabled="isExporting"
              >
                <span class="export-icon">{{ format.icon }}</span>
                {{ format.label }}
                <LoadingSpinner v-if="isExporting && currentExportFormat === format.type" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTimeRange } from '../composables/useTimeRange'
import { useAnalytics } from '../composables/useAnalytics'
import { useExport } from '../composables/useExport'
import { formatNumber, formatTime, formatRelativeTime } from '../utils/formatters'
import { chartOptions } from '../config/chartOptions'
import type { Metric, Insight } from '../types/analytics'

// Components
import ErrorBoundary from './ErrorBoundary.vue'
import MetricCard from './MetricCard.vue'
import ChartCard from './ChartCard.vue'
import ActivityFeed from './ActivityFeed.vue'
import InsightCard from './InsightCard.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { VirtualScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// Composables
const {
  timeRanges,
  currentRange,
  showCustomRange,
  customStartDate,
  customEndDate,
  today,
  dateRange,
  changeTimeRange,
  toggleCustomRange,
  applyCustomRange
} = useTimeRange()

const {
  isLoading,
  error,
  metrics,
  activities: recentActivity,
  pages: topPages,
  insights,
  fetchAnalytics
} = useAnalytics()

const {
  exportStartDate,
  exportEndDate,
  isExporting,
  exportError,
  exportFormats,
  exportData
} = useExport()

// Computed
const isValidDateRange = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return false
  return new Date(customStartDate.value) <= new Date(customEndDate.value)
})

const pageViewsOptions = computed(() => ({
  ...chartOptions.pageViews,
  theme: {
    mode: isDarkMode.value ? 'dark' : 'light'
  }
}))

// Methods
const refreshData = async () => {
  await fetchAnalytics(dateRange.value.start, dateRange.value.end)
}

const handleMetricClick = (metric: Metric) => {
  // Implementation for metric click handling
  console.log('Metric clicked:', metric)
}

const handleInsightAction = (insight: Insight) => {
  if (insight.action?.handler) {
    // Handle different insight actions
    console.log(`Handling insight action: ${insight.action.handler}`)
  }
}

// Watchers
watch(dateRange, () => {
  refreshData()
})

// Lifecycle
onMounted(() => {
  refreshData()
  
  // Set up real-time updates
  const updateInterval = setInterval(() => {
    refreshData()
  }, 30000) // Update every 30 seconds

  onUnmounted(() => {
    clearInterval(updateInterval)
  })
})
</script>

<style scoped>
/* Base styles remain the same as in the original component */
/* Add new transitions and animations */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Add responsive design improvements */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .data-tables {
    grid-template-columns: 1fr;
  }
}

/* Add dark mode support */
:root[data-theme="dark"] {
  /* Dark mode specific variables */
}

/* Add print styles */
@media print {
  .export-section,
  .time-controls {
    display: none;
  }
  
  .analytics-dashboard {
    background: white;
    color: black;
  }
}
</style>