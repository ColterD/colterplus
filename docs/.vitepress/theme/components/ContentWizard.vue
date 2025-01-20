<template>
  <div class="content-wizard">
    <!-- Wizard Header -->
    <div class="wizard-header">
      <h2>{{ title }}</h2>
      <div class="wizard-progress">
        <div class="steps">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="step"
            :class="{
              'active': currentStep === index,
              'completed': index < currentStep
            }"
            @click="goToStep(index)"
          >
            <div class="step-indicator">
              <i v-if="index < currentStep" class="i-carbon-checkmark"></i>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>
        <div class="progress-bar">
          <div 
            class="progress"
            :style="{ width: `${(currentStep / (steps.length - 1)) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="wizard-content">
      <!-- Template Selection Step -->
      <div v-if="currentStep === 0" class="template-selection">
        <div class="templates-grid">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-card"
            :class="{ 'selected': selectedTemplate === template.id }"
            @click="selectTemplate(template.id)"
          >
            <div class="template-preview">
              <i :class="template.icon"></i>
            </div>
            <div class="template-info">
              <h3>{{ template.name }}</h3>
              <p>{{ template.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Structure Step -->
      <div v-else-if="currentStep === 1" class="content-structure">
        <div class="structure-builder">
          <div 
            v-for="(section, index) in contentStructure"
            :key="index"
            class="section-item"
          >
            <div class="section-header">
              <input
                v-model="section.title"
                type="text"
                placeholder="Section Title"
              >
              <div class="section-controls">
                <button @click="moveSection(index, 'up')" :disabled="index === 0">
                  <i class="i-carbon-arrow-up"></i>
                </button>
                <button 
                  @click="moveSection(index, 'down')"
                  :disabled="index === contentStructure.length - 1"
                >
                  <i class="i-carbon-arrow-down"></i>
                </button>
                <button @click="removeSection(index)">
                  <i class="i-carbon-trash-can"></i>
                </button>
              </div>
            </div>
            <div class="section-content">
              <select v-model="section.type">
                <option value="text">Text Content</option>
                <option value="image">Image</option>
                <option value="code">Code Block</option>
                <option value="list">List</option>
                <option value="table">Table</option>
              </select>
              <textarea
                v-if="section.type === 'text'"
                v-model="section.content"
                placeholder="Enter content..."
                rows="3"
              ></textarea>
              <div 
                v-else-if="section.type === 'image'"
                class="image-upload"
              >
                <input
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload($event, index)"
                  class="file-input"
                >
                <div class="upload-preview">
                  <img 
                    v-if="section.content"
                    :src="section.content"
                    alt="Preview"
                  >
                  <div v-else class="upload-placeholder">
                    <i class="i-carbon-image"></i>
                    <span>Click to upload image</span>
                  </div>
                </div>
              </div>
              <div 
                v-else-if="section.type === 'code'"
                class="code-editor"
              >
                <select v-model="section.language">
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </select>
                <textarea
                  v-model="section.content"
                  placeholder="Enter code..."
                  rows="5"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        <button 
          class="add-section"
          @click="addSection"
        >
          <i class="i-carbon-add"></i>
          Add Section
        </button>
      </div>

      <!-- Metadata Step -->
      <div v-else-if="currentStep === 2" class="metadata-form">
        <div class="form-group">
          <label>Title</label>
          <input
            v-model="metadata.title"
            type="text"
            placeholder="Enter content title"
          >
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea
            v-model="metadata.description"
            placeholder="Enter content description"
            rows="3"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Tags</label>
          <div class="tags-input">
            <div class="tags-list">
              <span
                v-for="(tag, index) in metadata.tags"
                :key="index"
                class="tag"
              >
                {{ tag }}
                <button @click="removeTag(index)">×</button>
              </span>
            </div>
            <input
              v-model="newTag"
              @keyup.enter="addTag"
              type="text"
              placeholder="Add tag and press Enter"
            >
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select v-model="metadata.category">
              <option value="">Select category</option>
              <option 
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="metadata.status">
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Preview Step -->
      <div v-else-if="currentStep === 3" class="content-preview">
        <div class="preview-header">
          <h1>{{ metadata.title }}</h1>
          <div class="preview-meta">
            <span class="category">{{ getCategoryName(metadata.category) }}</span>
            <span class="status" :class="metadata.status">
              {{ metadata.status }}
            </span>
          </div>
          <p class="description">{{ metadata.description }}</p>
          <div class="tags">
            <span 
              v-for="(tag, index) in metadata.tags"
              :key="index"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        <div class="preview-content">
          <div
            v-for="(section, index) in contentStructure"
            :key="index"
            class="preview-section"
          >
            <h2 v-if="section.title">{{ section.title }}</h2>
            <div 
              v-if="section.type === 'text'"
              class="text-content"
              v-html="formatContent(section.content)"
            ></div>
            <img
              v-else-if="section.type === 'image'"
              :src="section.content"
              :alt="section.title"
            >
            <pre
              v-else-if="section.type === 'code'"
              :class="`language-${section.language}`"
            ><code>{{ section.content }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Wizard Footer -->
    <div class="wizard-footer">
      <button
        v-if="currentStep > 0"
        class="secondary"
        @click="previousStep"
      >
        <i class="i-carbon-arrow-left"></i>
        Previous
      </button>
      <button
        v-if="currentStep < steps.length - 1"
        class="primary"
        @click="nextStep"
        :disabled="!canProceed"
      >
        Next
        <i class="i-carbon-arrow-right"></i>
      </button>
      <button
        v-else
        class="primary"
        @click="finishWizard"
        :disabled="!isComplete"
      >
        <i class="i-carbon-checkmark"></i>
        Finish
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from 'vitepress'
import markdownIt from 'markdown-it'

const md = markdownIt()
const { theme } = useData()

// State
const title = ref('Content Wizard')
const currentStep = ref(0)
const selectedTemplate = ref(null)
const newTag = ref('')
const contentStructure = ref([])
const metadata = ref({
  title: '',
  description: '',
  tags: [],
  category: '',
  status: 'draft'
})

// Steps Configuration
const steps = [
  { label: 'Choose Template', validator: () => selectedTemplate.value !== null },
  { label: 'Structure Content', validator: () => contentStructure.value.length > 0 },
  { label: 'Add Metadata', validator: () => validateMetadata() },
  { label: 'Preview', validator: () => true }
]

// Templates
const templates = [
  {
    id: 'article',
    name: 'Article',
    description: 'Standard article template with sections and images',
    icon: 'i-carbon-document',
    structure: [
      { type: 'text', title: 'Introduction', content: '' },
      { type: 'text', title: 'Main Content', content: '' },
      { type: 'text', title: 'Conclusion', content: '' }
    ]
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Step-by-step guide with code examples',
    icon: 'i-carbon-education',
    structure: [
      { type: 'text', title: 'Overview', content: '' },
      { type: 'code', title: 'Code Example', content: '', language: 'javascript' },
      { type: 'text', title: 'Explanation', content: '' }
    ]
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Technical documentation with API references',
    icon: 'i-carbon-book',
    structure: [
      { type: 'text', title: 'Introduction', content: '' },
      { type: 'code', title: 'Usage Example', content: '', language: 'javascript' },
      { type: 'text', title: 'API Reference', content: '' }
    ]
  }
]

// Categories
const categories = [
  { id: 'guides', name: 'Guides' },
  { id: 'tutorials', name: 'Tutorials' },
  { id: 'reference', name: 'Reference' },
  { id: 'blog', name: 'Blog' }
]

// Computed
const canProceed = computed(() => {
  return steps[currentStep.value].validator()
})

const isComplete = computed(() => {
  return steps.every(step => step.validator())
})

// Methods
const selectTemplate = (templateId) => {
  selectedTemplate.value = templateId
  const template = templates.find(t => t.id === templateId)
  contentStructure.value = JSON.parse(JSON.stringify(template.structure))
}

const addSection = () => {
  contentStructure.value.push({
    type: 'text',
    title: '',
    content: ''
  })
}

const removeSection = (index) => {
  contentStructure.value.splice(index, 1)
}

const moveSection = (index, direction) => {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex >= 0 && newIndex < contentStructure.value.length) {
    const sections = [...contentStructure.value]
    const temp = sections[index]
    sections[index] = sections[newIndex]
    sections[newIndex] = temp
    contentStructure.value = sections
  }
}

const handleImageUpload = (event, index) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      contentStructure.value[index].content = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const addTag = () => {
  if (newTag.value.trim() && !metadata.value.tags.includes(newTag.value.trim())) {
    metadata.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (index) => {
  metadata.value.tags.splice(index, 1)
}

const validateMetadata = () => {
  return (
    metadata.value.title.trim() !== '' &&
    metadata.value.description.trim() !== '' &&
    metadata.value.category !== '' &&
    metadata.value.tags.length > 0
  )
}

const formatContent = (content) => {
  return md.render(content)
}

const getCategoryName = (categoryId) => {
  const category = categories.find(c => c.id === categoryId)
  return category ? category.name : ''
}

const goToStep = (step) => {
  if (step < currentStep.value || steps[currentStep.value].validator()) {
    currentStep.value = step
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1 && canProceed.value) {
    currentStep.value++
  }
}

const finishWizard = () => {
  if (isComplete.value) {
    const finalContent = {
      metadata: { ...metadata.value },
      content: contentStructure.value,
      template: selectedTemplate.value,
      createdAt: new Date().toISOString()
    }
    
    // Emit the final content or handle saving
    console.log('Final Content:', finalContent)
    
    // You can emit an event here
    // emit('complete', finalContent)
  }
}
</script>

<style scoped>
.content-wizard {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

/* Wizard Header */
.wizard-header {
  margin-bottom: 2rem;
}

.wizard-header h2 {
  margin-bottom: 1.5rem;
}

.wizard-progress {
  position: relative;
  padding: 0 1rem;
}

.steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex: 1;
}

.step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

.step.active .step-indicator {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: white;
}

.step.completed .step-indicator {
  background: var(--vp-c-brand-light);
  border-color: var(--vp-c-brand-light);
  color: white;
}

.step-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.step.active .step-label {
  color: var(--vp-c-brand);
}

.progress-bar {
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--vp-c-divider);
  z-index: 0;
  margin: 0 2.5rem;
}

.progress {
  height: 100%;
  background: var(--vp-c-brand);
  transition: width 0.3s ease;
}

/* Template Selection */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.template-card {
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-card.selected {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-brand-dimm);
}

.template-preview {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--vp-c-brand);
}

.template-info h3 {
  margin: 0 0 0.5rem 0;
}

.template-info p {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

/* Content Structure */
.structure-builder {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.section-header input {
  flex: 1;
  margin-right: 1rem;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
}

.section-controls {
  display: flex;
  gap: 0.5rem;
}

.section-content {
  padding: 1rem;
}

.section-content select {
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
}

.section-content textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  resize: vertical;
}

.image-upload {
  position: relative;
  border: 2px dashed var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 1rem;
}

.upload-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-text-2);
}

.upload-placeholder i {
  font-size: 2rem;
}

/* Metadata Form */
.metadata-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.tags-input {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.5rem;
  background: var(--vp-c-bg);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand-dark);
  border-radius: 16px;
  font-size: 0.875rem;
}

.tag button {
  border: none;
  background: none;
  padding: 0;
  font-size: 1.2em;
  line-height: 1;
  color: currentColor;
  cursor: pointer;
}

/* Preview */
.content-preview {
  max-width: 800px;
  margin: 0 auto;
}

.preview-header {
  margin-bottom: 2rem;
}

.preview-meta {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.875rem;
  text-transform: capitalize;
}

.status.draft {
  background: var(--vp-c-gray-dimm);
  color: var(--vp-c-text-2);
}

.status.review {
  background: var(--vp-c-yellow-dimm);
  color: var(--vp-c-yellow-dark);
}

.status.published {
  background: var(--vp-c-green-dimm);
  color: var(--vp-c-green-dark);
}

.preview-content {
  font-size: 1.1rem;
  line-height: 1.6;
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section pre {
  padding: 1rem;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  overflow-x: auto;
}

/* Wizard Footer */
.wizard-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.primary {
  background: var(--vp-c-brand);
  color: white;
  border: none;
}

button.secondary {
  background: var(--vp-c-bg-soft);
}

button.primary:hover:not(:disabled) {
  background: var(--vp-c-brand-dark);
}

button.secondary:hover:not(:disabled) {
  background: var(--vp-c-bg-mute);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .steps {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .progress-bar {
    display: none;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .wizard-footer {
    flex-direction: column;
    gap: 1rem;
  }

  button {
    width: 100%;
    justify-content: center;
  }
}
</style>