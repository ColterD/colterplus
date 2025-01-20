<template>
  <div class="code-playground">
    <!-- Playground Header -->
    <div class="playground-header">
      <div class="playground-title">
        <h3>{{ title }}</h3>
        <span 
          v-if="description"
          class="playground-description"
        >
          {{ description }}
        </span>
      </div>

      <div class="playground-controls">
        <!-- Framework Selector -->
        <div class="framework-selector">
          <select v-model="currentFramework">
            <option
              v-for="fw in availableFrameworks"
              :key="fw.id"
              :value="fw.id"
            >
              {{ fw.label }}
            </option>
          </select>
        </div>

        <!-- View Options -->
        <div class="view-options">
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

        <!-- Actions Menu -->
        <div class="actions-dropdown">
          <button 
            class="actions-trigger"
            @click="showActions = !showActions"
          >
            <i class="i-carbon-menu"></i>
          </button>
          
          <div 
            v-if="showActions"
            class="actions-menu"
          >
            <button @click="resetCode">
              <i class="i-carbon-reset"></i>
              Reset Code
            </button>
            <button @click="copyCode">
              <i class="i-carbon-copy"></i>
              Copy Code
            </button>
            <button @click="sharePlayground">
              <i class="i-carbon-share"></i>
              Share
            </button>
            <button @click="downloadFiles">
              <i class="i-carbon-download"></i>
              Download
            </button>
            <button @click="openInCodeSandbox">
              <i class="i-carbon-launch"></i>
              Open in CodeSandbox
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Playground Area -->
    <div 
      class="playground-content"
      :class="currentView"
    >
      <!-- Editor Panel -->
      <div class="editor-panel">
        <div class="editor-tabs">
          <button
            v-for="file in files"
            :key="file.name"
            :class="{ active: currentFile === file.name }"
            @click="currentFile = file.name"
          >
            <i :class="getFileIcon(file.type)"></i>
            {{ file.name }}
            <span 
              v-if="file.unsaved"
              class="unsaved-indicator"
            >
              *
            </span>
          </button>
          <button 
            class="add-file"
            @click="showNewFileDialog"
            title="Add new file"
          >
            <i class="i-carbon-add"></i>
          </button>
        </div>

        <!-- Monaco Editor -->
        <div class="editor-container">
          <MonacoEditor
            v-model="currentFileContent"
            :language="currentFileLanguage"
            :options="editorOptions"
            @change="handleCodeChange"
          />
        </div>

        <!-- Editor Footer -->
        <div class="editor-footer">
          <div class="file-info">
            <span class="language">
              {{ currentFileLanguage }}
            </span>
            <span class="file-size">
              {{ formatBytes(currentFileSize) }}
            </span>
          </div>
          
          <div class="editor-settings">
            <button
              title="Format Code"
              @click="formatCode"
            >
              <i class="i-carbon-clean"></i>
            </button>
            <select 
              v-model="editorOptions.tabSize"
              title="Tab Size"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
            </select>
            <button
              title="Toggle Word Wrap"
              @click="toggleWordWrap"
            >
              <i :class="editorOptions.wordWrap === 'on' ? 'i-carbon-text-wrap' : 'i-carbon-text-nowrap'"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div class="preview-panel">
        <div class="preview-header">
          <div class="preview-controls">
            <button
              title="Refresh Preview"
              @click="refreshPreview"
            >
              <i class="i-carbon-refresh"></i>
            </button>
            <button
              :title="autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'"
              @click="toggleAutoRefresh"
              :class="{ active: autoRefresh }"
            >
              <i class="i-carbon-auto-scroll"></i>
            </button>
            <select v-model="previewMode">
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>

          <div class="preview-settings">
            <button
              title="Open in New Window"
              @click="openPreviewWindow"
            >
              <i class="i-carbon-launch"></i>
            </button>
          </div>
        </div>

        <!-- Preview iframe -->
        <div 
          class="preview-container"
          :class="previewMode"
        >
          <iframe
            ref="previewFrame"
            :srcdoc="previewContent"
            sandbox="allow-scripts allow-same-origin"
            @load="handlePreviewLoad"
          ></iframe>
        </div>

        <!-- Preview Console -->
        <div 
          v-if="showConsole"
          class="preview-console"
        >
          <div class="console-header">
            <span>Console</span>
            <div class="console-controls">
              <button
                title="Clear Console"
                @click="clearConsole"
              >
                <i class="i-carbon-clear"></i>
              </button>
              <button
                title="Close Console"
                @click="showConsole = false"
              >
                <i class="i-carbon-close"></i>
              </button>
            </div>
          </div>
          <div class="console-output">
            <div
              v-for="(log, index) in consoleLogs"
              :key="index"
              :class="['log-entry', log.type]"
            >
              <i :class="getLogIcon(log.type)"></i>
              <pre>{{ log.content }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <teleport to="body">
      <!-- New File Dialog -->
      <modal-dialog
        v-if="showNewFileModal"
        @close="showNewFileModal = false"
        title="Create New File"
      >
        <div class="new-file-form">
          <div class="input-group">
            <label>File Name</label>
            <input
              v-model="newFileName"
              placeholder="e.g., styles.css"
              @keyup.enter="createNewFile"
            >
          </div>
          <div class="input-group">
            <label>File Type</label>
            <select v-model="newFileType">
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="javascript">JavaScript</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
        <template #footer>
          <button
            class="secondary-button"
            @click="showNewFileModal = false"
          >
            Cancel
          </button>
          <button
            class="primary-button"
            @click="createNewFile"
            :disabled="!canCreateFile"
          >
            Create
          </button>
        </template>
      </modal-dialog>

      <!-- Share Dialog -->
      <modal-dialog
        v-if="showShareModal"
        @close="showShareModal = false"
        title="Share Playground"
      >
        <div class="share-options">
          <div class="input-group">
            <label>Playground URL</label>
            <div class="copy-input">
              <input
                ref="shareUrlInput"
                :value="shareUrl"
                readonly
              >
              <button 
                @click="copyShareUrl"
                :title="copied ? 'Copied!' : 'Copy URL'"
              >
                <i :class="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'"></i>
              </button>
            </div>
          </div>
          <div class="embed-options">
            <h4>Embed Options</h4>
            <div class="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  v-model="embedOptions.includeResult"
                >
                Include Result
              </label>
              <label>
                <input
                  type="checkbox"
                  v-model="embedOptions.editable"
                >
                Make Editable
              </label>
            </div>
            <div class="input-group">
              <label>Embed Code</label>
              <textarea
                ref="embedCodeInput"
                :value="embedCode"
                readonly
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
      </modal-dialog>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import * as monaco from 'monaco-editor'
import MonacoEditor from './MonacoEditor.vue'
import ModalDialog from './ModalDialog.vue'
import { compress, decompress } from 'lz-string'

const props = defineProps({
  title: {
    type: String,
    default: 'Code Playground'
  },
  description: {
    type: String,
    default: ''
  },
  initialFiles: {
    type: Array,
    default: () => [{
      name: 'index.html',
      type: 'html',
      content: '<div>Hello World</div>'
    }]
  },
  defaultFramework: {
    type: String,
    default: 'vanilla'
  }
})

// State
const currentFile = ref('index.html')
const files = ref([...props.initialFiles])
const currentView = ref('split')
const showActions = ref(false)
const showNewFileModal = ref(false)
const showShareModal = ref(false)
const showConsole = ref(false)
const currentFramework = ref(props.defaultFramework)
const previewMode = ref('desktop')
const autoRefresh = ref(true)
const consoleLogs = ref([])
const newFileName = ref('')
const newFileType = ref('html')
const copied = ref(false)
const previewFrame = ref(null)
const shareUrlInput = ref(null)
const embedCodeInput = ref(null)
const embedOptions = ref({
  includeResult: true,
  editable: true
})

// Editor Configuration
const editorOptions = ref({
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimap: {
    enabled: false
  },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true
})

// Available Frameworks
const availableFrameworks = [
  { id: 'vanilla', label: 'Vanilla JS' },
  { id: 'vue', label: 'Vue' },
  { id: 'react', label: 'React' },
  { id: 'svelte', label: 'Svelte' }
]

// View Options
const viewOptions = [
  { id: 'editor', label: 'Editor Only', icon: 'i-carbon-code' },
  { id: 'preview', label: 'Preview Only', icon: 'i-carbon-play' },
  { id: 'split', label: 'Split View', icon: 'i-carbon-split' }
]

// Computed
const currentFileContent = computed({
  get: () => {
    const file = files.value.find(f => f.name === currentFile.value)
    return file ? file.content : ''
  },
  set: (newContent) => {
    const fileIndex = files.value.findIndex(f => f.name === currentFile.value)
    if (fileIndex !== -1) {
      files.value[fileIndex] = {
        ...files.value[fileIndex],
        content: newContent,
        unsaved: true
      }
    }
  }
})

const currentFileLanguage = computed(() => {
  const file = files.value.find(f => f.name === currentFile.value)
  return file ? getLanguageFromType(file.type) : 'plaintext'
})

const currentFileSize = computed(() => {
  const file = files.value.find(f => f.name === currentFile.value)
  return file ? new Blob([file.content]).size : 0
})

const canCreateFile = computed(() => {
  return newFileName.value.trim() && 
    !files.value.some(f => f.name === newFileName.value.trim())
})

const previewContent = computed(() => {
  return generatePreviewContent()
})

const shareUrl = computed(() => {
  const baseUrl = window.location.origin + window.location.pathname
  const data = {
    files: files.value,
    framework: currentFramework.value
  }
  const compressed = compress(JSON.stringify(data))
  return `${baseUrl}?playground=${encodeURIComponent(compressed)}`
})

const embedCode = computed(() => {
  const options = {
    ...embedOptions.value,
    height: '400px'
  }
  return `<iframe
  src="${shareUrl.value}&embed=true"
  style="width: 100%; height: ${options.height}; border: 0;"
  title="Code Playground"
></iframe>`
})

// Methods
const handleCodeChange = (newValue) => {
  if (autoRefresh.value) {
    refreshPreview()
  }
}

const refreshPreview = () => {
  if (previewFrame.value) {
    previewFrame.value.srcdoc = previewContent.value
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
}

const formatCode = async () => {
  try {
    const editor = monaco.editor.getModels().find(
      model => model.uri.path === currentFile.value
    )
    if (editor) {
      await editor.getAction('editor.action.formatDocument').run()
    }
  } catch (error) {
    console.error('Failed to format code:', error)
  }
}

const toggleWordWrap = () => {
  editorOptions.value.wordWrap = 
    editorOptions.value.wordWrap === 'on' ? 'off' : 'on'
}

const resetCode = () => {
  if (confirm('Are you sure you want to reset all code to initial state?')) {
    files.value = [...props.initialFiles]
    refreshPreview()
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(currentFileContent.value)
    showToast('Code copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy code:', error)
  }
}

const sharePlayground = () => {
  showShareModal.value = true
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy share URL:', error)
  }
}

const downloadFiles = () => {
  const zip = new JSZip()
  
  files.value.forEach(file => {
    zip.file(file.name, file.content)
  })

  zip.generateAsync({ type: 'blob' })
    .then(content => {
      const url = window.URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = 'playground-files.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    })
}

const openInCodeSandbox = async () => {
  const parameters = {
    files: {},
    template: getCodeSandboxTemplate()
  }

  files.value.forEach(file => {
    parameters.files[file.name] = {
      content: file.content
    }
  })

  const form = document.createElement('form')
  form.method = 'POST'
  form.target = '_blank'
  form.action = 'https://codesandbox.io/api/v1/sandboxes/define'

  const input = document.createElement('input')
  input.name = 'parameters'
  input.value = compress(JSON.stringify(parameters))
  form.appendChild(input)

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

const showNewFileDialog = () => {
  newFileName.value = ''
  newFileType.value = 'html'
  showNewFileModal.value = true
}

const createNewFile = () => {
  if (!canCreateFile.value) return

  const newFile = {
    name: newFileName.value.trim(),
    type: newFileType.value,
    content: getTemplateForType(newFileType.value),
    unsaved: false
  }

  files.value.push(newFile)
  currentFile.value = newFile.name
  showNewFileModal.value = false
}

const handlePreviewLoad = () => {
  if (!previewFrame.value) return

  // Inject console interceptor
  const interceptor = `
    window.console = new Proxy(window.console, {
      get(target, prop) {
        if (['log', 'error', 'warn', 'info'].includes(prop)) {
          return (...args) => {
            target[prop](...args)
            window.parent.postMessage({
              type: 'console',
              method: prop,
              args: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              )
            }, '*')
          }
        }
        return target[prop]
      }
    })
  `

  const frameWindow = previewFrame.value.contentWindow
  const script = frameWindow.document.createElement('script')
  script.textContent = interceptor
  frameWindow.document.head.appendChild(script)
}

// Utility Functions
const getLanguageFromType = (type) => {
  const map = {
    html: 'html',
    css: 'css',
    javascript: 'javascript',
    json: 'json',
    typescript: 'typescript'
  }
  return map[type] || 'plaintext'
}

const getFileIcon = (type) => {
  const icons = {
    html: 'i-carbon-html',
    css: 'i-carbon-css',
    javascript: 'i-carbon-javascript',
    json: 'i-carbon-json',
    typescript: 'i-carbon-typescript'
  }
  return icons[type] || 'i-carbon-document'
}

const getLogIcon = (type) => {
  const icons = {
    log: 'i-carbon-terminal',
    error: 'i-carbon-error',
    warn: 'i-carbon-warning',
    info: 'i-carbon-information'
  }
  return icons[type] || icons.log
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const getTemplateForType = (type) => {
  const templates = {
    html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n\n</body>\n</html>',
    css: '/* Add your styles here */',
    javascript: '// Add your code here',
    json: '{\n  \n}',
    typescript: 'interface Example {\n  \n}\n'
  }
  return templates[type] || ''
}

const generatePreviewContent = () => {
  const htmlFile = files.value.find(f => f.name === 'index.html')
  const cssFiles = files.value.filter(f => f.type === 'css')
  const jsFiles = files.value.filter(f => f.type === 'javascript')

  let html = htmlFile ? htmlFile.content : ''
  
  // Inject framework if needed
  if (currentFramework.value !== 'vanilla') {
    html = injectFrameworkDependencies(html)
  }

  // Inject styles
  const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n')
  html = html.replace('</head>', `${styles}</head>`)

  // Inject scripts
  const scripts = jsFiles.map(f => `<script>${f.content}</script>`).join('\n')
  html = html.replace('</body>', `${scripts}</body>`)

  return html
}

const injectFrameworkDependencies = (html) => {
  const frameworks = {
    vue: '<script src="https://unpkg.com/vue@3"></script>',
    react: `
      <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
      <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    `,
    svelte: '<script src="https://unpkg.com/svelte"></script>'
  }

  const injection = frameworks[currentFramework.value] || ''
  return html.replace('</head>', `${injection}</head>`)
}

const getCodeSandboxTemplate = () => {
  switch (currentFramework.value) {
    case 'vue':
      return 'vue-ts'
    case 'react':
      return 'react-ts'
    case 'svelte':
      return 'svelte'
    default:
      return 'static'
  }
}

// Event Handlers
const handleMessage = (event) => {
  if (event.data.type === 'console') {
    consoleLogs.value.push({
      type: event.data.method,
      content: event.data.args.join(' ')
    })
  }
}

// Lifecycle Hooks
onMounted(() => {
  window.addEventListener('message', handleMessage)
  
  // Load from URL if present
  const urlParams = new URLSearchParams(window.location.search)
  const playgroundData = urlParams.get('playground')
  if (playgroundData) {
    try {
      const data = JSON.parse(decompress(playgroundData))
      files.value = data.files
      currentFramework.value = data.framework
    } catch (error) {
      console.error('Failed to load playground data:', error)
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})

// Watch for file changes to update preview
watch(
  [() => files.value, currentFramework],
  () => {
    if (autoRefresh.value) {
      refreshPreview()
    }
  },
  { deep: true }
)
</script>

<style scoped>
.code-playground {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

/* Header */
.playground-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.playground-title {
  display: flex;
  flex-direction: column;
}

.playground-title h3 {
  margin: 0;
  font-size: 1rem;
}

.playground-description {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.playground-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Framework Selector */
.framework-selector select {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  font-size: 0.875rem;
}

/* View Options */
.view-options {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}

.view-options button {
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.view-options button:hover {
  background: var(--vp-c-bg-soft);
}

.view-options button.active {
  background: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand);
}

/* Actions Menu */
.actions-dropdown {
  position: relative;
}

.actions-trigger {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
}

.actions-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.actions-menu button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--vp-c-text);
  cursor: pointer;
  text-align: left;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.actions-menu button:hover {
  background: var(--vp-c-bg-soft);
}

/* Playground Content */
.playground-content {
  display: grid;
  flex: 1;
  overflow: hidden;
}

.playground-content.editor {
  grid-template-columns: 1fr;
}

.playground-content.preview {
  grid-template-columns: 1fr;
}

.playground-content.split {
  grid-template-columns: 1fr 1fr;
}

/* Editor Panel */
.editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--vp-c-divider);
}

.editor-tabs {
  display: flex;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  overflow-x: auto;
}

.editor-tabs button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.editor-tabs button:hover {
  background: var(--vp-c-bg-mute);
}

.editor-tabs button.active {
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

.unsaved-indicator {
  color: var(--vp-c-brand);
}

.add-file {
  margin-left: auto;
  padding: 0.5rem !important;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
  font-size: 0.875rem;
}

.file-info {
  display: flex;
  gap: 1rem;
  color: var(--vp-c-text-2);
}

.editor-settings {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.editor-settings button,
.editor-settings select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
}

/* Preview Panel */
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.preview-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.preview-controls button,
.preview-controls select {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
}

.preview-controls button.active {
  background: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand);
}

.preview-container {
  flex: 1;
  overflow: hidden;
  background: white;
}

.preview-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Preview Modes */
.preview-container.tablet {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
}

.preview-container.tablet iframe {
  width: 768px;
  height: 1024px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.preview-container.mobile {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
}

.preview-container.mobile iframe {
  width: 375px;
  height: 667px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

/* Console */
.preview-console {
  height: 200px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.console-controls {
  display: flex;
  gap: 0.5rem;
}

.console-controls button {
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.console-output {
  height: calc(100% - 36px);
  overflow-y: auto;
  padding: 0.5rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.log-entry i {
  color: var(--vp-c-text-2);
}

.log-entry.error i {
  color: var(--vp-c-red);
}

.log-entry.warn i {
  color: var(--vp-c-yellow);
}

.log-entry.info i {
  color: var(--vp-c-blue);
}

.log-entry pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Modal Forms */
.new-file-form,
.share-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.input-group input,
.input-group select,
.input-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

.copy-input {
  display: flex;
  gap: 0.5rem;
}

.copy-input input {
  flex: 1;
}

.copy-input button {
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
}

.embed-options {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .playground-content.split {
    grid-template-columns: 1fr;
  }

  .playground-controls {
    display: none;
  }

  .view-options {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
  }
}
</style>