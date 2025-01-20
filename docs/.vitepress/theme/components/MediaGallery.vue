<template>
  <div class="media-gallery">
    <!-- Gallery Header -->
    <div class="gallery-header">
      <h2>Media Gallery</h2>
      <div class="gallery-controls">
        <div class="view-options">
          <button 
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            title="Grid View"
          >
            <i class="i-carbon-grid"></i>
          </button>
          <button 
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            title="List View"
          >
            <i class="i-carbon-list"></i>
          </button>
        </div>
        <div class="filter-sort">
          <select v-model="currentFilter">
            <option value="all">All Media</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
            <option value="documents">Documents</option>
          </select>
          <select v-model="currentSort">
            <option value="date-new">Newest First</option>
            <option value="date-old">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size">Size</option>
          </select>
        </div>
        <button 
          class="upload-btn"
          @click="showUploadModal = true"
        >
          <i class="i-carbon-upload"></i>
          Upload Media
        </button>
      </div>
    </div>

    <!-- Gallery Content -->
    <div 
      class="gallery-content"
      :class="viewMode"
    >
      <div 
        v-for="item in filteredMedia" 
        :key="item.id"
        class="media-item"
        @click="selectItem(item)"
      >
        <div class="media-preview">
          <img 
            v-if="item.type === 'image'"
            :src="item.thumbnail"
            :alt="item.name"
            loading="lazy"
          />
          <video 
            v-else-if="item.type === 'video'"
            :src="item.thumbnail"
            preload="metadata"
          ></video>
          <div 
            v-else
            class="document-preview"
          >
            <i :class="getFileIcon(item.fileType)"></i>
          </div>
          <div class="media-overlay">
            <button 
              class="preview-btn"
              @click.stop="previewMedia(item)"
            >
              <i class="i-carbon-view"></i>
            </button>
            <button 
              class="download-btn"
              @click.stop="downloadMedia(item)"
            >
              <i class="i-carbon-download"></i>
            </button>
          </div>
        </div>
        <div class="media-info">
          <div class="media-name">{{ item.name }}</div>
          <div class="media-meta">
            <span>{{ formatSize(item.size) }}</span>
            <span>{{ formatDate(item.date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div 
      v-if="filteredMedia.length === 0"
      class="empty-state"
    >
      <i class="i-carbon-no-image"></i>
      <p>No media found</p>
      <button 
        class="upload-btn"
        @click="showUploadModal = true"
      >
        Upload Media
      </button>
    </div>

    <!-- Upload Modal -->
    <teleport to="body">
      <div 
        v-if="showUploadModal"
        class="modal-overlay"
        @click="showUploadModal = false"
      >
        <div 
          class="upload-modal"
          @click.stop
        >
          <div class="modal-header">
            <h3>Upload Media</h3>
            <button 
              class="close-btn"
              @click="showUploadModal = false"
            >
              <i class="i-carbon-close"></i>
            </button>
          </div>
          <div 
            class="upload-area"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            :class="{ dragging: isDragging }"
          >
            <input
              type="file"
              ref="fileInput"
              multiple
              @change="handleFileSelect"
              class="file-input"
            />
            <i class="i-carbon-upload"></i>
            <p>Drag and drop files here or click to browse</p>
            <button 
              class="browse-btn"
              @click="$refs.fileInput.click()"
            >
              Browse Files
            </button>
          </div>
          <div 
            v-if="uploadQueue.length"
            class="upload-queue"
          >
            <div 
              v-for="file in uploadQueue"
              :key="file.name"
              class="queue-item"
            >
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatSize(file.size) }}</span>
              </div>
              <div class="upload-progress">
                <div 
                  class="progress-bar"
                  :style="{ width: file.progress + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Preview Modal -->
    <teleport to="body">
      <div 
        v-if="previewItem"
        class="modal-overlay"
        @click="previewItem = null"
      >
        <div 
          class="preview-modal"
          @click.stop
        >
          <button 
            class="close-btn"
            @click="previewItem = null"
          >
            <i class="i-carbon-close"></i>
          </button>
          <div class="preview-content">
            <img 
              v-if="previewItem.type === 'image'"
              :src="previewItem.url"
              :alt="previewItem.name"
            />
            <video 
              v-else-if="previewItem.type === 'video'"
              :src="previewItem.url"
              controls
            ></video>
            <iframe
              v-else
              :src="previewItem.url"
              frameborder="0"
            ></iframe>
          </div>
          <div class="preview-info">
            <h3>{{ previewItem.name }}</h3>
            <div class="info-meta">
              <span>{{ formatSize(previewItem.size) }}</span>
              <span>{{ formatDate(previewItem.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// State
const viewMode = ref('grid')
const currentFilter = ref('all')
const currentSort = ref('date-new')
const showUploadModal = ref(false)
const isDragging = ref(false)
const uploadQueue = ref([])
const previewItem = ref(null)
const mediaItems = ref([])

// Sample media data (replace with your actual data source)
const sampleMedia = [
  {
    id: 1,
    name: 'Sample Image.jpg',
    type: 'image',
    fileType: 'jpg',
    size: 1024000,
    date: '2024-01-15T10:30:00',
    thumbnail: '/sample-image-thumb.jpg',
    url: '/sample-image.jpg'
  },
  {
    id: 2,
    name: 'Documentation.pdf',
    type: 'document',
    fileType: 'pdf',
    size: 2048000,
    date: '2024-01-14T15:45:00',
    thumbnail: null,
    url: '/documentation.pdf'
  }
  // Add more sample items as needed
]

// Computed
const filteredMedia = computed(() => {
  let filtered = [...mediaItems.value]

  // Apply filter
  if (currentFilter.value !== 'all') {
    filtered = filtered.filter(item => item.type === currentFilter.value)
  }

  // Apply sort
  filtered.sort((a, b) => {
    switch (currentSort.value) {
      case 'date-new':
        return new Date(b.date) - new Date(a.date)
      case 'date-old':
        return new Date(a.date) - new Date(b.date)
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'size':
        return b.size - a.size
      default:
        return 0
    }
  })

  return filtered
})

// Methods
const selectItem = (item) => {
  // Handle item selection
  console.log('Selected:', item)
}

const previewMedia = (item) => {
  previewItem.value = item
}

const downloadMedia = async (item) => {
  try {
    const response = await fetch(item.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  processFiles(files)
}

const processFiles = (files) => {
  files.forEach(file => {
    // Add file to upload queue with progress tracking
    uploadQueue.value.push({
      name: file.name,
      size: file.size,
      progress: 0,
      file
    })
    
    // Simulate file upload
    simulateUpload(file)
  })
}

const simulateUpload = (file) => {
  const queueItem = uploadQueue.value.find(item => item.file === file)
  
  // Simulate progress updates
  const interval = setInterval(() => {
    if (queueItem.progress < 100) {
      queueItem.progress += 10
    } else {
      clearInterval(interval)
      // Add uploaded file to media items
      addMediaItem(file)
      // Remove from upload queue
      uploadQueue.value = uploadQueue.value.filter(item => item.file !== file)
    }
  }, 500)
}

const addMediaItem = (file) => {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  
  const newItem = {
    id: Date.now(),
    name: file.name,
    type: isImage ? 'image' : isVideo ? 'video' : 'document',
    fileType: file.name.split('.').pop().toLowerCase(),
    size: file.size,
    date: new Date().toISOString(),
    thumbnail: isImage ? URL.createObjectURL(file) : null,
    url: URL.createObjectURL(file)
  }
  
  mediaItems.value.push(newItem)
}

const getFileIcon = (fileType) => {
  const iconMap = {
    pdf: 'i-carbon-document-pdf',
    doc: 'i-carbon-document-word',
    docx: 'i-carbon-document-word',
    xls: 'i-carbon-document-excel',
    xlsx: 'i-carbon-document-excel',
    // Add more file types as needed
    default: 'i-carbon-document'
  }
  
  return iconMap[fileType] || iconMap.default
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  // Initialize with sample data
  mediaItems.value = sampleMedia
})
</script>

<style scoped>
.media-gallery {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.gallery-header h2 {
  margin: 0;
}

.gallery-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.view-options {
  display: flex;
  gap: 0.5rem;
}

.view-options button {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-options button.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.filter-sort {
  display: flex;
  gap: 0.5rem;
}

.filter-sort select {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.upload-btn:hover {
  background: var(--vp-c-brand-dark);
}

/* Gallery Content Styles */
.gallery-content {
  margin-top: 1rem;
}

.gallery-content.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.gallery-content.list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.media-item {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
}

.media-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.media-preview {
  position: relative;
  aspect-ratio: 16/9;
  background: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-preview img,
.media-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.document-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 2rem;
  color: var(--vp-c-text-2);
}

.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.media-item:hover .media-overlay {
  opacity: 1;
}

.media-overlay button {
  padding: 0.5rem;
  border-radius: 50%;
  background: white;
  color: var(--vp-c-text);
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.media-overlay button:hover {
  transform: scale(1.1);
}

.media-info {
  padding: 0.75rem;
  background: var(--vp-c-bg);
}

.media-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.media-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.upload-modal,
.preview-modal {
  background: var(--vp-c-bg);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--vp-c-bg-soft);
}

.upload-area {
  padding: 2rem;
  border: 2px dashed var(--vp-c-divider);
  border-radius: 8px;
  margin: 1rem;
  text-align: center;
  transition: all 0.2s ease;
}

.upload-area.dragging {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand);
}

.file-input {
  display: none;
}

.browse-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-queue {
  padding: 1rem;
}

.queue-item {
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.file-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.upload-progress {
  height: 4px;
  background: var(--vp-c-bg-soft);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--vp-c-brand);
  transition: width 0.3s ease;
}

.preview-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.preview-content img,
.preview-content video {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-content iframe {
  width: 100%;
  height: 70vh;
}

.preview-info {
  padding: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.info-meta {
  display: flex;
  gap: 1rem;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--vp-c-text-2);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .gallery-header {
    flex-direction: column;
    gap: 1rem;
  }

  .gallery-controls {
    flex-direction: column;
    width: 100%;
  }

  .filter-sort {
    width: 100%;
  }

  .filter-sort select {
    flex: 1;
  }

  .upload-btn {
    width: 100%;
    justify-content: center;
  }

  .gallery-content.grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>