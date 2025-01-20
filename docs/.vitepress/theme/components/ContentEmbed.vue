<template>
  <div class="content-embed">
    <!-- Code Playground -->
    <div v-if="type === 'code'" class="playground-embed">
      <div class="playground-header">
        <div class="file-tabs">
          <button 
            v-for="file in files"
            :key="file.name"
            @click="currentFile = file"
            :class="{ active: currentFile === file }"
            class="file-tab"
          >
            {{ file.name }}
          </button>
          <button 
            v-if="canAddFile"
            @click="addNewFile"
            class="add-file"
          >
            +
          </button>
        </div>
        <div class="playground-actions">
          <button 
            class="action-button"
            @click="formatCode"
            title="Format Code"
          >
            ⚡
          </button>
          <button 
            class="action-button"
            @click="runCode"
            :disabled="isRunning"
          >
            {{ isRunning ? '⏳' : '▶️' }}
          </button>
        </div>
      </div>

      <div class="playground-container">
        <div class="editor-container">
          <MonacoEditor
            v-model="currentFile.content"
            :language="currentFile.language"
            :theme="editorTheme"
            @change="handleEditorChange"
          />
        </div>
        <div 
          v-if="showPreview"
          class="preview-container"
          :class="{ 'has-error': hasError }"
        >
          <div class="preview-header">
            <span>Preview</span>
            <button 
              class="refresh-button"
              @click="refreshPreview"
            >
              🔄
            </button>
          </div>
          <div class="preview-content" ref="previewFrame">
            <!-- Preview content will be injected here -->
          </div>
          <div v-if="hasError" class="error-message">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- Diagram Editor -->
    <div v-else-if="type === 'diagram'" class="diagram-embed">
      <div class="diagram-toolbar">
        <select v-model="diagramType">
          <option value="flowchart">Flowchart</option>
          <option value="sequence">Sequence</option>
          <option value="gantt">Gantt</option>
          <option value="class">Class</option>
          <option value="state">State</option>
        </select>
        <button 
          class="export-button"
          @click="exportDiagram"
        >
          Export SVG
        </button>
      </div>

      <div class="diagram-container">
        <div class="diagram-editor">
          <textarea
            v-model="diagramCode"
            @input="updateDiagram"
            placeholder="Enter diagram code..."
          ></textarea>
        </div>
        <div class="diagram-preview" ref="diagramContainer">
          <!-- Mermaid diagram will be rendered here -->
        </div>
      </div>
    </div>

    <!-- Math Editor -->
    <div v-else-if="type === 'math'" class="math-embed">
      <div class="math-toolbar">
        <div class="math-mode">
          <button 
            :class="{ active: mathMode === 'inline' }"
            @click="mathMode = 'inline'"
          >
            Inline
          </button>
          <button 
            :class="{ active: mathMode === 'display' }"
            @click="mathMode = 'display'"
          >
            Display
          </button>
        </div>
        <button 
          class="copy-button"
          @click="copyMathCode"
        >
          Copy LaTeX
        </button>
      </div>

      <div class="math-container">
        <div class="math-editor">
          <textarea
            v-model="mathCode"
            @input="updateMath"
            placeholder="Enter LaTeX code..."
          ></textarea>
        </div>
        <div class="math-preview" ref="mathContainer">
          <!-- KaTeX output will be rendered here -->
        </div>
      </div>
    </div>

    <!-- Markdown Editor -->
    <div v-else-if="type === 'markdown'" class="markdown-embed">
      <div class="markdown-toolbar">
        <div class="formatting-buttons">
          <button @click="insertMarkdown('bold')" title="Bold">B</button>
          <button @click="insertMarkdown('italic')" title="Italic">I</button>
          <button @click="insertMarkdown('link')" title="Link">🔗</button>
          <button @click="insertMarkdown('image')" title="Image">🖼️</button>
          <button @click="insertMarkdown('code')" title="Code">📝</button>
        </div>
        <button 
          class="preview-toggle"
          @click="toggleMarkdownPreview"
        >
          {{ showMarkdownPreview ? 'Edit' : 'Preview' }}
        </button>
      </div>

      <div class="markdown-container">
        <textarea
          v-if="!showMarkdownPreview"
          v-model="markdownCode"
          @input="updateMarkdown"
          placeholder="Enter Markdown..."
        ></textarea>
        <div 
          v-else 
          class="markdown-preview"
          v-html="renderedMarkdown"
        ></div>
      </div>
    </div>

    <!-- Settings Panel -->
    <div class="embed-settings">
      <button 
        class="settings-toggle"
        @click="showSettings = !showSettings"
      >
        ⚙️
      </button>

      <div v-if="showSettings" class="settings-panel">
        <div class="settings-header">
          <h3>Embed Settings</h3>
          <button @click="showSettings = false">×</button>
        </div>

        <div class="settings-content">
          <div class="setting-group">
            <label>Theme</label>
            <select v-model="embedTheme">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div class="setting-group">
            <label>Auto Refresh</label>
            <input 
              type="checkbox"
              v-model="autoRefresh"
            >
          </div>

          <div class="setting-group">
            <label>Font Size</label>
            <input 
              type="range"
              v-model="fontSize"
              min="12"
              max="20"
            >
          </div>

          <div class="setting-group">
            <label>Layout</label>
            <select v-model="layout">
              <option value="horizontal">Side by Side</option>
              <option value="vertical">Stacked</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import * as monaco from 'monaco-editor'
import mermaid from 'mermaid'
import katex from 'katex'
import { marked } from 'marked'

// Props
const props = defineProps({
  type: {
    type: String,
    default: 'code',
    validator: (value) => ['code', 'diagram', 'math', 'markdown'].includes(value)
  },
  initialValue: {
    type: String,
    default: ''
  }
})

// State
const showSettings = ref(false)
const embedTheme = ref('system')
const autoRefresh = ref(true)
const fontSize = ref(14)
const layout = ref('horizontal')
const isRunning = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const showPreview = ref(true)

// Code Playground State
const files = ref([
  { name: 'index.html', language: 'html', content: '' },
  { name: 'styles.css', language: 'css', content: '' },
  { name: 'script.js', language: 'javascript', content: '' }
])
const currentFile = ref(files.value[0])
const editorTheme = computed(() => 
  embedTheme.value === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs')
    : embedTheme.value === 'dark' ? 'vs-dark' : 'vs'
)

// Diagram State
const diagramType = ref('flowchart')
const diagramCode = ref('')

// Math State
const mathMode = ref('display')
const mathCode = ref('')

// Markdown State
const markdownCode = ref('')
const showMarkdownPreview = ref(false)
const renderedMarkdown = computed(() => marked(markdownCode.value))

// Methods
const handleEditorChange = () => {
  if (autoRefresh.value) {
    refreshPreview()
  }
}

const formatCode = () => {
  // Implement code formatting based on language
  try {
    const formatted = monaco.editor.getModels()[0].getFormatter().format()
    currentFile.value.content = formatted
  } catch (error) {
    console.error('Formatting failed:', error)
  }
}

const runCode = async () => {
  isRunning.value = true
  hasError.value = false
  
  try {
    const html = files.value.find(f => f.name === 'index.html')?.content || ''
    const css = files.value.find(f => f.name === 'styles.css')?.content || ''
    const js = files.value.find(f => f.name === 'script.js')?.content || ''

    const combinedCode = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `

    const previewFrame = document.createElement('iframe')
    previewFrame.srcdoc = combinedCode
    
    const previewContainer = document.querySelector('.preview-content')
    previewContainer.innerHTML = ''
    previewContainer.appendChild(previewFrame)
  } catch (error) {
    hasError.value = true
    errorMessage.value = error.message
  } finally {
    isRunning.value = false
  }
}

const refreshPreview = () => {
  if (props.type === 'code') {
    runCode()
  }
}

const updateDiagram = async () => {
  try {
    const container = document.querySelector('.diagram-preview')
    container.innerHTML = ''
    await mermaid.render('diagram', diagramCode.value, (svg) => {
      container.innerHTML = svg
    })
  } catch (error) {
    console.error('Diagram rendering failed:', error)
  }
}

const exportDiagram = async () => {
  try {
    const svg = document.querySelector('.diagram-preview svg')
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const updateMath = () => {
  try {
    const container = document.querySelector('.math-preview')
    katex.render(mathCode.value, container, {
      displayMode: mathMode.value === 'display',
      throwOnError: false
    })
  } catch (error) {
    console.error('Math rendering failed:', error)
  }
}

const copyMathCode = async () => {
  try {
    await navigator.clipboard.writeText(mathCode.value)
    window.$notify?.success('Copied!', 'LaTeX code copied to clipboard')
  } catch (error) {
    window.$notify?.error('Error', 'Failed to copy code')
  }
}

const insertMarkdown = (type) => {
  const textarea = document.querySelector('.markdown-embed textarea')
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = markdownCode.value

  let insertion = ''
  switch (type) {
    case 'bold':
      insertion = `**${text.slice(start, end) || 'bold text'}**`
      break
    case 'italic':
      insertion = `*${text.slice(start, end) || 'italic text'}*`
      break
    case 'link':
      insertion = `[${text.slice(start, end) || 'link text'}](url)`
      break
    case 'image':
      insertion = `![${text.slice(start, end) || 'alt text'}](image-url)`
      break
    case 'code':
      insertion = `\`${text.slice(start, end) || 'code'}\``
      break
  }

  markdownCode.value = text.slice(0, start) + insertion + text.slice(end)
  updateMarkdown()
}

const toggleMarkdownPreview = () => {
  showMarkdownPreview.value = !showMarkdownPreview.value
}

// Lifecycle
onMounted(() => {
  if (props.type === 'diagram') {
    mermaid.initialize({
      theme: embedTheme.value === 'dark' ? 'dark' : 'default',
      startOnLoad: true
    })
  }

  if (props.initialValue) {
    switch (props.type) {
      case 'code':
        currentFile.value.content = props.initialValue
        break
      case 'diagram':
        diagramCode.value = props.initialValue
        updateDiagram()
        break
      case 'math':
        mathCode.value = props.initialValue
        updateMath()
        break
      case 'markdown':
        markdownCode.value = props.initialValue
        break
    }
  }
})

// Watch for theme changes
watch(embedTheme, (newTheme) => {
  if (props.type === 'diagram') {
    mermaid.initialize({
      theme: newTheme === 'dark' ? 'dark' : 'default'
    })
    updateDiagram()
  }
})

// Watch for auto-refresh
watch(autoRefresh, (newValue) => {
  if (newValue && props.type === 'code') {
    refreshPreview()
  }
})
</script>

<style scoped>
.content-embed {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

/* Common styles */
.embed-header {
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-button {
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover:not(:disabled) {
  background: var(--vp-c-bg-mute);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Code Playground styles */
.playground-embed {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.playground-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
}

.file-tabs {
  display: flex;
  gap: 0.25rem;
}

.file-tab {
  padding: 0.25rem 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  color: var(--vp-c-text-2);
}

.file-tab.active {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.playground-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--vp-c-divider);
}

.preview-header {
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.error-message {
  padding: 1rem;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger);
  font-family: monospace;
}

/* Diagram styles */
.diagram-embed {
  padding: 1rem;
}

.diagram-toolbar {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}

.diagram-container {
  display: flex;
  gap: 1rem;
  min-height: 300px;
}

.diagram-editor {
  flex: 1;
}

.diagram-editor textarea {
  width: 100%;
  height: 100%;
  min-height: 300px;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  font-family: monospace;
  resize: vertical;
}

.diagram-preview {
  flex: 1;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  overflow: auto;
}

/* Math styles */
.math-embed {
  padding: 1rem;
}

.math-toolbar {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.math-mode {
  display: flex;
  gap: 0.5rem;
}

.math-container {
  display: flex;
  gap: 1rem;
  min-height: 200px;
}

.math-editor {
  flex: 1;
}

.math-editor textarea {
  width: 100%;
  height: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  font-family: monospace;
  resize: vertical;
}

.math-preview {
  flex: 1;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

/* Markdown styles */
.markdown-embed {
  padding: 1rem;
}

.markdown-toolbar {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.formatting-buttons {
  display: flex;
  gap: 0.5rem;
}

.markdown-container {
  min-height: 300px;
}

.markdown-container textarea {
  width: 100%;
  height: 100%;
  min-height: 300px;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  font-family: monospace;
  resize: vertical;
}

.markdown-preview {
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  min-height: 300px;
  overflow: auto;
}

/* Settings styles */
.embed-settings {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.settings-toggle {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.settings-toggle:hover {
  opacity: 1;
}

.settings-panel {
  position: absolute;
  top: 100%;
  right: 0;
  width: 250px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.settings-header {
  padding: 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h3 {
  margin: 0;
  font-size: 1em;
}

.settings-content {
  padding: 0.75rem;
}

.setting-group {
  margin-bottom: 0.75rem;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group label {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--vp-c-text-2);
}

/* Mobile styles */
@media (max-width: 768px) {
  .playground-container,
  .diagram-container,
  .math-container {
    flex-direction: column;
  }

  .preview-container {
    border-left: none;
    border-top: 1px solid var(--vp-c-divider);
  }

  .settings-panel {
    position: fixed;
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    border-radius: 8px 8px 0 0;
  }
}
</style>