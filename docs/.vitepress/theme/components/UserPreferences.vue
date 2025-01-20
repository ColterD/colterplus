<template>
  <div class="user-preferences">
    <div class="preferences-header">
      <h2>User Preferences</h2>
      <div class="header-actions">
        <button class="action-button" @click="exportSettings">
          <span class="icon">💾</span>
          Export
        </button>
        <button class="action-button" @click="importSettings">
          <span class="icon">📂</span>
          Import
        </button>
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          accept=".json"
          @change="handleImport"
        >
      </div>
    </div>

    <div class="preferences-grid">
      <!-- Reading Preferences -->
      <div class="preference-section">
        <h3>Reading Preferences</h3>
        <div class="preference-controls">
          <div class="control-group">
            <label>Font Size</label>
            <div class="slider-control">
              <input
                type="range"
                v-model="preferences.reading.fontSize"
                min="12"
                max="24"
                step="1"
                @change="updatePreferences"
              >
              <span>{{ preferences.reading.fontSize }}px</span>
            </div>
          </div>

          <div class="control-group">
            <label>Line Height</label>
            <div class="slider-control">
              <input
                type="range"
                v-model="preferences.reading.lineHeight"
                min="1.2"
                max="2"
                step="0.1"
                @change="updatePreferences"
              >
              <span>{{ preferences.reading.lineHeight }}</span>
            </div>
          </div>

          <div class="control-group">
            <label>Content Width</label>
            <div class="slider-control">
              <input
                type="range"
                v-model="preferences.reading.contentWidth"
                min="600"
                max="1200"
                step="50"
                @change="updatePreferences"
              >
              <span>{{ preferences.reading.contentWidth }}px</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Filters -->
      <div class="preference-section">
        <h3>Content Filters</h3>
        <div class="preference-controls">
          <div class="control-group">
            <label>Difficulty Level</label>
            <div class="checkbox-group">
              <label v-for="level in difficultyLevels" :key="level">
                <input
                  type="checkbox"
                  v-model="preferences.filters.difficulties"
                  :value="level"
                  @change="updatePreferences"
                >
                {{ level }}
              </label>
            </div>
          </div>

          <div class="control-group">
            <label>Content Types</label>
            <div class="checkbox-group">
              <label v-for="type in contentTypes" :key="type">
                <input
                  type="checkbox"
                  v-model="preferences.filters.contentTypes"
                  :value="type"
                  @change="updatePreferences"
                >
                {{ type }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="preference-section">
        <h3>Notifications</h3>
        <div class="preference-controls">
          <div class="control-group">
            <label>Email Notifications</label>
            <div class="toggle-group">
              <label v-for="type in notificationTypes" :key="type">
                <input
                  type="checkbox"
                  v-model="preferences.notifications[type.id]"
                  @change="updatePreferences"
                >
                {{ type.label }}
              </label>
            </div>
          </div>

          <div class="control-group">
            <label>Notification Duration</label>
            <select
              v-model="preferences.notifications.duration"
              @change="updatePreferences"
            >
              <option value="3000">3 seconds</option>
              <option value="5000">5 seconds</option>
              <option value="7000">7 seconds</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Accessibility Options -->
      <div class="preference-section">
        <h3>Accessibility</h3>
        <div class="preference-controls">
          <div class="control-group">
            <label>High Contrast</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                v-model="preferences.accessibility.highContrast"
                @change="updatePreferences"
              >
              <span class="toggle-slider"></span>
            </div>
          </div>

          <div class="control-group">
            <label>Reduce Motion</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                v-model="preferences.accessibility.reduceMotion"
                @change="updatePreferences"
              >
              <span class="toggle-slider"></span>
            </div>
          </div>

          <div class="control-group">
            <label>Dyslexic Font</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                v-model="preferences.accessibility.dyslexicFont"
                @change="updatePreferences"
              >
              <span class="toggle-slider"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Layout Preferences -->
      <div class="preference-section">
        <h3>Layout</h3>
        <div class="preference-controls">
          <div class="control-group">
            <label>Layout Style</label>
            <div class="radio-group">
              <label v-for="layout in layoutStyles" :key="layout">
                <input
                  type="radio"
                  v-model="preferences.layout.style"
                  :value="layout"
                  @change="updatePreferences"
                >
                {{ layout }}
              </label>
            </div>
          </div>

          <div class="control-group">
            <label>Sidebar Position</label>
            <select
              v-model="preferences.layout.sidebarPosition"
              @change="updatePreferences"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="preferences-footer">
      <button 
        class="reset-button"
        @click="resetPreferences"
      >
        Reset to Defaults
      </button>
      <button 
        class="save-button"
        @click="savePreferences"
      >
        Save Preferences
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

// Constants
const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const contentTypes = ['Articles', 'Tutorials', 'Documentation', 'Videos']
const layoutStyles = ['Grid', 'List', 'Compact']
const notificationTypes = [
  { id: 'updates', label: 'Content Updates' },
  { id: 'comments', label: 'New Comments' },
  { id: 'mentions', label: 'Mentions' }
]

// Default preferences
const defaultPreferences = {
  reading: {
    fontSize: 16,
    lineHeight: 1.5,
    contentWidth: 800
  },
  filters: {
    difficulties: ['Beginner', 'Intermediate'],
    contentTypes: ['Articles', 'Tutorials']
  },
  notifications: {
    updates: true,
    comments: true,
    mentions: false,
    duration: 5000
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    dyslexicFont: false
  },
  layout: {
    style: 'Grid',
    sidebarPosition: 'left'
  }
}

// State
const preferences = ref({ ...defaultPreferences })
const fileInput = ref(null)

// Methods
const updatePreferences = () => {
  applyPreferences()
  saveToStorage()
}

const applyPreferences = () => {
  // Apply reading preferences
  document.documentElement.style.setProperty('--content-font-size', `${preferences.value.reading.fontSize}px`)
  document.documentElement.style.setProperty('--content-line-height', preferences.value.reading.lineHeight)
  document.documentElement.style.setProperty('--content-width', `${preferences.value.reading.contentWidth}px`)

  // Apply accessibility preferences
  document.documentElement.classList.toggle('high-contrast', preferences.value.accessibility.highContrast)
  document.documentElement.classList.toggle('reduce-motion', preferences.value.accessibility.reduceMotion)
  document.documentElement.classList.toggle('dyslexic-font', preferences.value.accessibility.dyslexicFont)

  // Apply layout preferences
  document.documentElement.setAttribute('data-layout', preferences.value.layout.style.toLowerCase())
  document.documentElement.setAttribute('data-sidebar', preferences.value.layout.sidebarPosition)
}

const saveToStorage = () => {
  localStorage.setItem('user-preferences', JSON.stringify(preferences.value))
  window.$notify?.success('Preferences Saved', 'Your preferences have been updated')
}

const loadFromStorage = () => {
  const saved = localStorage.getItem('user-preferences')
  if (saved) {
    preferences.value = JSON.parse(saved)
    applyPreferences()
  }
}

const resetPreferences = () => {
  if (confirm('Are you sure you want to reset all preferences to default?')) {
    preferences.value = { ...defaultPreferences }
    updatePreferences()
    window.$notify?.info('Preferences Reset', 'All preferences have been reset to default values')
  }
}

const exportSettings = () => {
  const data = JSON.stringify(preferences.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'user-preferences.json'
  a.click()
  URL.revokeObjectURL(url)
}

const importSettings = () => {
  fileInput.value.click()
}

const handleImport = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result)
        preferences.value = { ...imported }
        updatePreferences()
        window.$notify?.success('Import Successful', 'Your preferences have been imported')
      } catch (error) {
        window.$notify?.error('Import Failed', 'Invalid preferences file')
      }
    }
    reader.readAsText(file)
  }
}

// Lifecycle
onMounted(() => {
  loadFromStorage()
})

// Watch for changes and apply them
watch(preferences, () => {
  applyPreferences()
}, { deep: true })
</script>

<style scoped>
.user-preferences {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  max-width: 1200px;
  margin: 0 auto;
}

.preferences-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.preferences-header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: var(--vp-c-bg-mute);
}

.preferences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.preference-section {
  background: var(--vp-c-bg-soft);
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.preference-section h3 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
}

.preference-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider-control input[type="range"] {
  flex: 1;
}

.slider-control span {
  min-width: 4rem;
  text-align: right;
  color: var(--vp-c-text-2);
}

.checkbox-group,
.radio-group,
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group label,
.radio-group label,
.toggle-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-switch {
  position: relative;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--vp-c-bg-mute);
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--vp-c-brand);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

select {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

.preferences-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.reset-button,
.save-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.save-button {
  background: var(--vp-c-brand);
  border: none;
  color: white;
}

.reset-button:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.save-button:hover {
  background: var(--vp-c-brand-dark);
}

/* Mobile styles */
@media (max-width: 768px) {
  .preferences-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .preferences-grid {
    grid-template-columns: 1fr;
  }

  .preferences-footer {
    flex-direction: column;
  }

  .reset-button,
  .save-button {
    width: 100%;
  }
}
</style>