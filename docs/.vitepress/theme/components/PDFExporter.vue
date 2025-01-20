<template>
  <div class="pdf-exporter">
    <button 
      class="export-button"
      @click="showExportOptions"
      :disabled="isExporting"
    >
      <span class="icon" v-if="!isExporting">📄</span>
      <span class="loading-icon" v-else>🔄</span>
      {{ isExporting ? 'Generating PDF...' : 'Export as PDF' }}
    </button>

    <div v-if="showOptions" class="export-modal">
      <div class="modal-backdrop" @click="hideExportOptions"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>PDF Export Options</h3>
          <button class="close-button" @click="hideExportOptions">×</button>
        </div>

        <div class="options-content">
          <!-- Page Options -->
          <div class="options-section">
            <h4>Page Settings</h4>
            <div class="option-group">
              <label>
                Page Size
                <select v-model="options.pageSize">
                  <option v-for="size in pageSizes" :key="size" :value="size">
                    {{ size }}
                  </option>
                </select>
              </label>

              <label>
                Orientation
                <select v-model="options.orientation">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>

              <label>
                Margins
                <div class="margins-input">
                  <input 
                    type="number" 
                    v-model="options.margin"
                    min="0"
                    max="50"
                  > mm
                </div>
              </label>
            </div>
          </div>

          <!-- Content Options -->
          <div class="options-section">
            <h4>Content Options</h4>
            <div class="option-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox"
                  v-model="options.includeTableOfContents"
                >
                Include Table of Contents
              </label>

              <label class="checkbox-label">
                <input 
                  type="checkbox"
                  v-model="options.includeMetadata"
                >
                Include Metadata
              </label>

              <label class="checkbox-label">
                <input 
                  type="checkbox"
                  v-model="options.includeCover"
                >
                Include Cover Page
              </label>

              <label class="checkbox-label">
                <input 
                  type="checkbox"
                  v-model="options.includeFooter"
                >
                Include Page Numbers
              </label>
            </div>
          </div>

          <!-- Styling Options -->
          <div class="options-section">
            <h4>Styling</h4>
            <div class="option-group">
              <label>
                Font Size
                <div class="font-size-input">
                  <input 
                    type="range"
                    v-model="options.fontSize"
                    min="8"
                    max="16"
                    step="1"
                  >
                  <span>{{ options.fontSize }}pt</span>
                </div>
              </label>

              <label>
                Theme
                <select v-model="options.theme">
                  <option value="default">Default</option>
                  <option value="minimal">Minimal</option>
                  <option value="academic">Academic</option>
                </select>
              </label>

              <label class="checkbox-label">
                <input 
                  type="checkbox"
                  v-model="options.preserveColors"
                >
                Preserve Colors
              </label>
            </div>
          </div>

          <!-- Preview -->
          <div class="preview-section" v-if="options.includeCover">
            <h4>Cover Preview</h4>
            <div class="cover-preview" :style="coverStyles">
              <div class="preview-title">{{ documentTitle }}</div>
              <div class="preview-date">{{ formatDate(new Date()) }}</div>
              <div class="preview-url">{{ documentUrl }}</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            class="cancel-button"
            @click="hideExportOptions"
          >
            Cancel
          </button>
          <button 
            class="export-button"
            @click="generatePDF"
            :disabled="isExporting"
          >
            {{ isExporting ? 'Generating...' : 'Generate PDF' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import html2pdf from 'html2pdf.js'
import { useData } from 'vitepress'

const { page, theme } = useData()

// Constants
const pageSizes = ['A4', 'Letter', 'Legal', 'A3']

// State
const showOptions = ref(false)
const isExporting = ref(false)
const options = ref({
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 15,
  includeTableOfContents: true,
  includeMetadata: true,
  includeCover: true,
  includeFooter: true,
  fontSize: 12,
  theme: 'default',
  preserveColors: false
})

// Computed
const documentTitle = computed(() => page.value.title || 'Untitled Document')
const documentUrl = computed(() => window.location.href)

const coverStyles = computed(() => ({
  fontFamily: 'var(--vp-font-family-base)',
  fontSize: `${options.value.fontSize}pt`,
  backgroundColor: options.value.preserveColors ? 'var(--vp-c-bg)' : 'white',
  color: options.value.preserveColors ? 'var(--vp-c-text-1)' : 'black'
}))

// Methods
const showExportOptions = () => {
  showOptions.value = true
}

const hideExportOptions = () => {
  showOptions.value = false
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const generateCoverPage = () => {
  return `
    <div class="pdf-cover" style="
      text-align: center;
      padding: 100px 40px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    ">
      <h1 style="font-size: 24pt; margin-bottom: 40px;">${documentTitle.value}</h1>
      <div style="font-size: 12pt; margin-bottom: 20px;">${formatDate(new Date())}</div>
      <div style="font-size: 10pt; color: #666;">${documentUrl.value}</div>
    </div>
  `
}

const generateTableOfContents = () => {
  const headings = Array.from(document.querySelectorAll('h2, h3'))
  return headings.map(heading => {
    const level = heading.tagName === 'H2' ? 'padding-left: 0' : 'padding-left: 20px'
    return `
      <div style="${level}; margin: 8px 0;">
        ${heading.textContent}
      </div>
    `
  }).join('')
}

const generateFooter = () => {
  return `
    <div style="
      position: fixed;
      bottom: 0;
      width: 100%;
      text-align: center;
      padding: 10px;
      font-size: 9pt;
      color: #666;
    ">
      Page {page} of {total}
    </div>
  `
}

const cleanupContent = (content) => {
  // Remove interactive elements and unwanted content
  const cleanContent = content.cloneNode(true)
  cleanContent.querySelectorAll('button, .pdf-exporter, script').forEach(el => el.remove())
  return cleanContent
}

const generatePDF = async () => {
  try {
    isExporting.value = true
    
    // Get main content
    const contentElement = document.querySelector('.vp-doc')
    if (!contentElement) {
      throw new Error('Content element not found')
    }

    // Create container for PDF content
    const container = document.createElement('div')
    
    // Add cover page if enabled
    if (options.value.includeCover) {
      container.innerHTML += generateCoverPage()
    }

    // Add table of contents if enabled
    if (options.value.includeTableOfContents) {
      container.innerHTML += `
        <div class="pdf-toc">
          <h2>Table of Contents</h2>
          ${generateTableOfContents()}
        </div>
      `
    }

    // Add main content
    const cleanContent = cleanupContent(contentElement)
    container.appendChild(cleanContent)

    // Configure PDF options
    const pdfOptions = {
      margin: options.value.margin,
      filename: `${documentTitle.value}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: {
        unit: 'mm',
        format: options.value.pageSize,
        orientation: options.value.orientation
      },
      pagebreak: { mode: 'avoid-all' }
    }

    // Add footer if enabled
    if (options.value.includeFooter) {
      pdfOptions.footer = generateFooter()
    }

    // Generate PDF
    await html2pdf().from(container).set(pdfOptions).save()

    // Show success notification
    window.$notify?.success(
      'PDF Generated',
      'Your PDF has been created successfully'
    )
  } catch (error) {
    console.error('PDF generation failed:', error)
    window.$notify?.error(
      'Generation Failed',
      'Failed to generate PDF. Please try again.'
    )
  } finally {
    isExporting.value = false
    hideExportOptions()
  }
}
</script>

<style scoped>
.pdf-exporter {
  margin: 1rem 0;
}

.export-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-button:hover:not(:disabled) {
  background: var(--vp-c-brand-dark);
}

.export-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.export-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  background: var(--vp-c-bg);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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
  padding: 0.5rem;
}

.options-content {
  padding: 1rem;
  overflow-y: auto;
}

.options-section {
  margin-bottom: 1.5rem;
}

.options-section h4 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-group label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  flex-direction: row !important;
  align-items: center;
  cursor: pointer;
}

select,
input[type="number"] {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text);
}

.margins-input,
.font-size-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.cover-preview {
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  text-align: center;
}

.preview-title {
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 1rem;
}

.preview-date,
.preview-url {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button {
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text);
  cursor: pointer;
}

/* Mobile styles */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .options-section {
    margin-bottom: 1rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer button {
    width: 100%;
  }
}
</style>