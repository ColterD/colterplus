<template>
  <div class="feedback-widget">
    <!-- Floating Trigger Button -->
    <button 
      class="feedback-trigger"
      @click="showFeedback = true"
      :aria-label="'Send Feedback'"
      :title="'Send Feedback'"
    >
      <i class="i-carbon-feedback"></i>
    </button>

    <!-- Feedback Modal -->
    <teleport to="body">
      <modal-dialog
        v-if="showFeedback"
        @close="resetAndClose"
        :title="currentStep.title"
        size="medium"
      >
        <!-- Feedback Type Selection -->
        <div v-if="step === 'type'" class="feedback-types">
          <button
            v-for="type in feedbackTypes"
            :key="type.id"
            class="type-button"
            :class="{ selected: selectedType === type.id }"
            @click="selectFeedbackType(type.id)"
          >
            <i :class="type.icon"></i>
            <span class="type-label">{{ type.label }}</span>
            <span class="type-description">{{ type.description }}</span>
          </button>
        </div>

        <!-- Feedback Form -->
        <div v-else-if="step === 'form'" class="feedback-form">
          <!-- Satisfaction Rating -->
          <div v-if="showRating" class="rating-section">
            <h4>How satisfied are you?</h4>
            <div class="rating-buttons">
              <button
                v-for="rating in ratings"
                :key="rating.value"
                class="rating-button"
                :class="{ selected: feedback.rating === rating.value }"
                @click="selectRating(rating.value)"
              >
                <i :class="rating.icon"></i>
                <span>{{ rating.label }}</span>
              </button>
            </div>
          </div>

          <!-- Category Selection -->
          <div v-if="showCategories" class="category-section">
            <h4>What area are you providing feedback about?</h4>
            <select 
              v-model="feedback.category"
              class="category-select"
            >
              <option value="">Select a category</option>
              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.label }}
              </option>
            </select>
          </div>

          <!-- Description Input -->
          <div class="description-section">
            <h4>{{ currentStep.descriptionLabel }}</h4>
            <div class="rich-input">
              <textarea
                v-model="feedback.description"
                :placeholder="currentStep.placeholder"
                rows="4"
                @dragover.prevent
                @drop="handleDrop"
              ></textarea>
              
              <!-- Formatting Toolbar -->
              <div class="format-toolbar">
                <button
                  v-for="tool in formatTools"
                  :key="tool.label"
                  @click="applyFormat(tool.format)"
                  :title="tool.label"
                >
                  <i :class="tool.icon"></i>
                </button>
              </div>
            </div>

            <!-- Attachments -->
            <div 
              v-if="feedback.attachments.length"
              class="attachments"
            >
              <div
                v-for="(file, index) in feedback.attachments"
                :key="index"
                class="attachment-item"
              >
                <div class="attachment-preview">
                  <img
                    v-if="file.type.startsWith('image/')"
                    :src="file.preview"
                    :alt="file.name"
                  >
                  <i 
                    v-else
                    class="i-carbon-document"
                  ></i>
                </div>
                <div class="attachment-info">
                  <span class="attachment-name">{{ file.name }}</span>
                  <span class="attachment-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <button 
                  @click="removeAttachment(index)"
                  class="remove-attachment"
                >
                  <i class="i-carbon-close"></i>
                </button>
              </div>
            </div>

            <!-- File Upload -->
            <div class="file-upload">
              <input
                type="file"
                ref="fileInput"
                multiple
                @change="handleFileUpload"
                accept="image/*,.pdf,.txt"
                class="file-input"
              >
              <button 
                class="upload-button"
                @click="$refs.fileInput.click()"
              >
                <i class="i-carbon-upload"></i>
                Add Screenshots or Files
              </button>
              <span class="file-hint">
                Drag & drop files here or click to upload
              </span>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="contact-section">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="feedback.followup"
              >
              I'd like to be contacted about this feedback
            </label>
            
            <div 
              v-if="feedback.followup"
              class="contact-fields"
            >
              <div class="input-group">
                <label>Email</label>
                <input
                  type="email"
                  v-model="feedback.email"
                  placeholder="your@email.com"
                >
              </div>
              <div class="input-group">
                <label>Name (optional)</label>
                <input
                  type="text"
                  v-model="feedback.name"
                  placeholder="Your name"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div 
          v-else-if="step === 'success'"
          class="success-message"
        >
          <div class="success-icon">
            <i class="i-carbon-checkmark-filled"></i>
          </div>
          <h3>Thank You for Your Feedback!</h3>
          <p>{{ getSuccessMessage() }}</p>
          <button 
            class="primary-button"
            @click="resetAndClose"
          >
            Close
          </button>
        </div>

        <!-- Error State -->
        <div 
          v-else-if="step === 'error'"
          class="error-message"
        >
          <div class="error-icon">
            <i class="i-carbon-error-filled"></i>
          </div>
          <h3>Something Went Wrong</h3>
          <p>We couldn't submit your feedback. Please try again.</p>
          <div class="error-actions">
            <button 
              class="secondary-button"
              @click="step = 'form'"
            >
              Back
            </button>
            <button 
              class="primary-button"
              @click="submitFeedback"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Modal Footer -->
        <template 
          v-if="['type', 'form'].includes(step)"
          #footer
        >
          <div class="modal-footer">
            <button
              v-if="step === 'form'"
              class="secondary-button"
              @click="step = 'type'"
            >
              Back
            </button>
            <button
              class="primary-button"
              :disabled="!canProceed"
              @click="handleProceed"
            >
              {{ step === 'type' ? 'Continue' : 'Submit Feedback' }}
            </button>
          </div>
        </template>
      </modal-dialog>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useData } from 'vitepress'
import ModalDialog from './ModalDialog.vue'

const { theme } = useData()

// State
const showFeedback = ref(false)
const step = ref('type')
const selectedType = ref(null)
const isSubmitting = ref(false)

// Form Data
const feedback = ref({
  type: '',
  rating: null,
  category: '',
  description: '',
  attachments: [],
  followup: false,
  email: '',
  name: ''
})

// Configuration
const feedbackTypes = [
  {
    id: 'general',
    label: 'General Feedback',
    description: 'Share your thoughts about the documentation',
    icon: 'i-carbon-chat',
    requiresRating: true,
    requiresCategory: true
  },
  {
    id: 'bug',
    label: 'Report a Bug',
    description: 'Report technical issues or errors',
    icon: 'i-carbon-bug',
    requiresRating: false,
    requiresCategory: false
  },
  {
    id: 'suggestion',
    label: 'Suggestion',
    description: 'Suggest new features or improvements',
    icon: 'i-carbon-light-filled',
    requiresRating: false,
    requiresCategory: true
  },
  {
    id: 'correction',
    label: 'Content Correction',
    description: 'Report inaccurate or outdated content',
    icon: 'i-carbon-edit',
    requiresRating: false,
    requiresCategory: false
  }
]

const ratings = [
  { value: 1, label: 'Very Dissatisfied', icon: 'i-carbon-face-dissatisfied-filled' },
  { value: 2, label: 'Dissatisfied', icon: 'i-carbon-face-dissatisfied' },
  { value: 3, label: 'Neutral', icon: 'i-carbon-face-neutral' },
  { value: 4, label: 'Satisfied', icon: 'i-carbon-face-satisfied' },
  { value: 5, label: 'Very Satisfied', icon: 'i-carbon-face-satisfied-filled' }
]

const categories = [
  { id: 'usability', label: 'Usability' },
  { id: 'content', label: 'Content Quality' },
  { id: 'examples', label: 'Code Examples' },
  { id: 'api', label: 'API Documentation' },
  { id: 'search', label: 'Search Functionality' },
  { id: 'other', label: 'Other' }
]

const formatTools = [
  { label: 'Bold', icon: 'i-carbon-text-bold', format: '**' },
  { label: 'Italic', icon: 'i-carbon-text-italic', format: '*' },
  { label: 'Code', icon: 'i-carbon-code', format: '`' },
  { label: 'Link', icon: 'i-carbon-link', format: '[](url)' },
  { label: 'List', icon: 'i-carbon-list', format: '- ' }
]

// Computed Properties
const currentStep = computed(() => {
  switch (step.value) {
    case 'type':
      return {
        title: 'Send Feedback',
        descriptionLabel: ''
      }
    case 'form':
      return {
        title: getFormTitle(),
        descriptionLabel: getDescriptionLabel(),
        placeholder: getPlaceholder()
      }
    case 'success':
      return {
        title: 'Thank You'
      }
    case 'error':
      return {
        title: 'Error'
      }
    default:
      return { title: '' }
  }
})

const showRating = computed(() => {
  const type = feedbackTypes.find(t => t.id === selectedType.value)
  return type?.requiresRating
})

const showCategories = computed(() => {
  const type = feedbackTypes.find(t => t.id === selectedType.value)
  return type?.requiresCategory
})

const canProceed = computed(() => {
  if (step.value === 'type') {
    return !!selectedType.value
  }

  if (step.value === 'form') {
    const hasRequired = !!feedback.value.description.trim()
    const hasRating = !showRating.value || feedback.value.rating !== null
    const hasCategory = !showCategories.value || !!feedback.value.category
    const hasValidEmail = !feedback.value.followup || isValidEmail(feedback.value.email)

    return hasRequired && hasRating && hasCategory && hasValidEmail
  }

  return true
})

// Methods
const selectFeedbackType = (type) => {
  selectedType.value = type
  feedback.value.type = type
}

const selectRating = (rating) => {
  feedback.value.rating = rating
}

const applyFormat = (format) => {
  const textarea = document.querySelector('.rich-input textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = feedback.value.description
  const selected = text.substring(start, end)

  let insertion
  switch (format) {
    case '**':
      insertion = `**${selected}**`
      break
    case '*':
      insertion = `*${selected}*`
      break
    case '`':
      insertion = `\`${selected}\``
      break
    case '[](url)':
      insertion = selected ? `[${selected}](url)` : '[](url)'
      break
    default:
      insertion = format + selected
  }

  feedback.value.description = 
    text.substring(0, start) +
    insertion +
    text.substring(end)

  // Reset cursor position
  setTimeout(() => {
    textarea.focus()
    if (selected) {
      textarea.selectionStart = start
      textarea.selectionEnd = start + insertion.length
    } else {
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length
    }
  })
}

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  addFiles(files)
}

const handleDrop = (event) => {
  event.preventDefault()
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

const addFiles = async (files) => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']

  for (const file of files) {
    if (file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is 5MB.`)
      continue
    }

    if (!validTypes.includes(file.type)) {
      alert(`File ${file.name} is not supported. Please upload images, PDFs, or text files.`)
      continue
    }

    const preview = file.type.startsWith('image/') 
      ? await createImagePreview(file)
      : null

    feedback.value.attachments.push({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview
    })
  }
}

const createImagePreview = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

const removeAttachment = (index) => {
  feedback.value.attachments.splice(index, 1)
}

const handleProceed = () => {
  if (step.value === 'type') {
    step.value = 'form'
  } else {
    submitFeedback()
  }
}

const submitFeedback = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    // Implement your submission logic here
    await mockSubmission()
    step.value = 'success'
  } catch (error) {
    console.error('Failed to submit feedback:', error)
    step.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

const resetAndClose = () => {
  step.value = 'type'
  selectedType.value = null
  feedback.value = {
    type: '',
    rating: null,
    category: '',
    description: '',
    attachments: [],
    followup: false,
    email: '',
    name: ''
  }
  showFeedback.value = false
}

// Utility Methods
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const getFormTitle = () => {
  const type = feedbackTypes.find(t => t.id === selectedType.value)
  return type ? type.label : 'Feedback'
}

const getDescriptionLabel = () => {
  switch (selectedType.value) {
    case 'bug':
      return 'What went wrong?'
    case 'suggestion':
      return 'What would you like to suggest?'
    case 'correction':
      return 'What needs to be corrected?'
    default:
      return 'Tell us more'
  }
}

const getPlaceholder = () => {
  switch (selectedType.value) {
    case 'bug':
      return 'Please describe the issue and steps to reproduce it...'
    case 'suggestion':
      return 'Describe your suggestion in detail...'
    case 'correction':
      return 'Point out the error and provide the correct information...'
    default:
      return 'Share your thoughts...'
  }
}

const getSuccessMessage = () => {
  switch (selectedType.value) {
    case 'bug':
      return 'We\'ll investigate the issue and work on fixing it.'
    case 'suggestion':
      return 'We appreciate your suggestion and will consider it for future updates.'
    case 'correction':
      return 'We\'ll review the content and make necessary corrections.'
    default:
      return 'We value your feedback and will use it to improve our documentation.'
  }
}

// Mock Methods
const mockSubmission = () => new Promise((resolve) => setTimeout(resolve, 1000))

// Watchers
watch(selectedType, () => {
  if (!selectedType.value) return
  
  // Reset form when type changes
  feedback.value = {
    ...feedback.value,
    type: selectedType.value,
    rating: null,
    category: '',
    description: ''
  }
})
</script>

<style scoped>
.feedback-widget {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
}

/* Trigger Button */
.feedback-trigger {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.feedback-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.feedback-trigger i {
  font-size: 1.5rem;
}

/* Feedback Types */
.feedback-types {
  display: grid;
  gap: 1rem;
  padding: 0.5rem;
}

.type-button {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.type-button:hover {
  background: var(--vp-c-bg-soft);
}

.type-button.selected {
  background: var(--vp-c-brand-dimm);
  border-color: var(--vp-c-brand);
}

.type-button i {
  font-size: 1.5rem;
  color: var(--vp-c-text-2);
  grid-row: span 2;
  margin-top: 0.25rem;
}

.type-button.selected i {
  color: var(--vp-c-brand);
}

.type-label {
  font-weight: 500;
  color: var(--vp-c-text);
}

.type-description {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

/* Feedback Form */
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem;
}

/* Rating Section */
.rating-section h4 {
  margin: 0 0 1rem 0;
}

.rating-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}

.rating-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rating-button:hover {
  background: var(--vp-c-bg-soft);
}

.rating-button.selected {
  background: var(--vp-c-brand-dimm);
  border-color: var(--vp-c-brand);
}

.rating-button i {
  font-size: 1.5rem;
  color: var(--vp-c-text-2);
}

.rating-button.selected i {
  color: var(--vp-c-brand);
}

.rating-button span {
  font-size: 0.75rem;
  text-align: center;
  color: var(--vp-c-text-2);
}

/* Category Section */
.category-section h4 {
  margin: 0 0 1rem 0;
}

.category-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

/* Description Section */
.description-section h4 {
  margin: 0 0 1rem 0;
}

.rich-input {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}

.rich-input textarea {
  width: 100%;
  padding: 1rem;
  border: none;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  resize: vertical;
  min-height: 120px;
}

.format-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
}

.format-toolbar button {
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 4px;
}

.format-toolbar button:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text);
}

/* Attachments */
.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}

.attachment-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vp-c-bg);
  border-radius: 4px;
  overflow: hidden;
}

.attachment-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attachment-preview i {
  font-size: 1.5rem;
  color: var(--vp-c-text-2);
}

.attachment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.attachment-name {
  font-size: 0.875rem;
  color: var(--vp-c-text);
}

.attachment-size {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.remove-attachment {
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

/* File Upload */
.file-upload {
  margin-top: 1rem;
  padding: 1.5rem;
  border: 2px dashed var(--vp-c-divider);
  border-radius: 6px;
  text-align: center;
}

.file-input {
  display: none;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-button:hover {
  background: var(--vp-c-bg-mute);
}

.file-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

/* Contact Section */
.contact-section {
  margin-top: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.contact-fields {
  margin-top: 1rem;
  display: grid;
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

.input-group input {
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
}

/* Success Message */
.success-message {
  text-align: center;
  padding: 2rem;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: var(--vp-c-green-dimm);
  color: var(--vp-c-green);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon i {
  font-size: 2rem;
}

.success-message h3 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-green);
}

.success-message p {
  color: var(--vp-c-text-2);
  margin: 0 0 1.5rem 0;
}

/* Error Message */
.error-message {
  text-align: center;
  padding: 2rem;
}

.error-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: var(--vp-c-red-dimm);
  color: var(--vp-c-red);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon i {
  font-size: 2rem;
}

.error-message h3 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-red);
}

.error-message p {
  color: var(--vp-c-text-2);
  margin: 0 0 1.5rem 0;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Buttons */
.primary-button {
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.primary-button:hover {
  background: var(--vp-c-brand-dark);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-button {
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.secondary-button:hover {
  background: var(--vp-c-bg-mute);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .feedback-widget {
    bottom: 1rem;
    right: 1rem;
  }

  .rating-buttons {
    flex-wrap: wrap;
  }

  .rating-button {
    flex: 1 0 calc(33.333% - 0.5rem);
  }

  .attachment-item {
    flex: 1 0 100%;
  }
}
</style>