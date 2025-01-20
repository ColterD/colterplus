<template>
  <div class="content-version">
    <div class="version-header">
      <h3>Version History</h3>
      <div class="version-actions">
        <button 
          class="create-version"
          @click="createSnapshot"
          :disabled="isCreatingSnapshot"
        >
          <span class="icon">📸</span>
          {{ isCreatingSnapshot ? 'Saving...' : 'Save Version' }}
        </button>
        <button 
          class="compare-button"
          @click="enableCompareMode"
          :disabled="selectedVersions.length !== 2"
        >
          Compare Selected
        </button>
      </div>
    </div>

    <div class="version-list">
      <div 
        v-for="version in sortedVersions"
        :key="version.id"
        class="version-item"
        :class="{ 
          'is-current': version.isCurrent,
          'is-selected': selectedVersions.includes(version)
        }"
      >
        <div class="version-checkbox">
          <input 
            type="checkbox"
            :checked="selectedVersions.includes(version)"
            @change="toggleVersionSelect(version)"
            :disabled="isComparing"
          >
        </div>

        <div class="version-info" @click="showVersionDetails(version)">
          <div class="version-meta">
            <span class="version-number">v{{ version.number }}</span>
            <span class="version-date">
              {{ formatDate(version.timestamp) }}
            </span>
          </div>
          <div class="version-author">
            <img 
              :src="version.author.avatar" 
              :alt="version.author.name"
              class="author-avatar"
            >
            {{ version.author.name }}
          </div>
          <div class="version-changes">
            <span class="change-stats">
              <span class="additions">+{{ version.changes.additions }}</span>
              <span class="deletions">-{{ version.changes.deletions }}</span>
            </span>
            <p class="change-message">{{ version.message }}</p>
          </div>
        </div>

        <div class="version-actions">
          <button 
            class="restore-button"
            @click="restoreVersion(version)"
            :disabled="version.isCurrent || isComparing"
          >
            Restore
          </button>
          <button 
            class="preview-button"
            @click="previewVersion(version)"
          >
            Preview
          </button>
        </div>
      </div>
    </div>

    <!-- Version Comparison Modal -->
    <Transition name="modal">
      <div v-if="isComparing" class="comparison-modal">
        <div class="modal-backdrop" @click="closeCompare"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>Compare Versions</h3>
            <button class="close-button" @click="closeCompare">×</button>
          </div>

          <div class="comparison-header">
            <div class="version-selector">
              <select v-model="compareFrom">
                <option 
                  v-for="version in versions"
                  :key="version.id"
                  :value="version"
                >
                  v{{ version.number }} - {{ formatDate(version.timestamp) }}
                </option>
              </select>
              <span>→</span>
              <select v-model="compareTo">
                <option 
                  v-for="version in versions"
                  :key="version.id"
                  :value="version"
                >
                  v{{ version.number }} - {{ formatDate(version.timestamp) }}
                </option>
              </select>
            </div>
            <div class="comparison-controls">
              <button 
                class="view-mode-button"
                :class="{ active: comparisonView === 'unified' }"
                @click="comparisonView = 'unified'"
              >
                Unified
              </button>
              <button 
                class="view-mode-button"
                :class="{ active: comparisonView === 'split' }"
                @click="comparisonView = 'split'"
              >
                Split
              </button>
            </div>
          </div>

          <div 
            class="comparison-content"
            :class="comparisonView"
          >
            <template v-if="comparisonView === 'unified'">
              <div 
                v-for="(diff, index) in unifiedDiff"
                :key="index"
                class="diff-line"
                :class="diff.type"
              >
                <span class="line-number">{{ diff.lineNumber }}</span>
                <span class="line-content">{{ diff.content }}</span>
              </div>
            </template>

            <template v-else>
              <div class="split-view">
                <div class="split-pane">
                  <div class="pane-header">
                    Version {{ compareFrom?.number }}
                  </div>
                  <div class="pane-content">
                    <div 
                      v-for="(line, index) in fromContent"
                      :key="index"
                      class="diff-line"
                      :class="getDiffClass(line, 'from')"
                    >
                      <span class="line-number">{{ index + 1 }}</span>
                      <span class="line-content">{{ line }}</span>
                    </div>
                  </div>
                </div>

                <div class="split-pane">
                  <div class="pane-header">
                    Version {{ compareTo?.number }}
                  </div>
                  <div class="pane-content">
                    <div 
                      v-for="(line, index) in toContent"
                      :key="index"
                      class="diff-line"
                      :class="getDiffClass(line, 'to')"
                    >
                      <span class="line-number">{{ index + 1 }}</span>
                      <span class="line-content">{{ line }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="comparison-footer">
            <button 
              class="export-button"
              @click="exportComparison"
            >
              Export Diff
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Version Details Modal -->
    <Transition name="modal">
      <div v-if="selectedVersion" class="version-details-modal">
        <div class="modal-backdrop" @click="closeVersionDetails"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>Version Details</h3>
            <button class="close-button" @click="closeVersionDetails">×</button>
          </div>

          <div class="version-details-content">
            <div class="details-header">
              <div class="version-title">
                <span class="version-number">v{{ selectedVersion.number }}</span>
                <span class="version-date">
                  {{ formatDate(selectedVersion.timestamp) }}
                </span>
              </div>
              <div class="version-author">
                <img 
                  :src="selectedVersion.author.avatar"
                  :alt="selectedVersion.author.name"
                  class="author-avatar"
                >
                <div class="author-info">
                  <span class="author-name">{{ selectedVersion.author.name }}</span>
                  <span class="author-email">{{ selectedVersion.author.email }}</span>
                </div>
              </div>
            </div>

            <div class="version-message">
              {{ selectedVersion.message }}
            </div>

            <div class="change-details">
              <h4>Changes</h4>
              <div class="change-stats">
                <div class="stat-item additions">
                  <span class="stat-label">Added</span>
                  <span class="stat-value">+{{ selectedVersion.changes.additions }}</span>
                </div>
                <div class="stat-item deletions">
                  <span class="stat-label">Removed</span>
                  <span class="stat-value">-{{ selectedVersion.changes.deletions }}</span>
                </div>
                <div class="stat-item modified">
                  <span class="stat-label">Modified</span>
                  <span class="stat-value">{{ selectedVersion.changes.modified }}</span>
                </div>
              </div>

              <div class="changed-files">
                <h4>Changed Files</h4>
                <div 
                  v-for="file in selectedVersion.changes.files"
                  :key="file.path"
                  class="changed-file"
                >
                  <span class="file-path">{{ file.path }}</span>
                  <span class="file-changes">
                    <span class="additions">+{{ file.additions }}</span>
                    <span class="deletions">-{{ file.deletions }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="version-details-footer">
            <button 
              class="restore-button"
              @click="restoreVersion(selectedVersion)"
              :disabled="selectedVersion.isCurrent"
            >
              Restore This Version
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { diffLines } from 'diff'

// State
const versions = ref([
  {
    id: 1,
    number: 1.0,
    timestamp: Date.now() - 86400000 * 3,
    author: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '/default-avatar.png'
    },
    message: 'Initial version',
    changes: {
      additions: 100,
      deletions: 0,
      modified: 0,
      files: [
        {
          path: 'docs/index.md',
          additions: 100,
          deletions: 0
        }
      ]
    },
    content: 'Initial content...',
    isCurrent: false
  },
  {
    id: 2,
    number: 1.1,
    timestamp: Date.now() - 86400000,
    author: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: '/default-avatar.png'
    },
    message: 'Updated documentation structure',
    changes: {
      additions: 50,
      deletions: 20,
      modified: 5,
      files: [
        {
          path: 'docs/index.md',
          additions: 30,
          deletions: 10
        },
        {
          path: 'docs/guide.md',
          additions: 20,
          deletions: 10
        }
      ]
    },
    content: 'Updated content...',
    isCurrent: true
  }
])

const selectedVersions = ref([])
const isComparing = ref(false)
const comparisonView = ref('unified')
const compareFrom = ref(null)
const compareTo = ref(null)
const selectedVersion = ref(null)
const isCreatingSnapshot = ref(false)

// Computed
const sortedVersions = computed(() => {
  return [...versions.value].sort((a, b) => b.timestamp - a.timestamp)
})

const unifiedDiff = computed(() => {
  if (!compareFrom.value || !compareTo.value) return []

  const diff = diffLines(compareFrom.value.content, compareTo.value.content)
  let lineNumber = 1
  
  return diff.flatMap(part => {
    const lines = part.value.split('\n')
    return lines.map(line => {
      const diffLine = {
        content: line,
        lineNumber: lineNumber++,
        type: part.added ? 'addition' : part.removed ? 'deletion' : 'unchanged'
      }
      return diffLine
    })
  })
})

const fromContent = computed(() => {
  return compareFrom.value?.content.split('\n') || []
})

const toContent = computed(() => {
  return compareTo.value?.content.split('\n') || []
})

// Methods
const createSnapshot = async () => {
  isCreatingSnapshot.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newVersion = {
      id: versions.value.length + 1,
      number: Math.max(...versions.value.map(v => v.number)) + 0.1,
      timestamp: Date.now(),
      author: {
        name: 'Current User',
        email: 'user@example.com',
        avatar: '/default-avatar.png'
      },
      message: 'New version created',
      changes: {
        additions: 10,
        deletions: 5,
        modified: 2,
        files: [
          {
            path: 'docs/current-file.md',
            additions: 10,
            deletions: 5
          }
        ]
      },
      content: 'New content...',
      isCurrent: true
    }

    // Update current version status
    versions.value.forEach(v => v.isCurrent = false)
    versions.value.push(newVersion)

    window.$notify?.success('Version Created', 'New version has been saved')
  } catch (error) {
    window.$notify?.error('Error', 'Failed to create version')
  } finally {
    isCreatingSnapshot.value = false
  }
}

const toggleVersionSelect = (version) => {
  const index = selectedVersions.value.indexOf(version)
  if (index === -1) {
    if (selectedVersions.value.length < 2) {
      selectedVersions.value.push(version)
    }
  } else {
    selectedVersions.value.splice(index, 1)
  }
}

const enableCompareMode = () => {
  if (selectedVersions.value.length !== 2) return
  
  compareFrom.value = selectedVersions.value[0]
  compareTo.value = selectedVersions.value[1]
  isComparing.value = true
}

const closeCompare = () => {
  isComparing.value = false
  selectedVersions.value = []
}

const showVersionDetails = (version) => {
  selectedVersion.value = version
}

const closeVersionDetails = () => {
  selectedVersion.value = null
}

const restoreVersion = async (version) => {
  if (!confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
    return
  }

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    versions.value.forEach(v => v.isCurrent = (v.id === version.id))
    window.$notify?.success('Version Restored', `Restored to version ${version.number}`)
  } catch (error) {
    window.$notify?.error('Error', 'Failed to restore version')
  }
}

const previewVersion = (version) => {
  // Implement preview functionality
  console.log('Preview version:', version)
}

const exportComparison = async () => {
  try {
    const diff = unifiedDiff.value
    const content = diff.map(line => 
      `${line.lineNumber} ${line.type}: ${line.content}`
    ).join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diff-v${compareFrom.value.number}-v${compareTo.value.number}.txt`
    a.click()
    URL.revokeObjectURL(url)

    window.$notify?.success('Exported', 'Comparison exported successfully')
  } catch (error) {
    window.$notify?.error('Error', 'Failed to export comparison')
  }
}

const getDiffClass = (line, type) => {
  // Implement diff highlighting logic
  return 'unchanged'
}

const formatDate = (timestamp) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}
</script>

<style scoped>
.content-version {
  margin: 1.5rem 0;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.version-header {
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-header h3 {
  margin: 0;
}

.version-actions {
  display: flex;
  gap: 1rem;
}

.create-version,
.compare-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-version {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.compare-button {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text);
}

.create-version:disabled,
.compare-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.version-list {
  max-height: 500px;
  overflow-y: auto;
}

.version-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  transition: background-color 0.2s ease;
}

.version-item:hover {
  background: var(--vp-c-bg-soft);
}

.version-item.is-current {
  background: var(--vp-c-bg-alt);
}

.version-item.is-selected {
  background: var(--vp-c-brand-soft);
}

.version-checkbox {
  display: flex;
  align-items: center;
  padding-right: 1rem;
}

.version-info {
  flex: 1;
  cursor: pointer;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.version-number {
  font-weight: 600;
}

.version-date {
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.version-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.version-changes {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.change-stats {
  white-space: nowrap;
  font-family: monospace;
}

.additions {
  color: var(--vp-c-green);
}

.deletions {
  color: var(--vp-c-red);
}

.change-message {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.version-actions {
  display: flex;
  gap: 0.5rem;
}

.restore-button,
.preview-button {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restore-button {
  background: var(--vp-c-warning-soft);
  border: 1px solid var(--vp-c-warning);
  color: var(--vp-c-warning);
}

.preview-button {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text);
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  background: var(--vp-c-bg);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 101;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

/* Comparison styles */
.comparison-header {
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.comparison-controls {
  display: flex;
  gap: 0.5rem;
}

.view-mode-button {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}

.view-mode-button.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.comparison-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.comparison-content.unified {
  font-family: monospace;
}

.diff-line {
  display: flex;
  padding: 0.25rem 0;
}

.diff-line.addition {
  background: var(--vp-c-green-soft);
}

.diff-line.deletion {
  background: var(--vp-c-red-soft);
}

.line-number {
  width: 3rem;
  color: var(--vp-c-text-2);
  text-align: right;
  padding-right: 1rem;
  user-select: none;
}

.line-content {
  flex: 1;
  white-space: pre-wrap;
}

.split-view {
  display: flex;
  gap: 2rem;
}

.split-pane {
  flex: 1;
}

.pane-header {
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-weight: 500;
}

.comparison-footer {
  padding: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: flex-end;
}

/* Version details styles */
.version-details-content {
  padding: 1rem;
  overflow-y: auto;
}

.details-header {
  margin-bottom: 1.5rem;
}

.version-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 500;
}

.author-email {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.version-message {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.change-details h4 {
  margin: 1rem 0 0.5rem 0;
}

.change-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.stat-value {
  font-size: 1.2em;
  font-weight: 500;
}

.changed-files {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 1rem;
}

.changed-file {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.file-changes {
  font-family: monospace;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Mobile styles */
@media (max-width: 768px) {
  .version-actions {
    flex-direction: column;
  }

  .version-item {
    flex-direction: column;
    gap: 1rem;
  }

  .split-view {
    flex-direction: column;
  }

  .comparison-header {
    flex-direction: column;
    gap: 1rem;
  }

  .version-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .change-stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>