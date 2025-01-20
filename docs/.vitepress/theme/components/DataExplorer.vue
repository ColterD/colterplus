<template>
  <div class="data-explorer">
    <!-- Header Controls -->
    <div class="explorer-header">
      <h2>{{ title }}</h2>
      <div class="control-panel">
        <div class="chart-controls">
          <select v-model="currentChartType">
            <option 
              v-for="chart in availableCharts" 
              :key="chart.type"
              :value="chart.type"
            >
              {{ chart.label }}
            </option>
          </select>
          <button 
            class="settings-btn"
            @click="showSettings = true"
          >
            <i class="i-carbon-settings"></i>
          </button>
        </div>
        <div class="data-controls">
          <button 
            class="refresh-btn"
            @click="refreshData"
            :disabled="isLoading"
          >
            <i class="i-carbon-refresh" :class="{ 'spinning': isLoading }"></i>
          </button>
          <button 
            class="export-btn"
            @click="showExportOptions = true"
          >
            <i class="i-carbon-export"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Visualization Area -->
    <div class="visualization-container">
      <!-- Loading State -->
      <div 
        v-if="isLoading"
        class="loading-overlay"
      >
        <div class="loader"></div>
        <span>Loading data...</span>
      </div>

      <!-- Chart Area -->
      <div 
        v-else
        class="chart-area"
      >
        <apexchart
          v-if="hasData"
          :type="currentChartType"
          :options="chartOptions"
          :series="chartSeries"
          :height="chartHeight"
        ></apexchart>
        
        <!-- No Data State -->
        <div 
          v-else
          class="no-data"
        >
          <i class="i-carbon-no-data"></i>
          <p>No data available</p>
          <button @click="refreshData">Refresh Data</button>
        </div>
      </div>
    </div>

    <!-- Data Analysis Tools -->
    <div class="analysis-tools">
      <div class="filters">
        <div 
          v-for="filter in activeFilters"
          :key="filter.id"
          class="filter-tag"
        >
          {{ filter.label }}
          <button 
            class="remove-filter"
            @click="removeFilter(filter.id)"
          >
            ×
          </button>
        </div>
        <button 
          class="add-filter"
          @click="showFilterModal = true"
        >
          <i class="i-carbon-add"></i> Add Filter
        </button>
      </div>

      <div class="metrics">
        <div 
          v-for="metric in calculatedMetrics"
          :key="metric.id"
          class="metric-card"
        >
          <div class="metric-label">{{ metric.label }}</div>
          <div class="metric-value">{{ formatMetricValue(metric) }}</div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <teleport to="body">
      <modal-dialog
        v-if="showSettings"
        @close="showSettings = false"
        title="Chart Settings"
      >
        <div class="settings-content">
          <!-- Chart Type Settings -->
          <div class="setting-group">
            <h4>Chart Type</h4>
            <div class="chart-type-grid">
              <button
                v-for="chart in availableCharts"
                :key="chart.type"
                :class="{ active: currentChartType === chart.type }"
                @click="currentChartType = chart.type"
              >
                <i :class="chart.icon"></i>
                {{ chart.label }}
              </button>
            </div>
          </div>

          <!-- Color Settings -->
          <div class="setting-group">
            <h4>Color Scheme</h4>
            <div class="color-scheme-select">
              <button
                v-for="scheme in colorSchemes"
                :key="scheme.name"
                :class="{ active: currentColorScheme === scheme.name }"
                @click="setColorScheme(scheme.name)"
              >
                <div 
                  class="color-preview"
                  :style="{ background: generateColorPreview(scheme.colors) }"
                ></div>
                {{ scheme.label }}
              </button>
            </div>
          </div>

          <!-- Axis Settings -->
          <div class="setting-group">
            <h4>Axis Configuration</h4>
            <div class="axis-settings">
              <div class="setting-row">
                <label>X-Axis Label</label>
                <input 
                  v-model="axisSettings.xAxis.label"
                  type="text"
                  placeholder="X-Axis Label"
                >
              </div>
              <div class="setting-row">
                <label>Y-Axis Label</label>
                <input 
                  v-model="axisSettings.yAxis.label"
                  type="text"
                  placeholder="Y-Axis Label"
                >
              </div>
            </div>
          </div>

          <!-- Legend Settings -->
          <div class="setting-group">
            <h4>Legend</h4>
            <div class="legend-settings">
              <label class="toggle">
                <input 
                  type="checkbox"
                  v-model="chartOptions.legend.show"
                >
                Show Legend
              </label>
              <select 
                v-if="chartOptions.legend.show"
                v-model="chartOptions.legend.position"
              >
                <option value="top">Top</option>
                <option value="right">Right</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
              </select>
            </div>
          </div>
        </div>

        <template #footer>
          <button 
            class="secondary"
            @click="resetSettings"
          >
            Reset to Default
          </button>
          <button 
            class="primary"
            @click="applySettings"
          >
            Apply Changes
          </button>
        </template>
      </modal-dialog>
    </teleport>

    <!-- Export Modal -->
    <teleport to="body">
      <modal-dialog
        v-if="showExportOptions"
        @close="showExportOptions = false"
        title="Export Data"
      >
        <div class="export-options">
          <button 
            v-for="option in exportOptions"
            :key="option.type"
            class="export-option"
            @click="exportData(option.type)"
          >
            <i :class="option.icon"></i>
            <span>{{ option.label }}</span>
            <span class="format">{{ option.format }}</span>
          </button>
        </div>
      </modal-dialog>
    </teleport>

    <!-- Filter Modal -->
    <teleport to="body">
      <modal-dialog
        v-if="showFilterModal"
        @close="showFilterModal = false"
        title="Add Filter"
      >
        <div class="filter-builder">
          <!-- Filter form content -->
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
const title = ref('Data Explorer')
const isLoading = ref(false)
const showSettings = ref(false)
const showExportOptions = ref(false)
const showFilterModal = ref(false)
const currentChartType = ref('line')
const currentColorScheme = ref('default')
const chartHeight = ref(400)

// Available Charts Configuration
const availableCharts = [
  { type: 'line', label: 'Line Chart', icon: 'i-carbon-chart-line' },
  { type: 'bar', label: 'Bar Chart', icon: 'i-carbon-chart-column' },
  { type: 'area', label: 'Area Chart', icon: 'i-carbon-chart-area' },
  { type: 'pie', label: 'Pie Chart', icon: 'i-carbon-chart-pie' },
  { type: 'scatter', label: 'Scatter Plot', icon: 'i-carbon-scatter-matrix' },
  { type: 'radar', label: 'Radar Chart', icon: 'i-carbon-chart-radar' }
]

// Color Schemes
const colorSchemes = [
  {
    name: 'default',
    label: 'Default',
    colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0']
  },
  {
    name: 'monochrome',
    label: 'Monochrome',
    colors: ['#008FFB', '#1A9EFF', '#33ADFF', '#4DBCFF', '#66CBFF']
  },
  {
    name: 'warm',
    label: 'Warm',
    colors: ['#FF4560', '#FEB019', '#FF8C00', '#FF6B6B', '#FF9F40']
  },
  {
    name: 'cool',
    label: 'Cool',
    colors: ['#775DD0', '#00E396', '#008FFB', '#4E88E5', '#63B3ED']
  }
]

// Axis Settings
const axisSettings = ref({
  xAxis: {
    label: 'X-Axis',
    type: 'category',
    categories: []
  },
  yAxis: {
    label: 'Y-Axis',
    min: null,
    max: null
  }
})

// Sample Data (replace with your actual data source)
const sampleData = ref([
  { date: '2024-01', value: 30, category: 'A' },
  { date: '2024-02', value: 45, category: 'A' },
  { date: '2024-03', value: 25, category: 'A' },
  { date: '2024-01', value: 20, category: 'B' },
  { date: '2024-02', value: 35, category: 'B' },
  { date: '2024-03', value: 40, category: 'B' }
])

// Filters
const activeFilters = ref([])

// Export Options
const exportOptions = [
  { 
    type: 'image',
    label: 'Download as Image',
    format: 'PNG',
    icon: 'i-carbon-image'
  },
  {
    type: 'csv',
    label: 'Export Data',
    format: 'CSV',
    icon: 'i-carbon-document-csv'
  },
  {
    type: 'json',
    label: 'Export Data',
    format: 'JSON',
    icon: 'i-carbon-document-json'
  }
]

// Computed
const hasData = computed(() => {
  return sampleData.value.length > 0
})

const chartOptions = computed(() => {
  const options = {
    chart: {
      type: currentChartType.value,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: true
      }
    },
    colors: colorSchemes.find(s => s.name === currentColorScheme.value).colors,
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      title: {
        text: axisSettings.value.xAxis.label
      },
      categories: axisSettings.value.xAxis.categories
    },
    yaxis: {
      title: {
        text: axisSettings.value.yAxis.label
      },
      min: axisSettings.value.yAxis.min,
      max: axisSettings.value.yAxis.max
    },
    legend: {
      show: true,
      position: 'bottom'
    },
    tooltip: {
      enabled: true,
      theme: theme.value.dark ? 'dark' : 'light'
    },
    grid: {
      borderColor: theme.value.dark ? '#404040' : '#e0e0e0'
    },
    theme: {
      mode: theme.value.dark ? 'dark' : 'light'
    }
  }

  // Chart-specific options
  if (currentChartType.value === 'pie') {
    options.labels = [...new Set(sampleData.value.map(d => d.category))]
  }

  if (currentChartType.value === 'radar') {
    options.markers = {
      size: 4
    }
  }

  return options
})

const chartSeries = computed(() => {
  if (currentChartType.value === 'pie') {
    const categories = [...new Set(sampleData.value.map(d => d.category))]
    return categories.map(cat => {
      return sampleData.value
        .filter(d => d.category === cat)
        .reduce((sum, curr) => sum + curr.value, 0)
    })
  }

  const categories = [...new Set(sampleData.value.map(d => d.category))]
  return categories.map(category => ({
    name: category,
    data: sampleData.value
      .filter(d => d.category === category)
      .map(d => d.value)
  }))
})

const calculatedMetrics = computed(() => {
  const metrics = []
  const values = sampleData.value.map(d => d.value)

  // Average
  metrics.push({
    id: 'avg',
    label: 'Average',
    value: values.reduce((a, b) => a + b, 0) / values.length
  })

  // Max
  metrics.push({
    id: 'max',
    label: 'Maximum',
    value: Math.max(...values)
  })

  // Min
  metrics.push({
    id: 'min',
    label: 'Minimum',
    value: Math.min(...values)
  })

  return metrics
})

// Methods
const refreshData = async () => {
  isLoading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Update data
    // sampleData.value = await fetchData()
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    isLoading.value = false
  }
}

const setColorScheme = (scheme) => {
  currentColorScheme.value = scheme
}

const generateColorPreview = (colors) => {
  return `linear-gradient(to right, ${colors.join(', ')})`
}

const removeFilter = (filterId) => {
  activeFilters.value = activeFilters.value.filter(f => f.id !== filterId)
}

const exportData = async (type) => {
  try {
    switch (type) {
      case 'image':
        // Handle chart image export
        break
      case 'csv':
        downloadCSV()
        break
      case 'json':
        downloadJSON()
        break
    }
    showExportOptions.value = false
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const downloadCSV = () => {
  const csvContent = convertToCSV(sampleData.value)
  downloadFile(csvContent, 'data-export.csv', 'text/csv')
}

const downloadJSON = () => {
  const jsonContent = JSON.stringify(sampleData.value, null, 2)
  downloadFile(jsonContent, 'data-export.json', 'application/json')
}

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const convertToCSV = (data) => {
  const headers = Object.keys(data[0])
  const rows = data.map(obj => headers.map(header => obj[header]))
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

const formatMetricValue = (metric) => {
  return Number(metric.value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

const resetSettings = () => {
  currentChartType.value = 'line'
  currentColorScheme.value = 'default'
  axisSettings.value = {
    xAxis: { label: 'X-Axis', type: 'category', categories: [] },
    yAxis: { label: 'Y-Axis', min: null, max: null }
  }
}

const applySettings = () => {
  showSettings.value = false
}

// Watchers
watch(currentChartType, () => {
  // Handle chart type specific updates
})

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.data-explorer {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

/* Header Styles */
.explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.explorer-header h2 {
  margin: 0;
}

.control-panel {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.chart-controls,
.data-controls {
  display: flex;
  gap: 0.5rem;
}

.chart-controls select {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  min-width: 120px;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover {
  background: var(--vp-c-bg-soft);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Visualization Container */
.visualization-container {
  position: relative;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 1rem;
  min-height: 400px;
  margin-bottom: 1.5rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(var(--vp-c-bg-rgb), 0.8);
  z-index: 10;
}

.loader {
  border: 3px solid var(--vp-c-divider);
  border-top: 3px solid var(--vp-c-brand);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Chart Area */
.chart-area {
  width: 100%;
  height: 100%;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--vp-c-text-2);
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Analysis Tools */
.analysis-tools {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  font-size: 0.875rem;
}

.remove-filter {
  border: none;
  background: none;
  padding: 0;
  font-size: 1.2em;
  line-height: 1;
  color: var(--vp-c-text-2);
}

.add-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 16px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.metric-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
}

/* Settings Modal Content */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-group {
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 1rem;
}

.setting-group h4 {
  margin: 0 0 1rem 0;
}

.chart-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.chart-type-grid button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
}

.chart-type-grid button.active {
  background: var(--vp-c-brand);
  color: white;
}

.color-scheme-select {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.color-preview {
  height: 24px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.axis-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-row input {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

.legend-settings {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Export Modal Content */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  text-align: left;
}

.export-option i {
  font-size: 1.5rem;
}

.export-option .format {
  margin-left: auto;
  color: var(--vp-c-text-2);
}

/* Modal Footer Buttons */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

button.primary {
  background: var(--vp-c-brand);
  color: white;
  border: none;
}

button.secondary {
  background: var(--vp-c-bg-soft);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .explorer-header {
    flex-direction: column;
    gap: 1rem;
  }

  .control-panel {
    flex-direction: column;
    width: 100%;
  }

  .chart-controls,
  .data-controls {
    width: 100%;
  }

  .chart-controls select {
    flex: 1;
  }

  .metrics {
    grid-template-columns: 1fr;
  }

  .chart-type-grid,
  .color-scheme-select {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>