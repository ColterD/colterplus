<template>
  <div class="theme-customizer">
    <button 
      class="theme-toggle"
      @click="toggleCustomizer"
      :aria-label="isOpen ? 'Close theme customizer' : 'Open theme customizer'"
    >
      <svg class="theme-icon" viewBox="0 0 24 24">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
    </button>

    <Transition name="slide">
      <div v-if="isOpen" class="customizer-panel">
        <div class="panel-header">
          <h3>Theme Customizer</h3>
          <button class="close-button" @click="toggleCustomizer">×</button>
        </div>

        <div class="panel-content">
          <section class="customizer-section">
            <h4>Color Scheme</h4>
            <div class="preset-themes">
              <button
                v-for="theme in presetThemes"
                :key="theme.name"
                class="theme-preset"
                :class="{ active: currentTheme === theme.name }"
                :style="{ '--theme-primary': theme.colors.primary }"
                @click="applyTheme(theme)"
              >
                <div class="theme-preview">
                  <div class="preview-color primary"></div>
                  <div class="preview-color secondary"></div>
                  <div class="preview-color accent"></div>
                </div>
                <span>{{ theme.name }}</span>
              </button>
            </div>
          </section>

          <section class="customizer-section">
            <h4>Custom Colors</h4>
            <div class="color-pickers">
              <div class="color-picker">
                <label>Primary Color</label>
                <input 
                  type="color" 
                  v-model="customColors.primary"
                  @change="applyCustomColors"
                >
              </div>
              <div class="color-picker">
                <label>Secondary Color</label>
                <input 
                  type="color" 
                  v-model="customColors.secondary"
                  @change="applyCustomColors"
                >
              </div>
              <div class="color-picker">
                <label>Accent Color</label>
                <input 
                  type="color" 
                  v-model="customColors.accent"
                  @change="applyCustomColors"
                >
              </div>
            </div>
          </section>

          <section class="customizer-section">
            <h4>Appearance</h4>
            <div class="appearance-options">
              <div class="option">
                <label>Font Size</label>
                <div class="range-slider">
                  <input 
                    type="range" 
                    v-model="fontSize" 
                    min="12" 
                    max="20" 
                    step="1"
                    @change="applyFontSize"
                  >
                  <span>{{ fontSize }}px</span>
                </div>
              </div>
              <div class="option">
                <label>Contrast</label>
                <div class="range-slider">
                  <input 
                    type="range" 
                    v-model="contrast" 
                    min="80" 
                    max="120" 
                    step="5"
                    @change="applyContrast"
                  >
                  <span>{{ contrast }}%</span>
                </div>
              </div>
              <div class="option">
                <label>Border Radius</label>
                <div class="range-slider">
                  <input 
                    type="range" 
                    v-model="borderRadius" 
                    min="0" 
                    max="16" 
                    step="2"
                    @change="applyBorderRadius"
                  >
                  <span>{{ borderRadius }}px</span>
                </div>
              </div>
            </div>
          </section>

          <section class="customizer-section">
            <h4>Effects</h4>
            <div class="toggle-options">
              <label class="toggle">
                <input 
                  type="checkbox" 
                  v-model="enableAnimations"
                  @change="toggleAnimations"
                >
                <span class="toggle-slider"></span>
                Enable Animations
              </label>
              <label class="toggle">
                <input 
                  type="checkbox" 
                  v-model="enableTransitions"
                  @change="toggleTransitions"
                >
                <span class="toggle-slider"></span>
                Enable Transitions
              </label>
            </div>
          </section>
        </div>

        <div class="panel-footer">
          <button class="reset-button" @click="resetCustomization">
            Reset to Defaults
          </button>
          <button class="apply-button" @click="saveCustomization">
            Save Changes
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isOpen = ref(false)
const currentTheme = ref('default')
const fontSize = ref(16)
const contrast = ref(100)
const borderRadius = ref(8)
const enableAnimations = ref(true)
const enableTransitions = ref(true)

const customColors = ref({
  primary: '#3eaf7c',
  secondary: '#2c3e50',
  accent: '#42b883'
})

const presetThemes = [
  {
    name: 'Default',
    colors: {
      primary: '#3eaf7c',
      secondary: '#2c3e50',
      accent: '#42b883'
    }
  },
  {
    name: 'Ocean',
    colors: {
      primary: '#0096c7',
      secondary: '#023e8a',
      accent: '#48cae4'
    }
  },
  {
    name: 'Sunset',
    colors: {
      primary: '#f72585',
      secondary: '#3a0ca3',
      accent: '#4cc9f0'
    }
  },
  {
    name: 'Forest',
    colors: {
      primary: '#40916c',
      secondary: '#1b4332',
      accent: '#95d5b2'
    }
  }
]

const toggleCustomizer = () => {
  isOpen.value = !isOpen.value
}

const applyTheme = (theme) => {
  currentTheme.value = theme.name
  customColors.value = { ...theme.colors }
  applyCustomColors()
}

const applyCustomColors = () => {
  document.documentElement.style.setProperty('--vp-c-brand', customColors.value.primary)
  document.documentElement.style.setProperty('--vp-c-brand-dark', adjustColor(customColors.value.primary, -20))
  document.documentElement.style.setProperty('--vp-c-brand-light', adjustColor(customColors.value.primary, 20))
}

const applyFontSize = () => {
  document.documentElement.style.setProperty('--vp-font-size-base', `${fontSize.value}px`)
}

const applyContrast = () => {
  document.documentElement.style.setProperty('--vp-c-contrast', `${contrast.value}%`)
}

const applyBorderRadius = () => {
  document.documentElement.style.setProperty('--vp-border-radius', `${borderRadius.value}px`)
}

const toggleAnimations = () => {
  document.documentElement.classList.toggle('disable-animations', !enableAnimations.value)
}

const toggleTransitions = () => {
  document.documentElement.classList.toggle('disable-transitions', !enableTransitions.value)
}

const adjustColor = (color, amount) => {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  let r = (num >> 16) + amount
  let g = ((num >> 8) & 0x00FF) + amount
  let b = (num & 0x0000FF) + amount
  
  r = Math.clamp(r, 0, 255)
  g = Math.clamp(g, 0, 255)
  b = Math.clamp(b, 0, 255)
  
  return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`
}

const saveCustomization = () => {
  const settings = {
    theme: currentTheme.value,
    customColors: customColors.value,
    fontSize: fontSize.value,
    contrast: contrast.value,
    borderRadius: borderRadius.value,
    enableAnimations: enableAnimations.value,
    enableTransitions: enableTransitions.value
  }
  
  localStorage.setItem('theme-settings', JSON.stringify(settings))
  window.$notify?.success('Settings Saved', 'Your theme preferences have been saved')
  toggleCustomizer()
}

const resetCustomization = () => {
  const defaultTheme = presetThemes[0]
  applyTheme(defaultTheme)
  fontSize.value = 16
  contrast.value = 100
  borderRadius.value = 8
  enableAnimations.value = true
  enableTransitions.value = true
  
  applyFontSize()
  applyContrast()
  applyBorderRadius()
  toggleAnimations()
  toggleTransitions()
  
  localStorage.removeItem('theme-settings')
  window.$notify?.info('Reset Complete', 'Theme settings have been reset to defaults')
}

onMounted(() => {
  // Load saved settings
  const savedSettings = localStorage.getItem('theme-settings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    currentTheme.value = settings.theme
    customColors.value = settings.customColors
    fontSize.value = settings.fontSize
    contrast.value = settings.contrast
    borderRadius.value = settings.borderRadius
    enableAnimations.value = settings.enableAnimations
    enableTransitions.value = settings.enableTransitions
    
    applyCustomColors()
    applyFontSize()
    applyContrast()
    applyBorderRadius()
    toggleAnimations()
    toggleTransitions()
  }
})
</script>

<style scoped>
.theme-customizer {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
}

.theme-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--vp-c-brand);
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  transform: scale(1.1);
}

.theme-icon {
  width: 24px;
  height: 24px;
  fill: white;
}

.customizer-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  background: var(--vp-c-bg);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2em;
  color: var(--vp-c-text-1);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.customizer-section {
  margin-bottom: 24px;
}

.customizer-section h4 {
  margin: 0 0 12px 0;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preset-themes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.theme-preset {
  padding: 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-preset:hover {
  background: var(--vp-c-bg-soft);
}

.theme-preset.active {
  border-color: var(--vp-c-brand);
}

.theme-preview {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.preview-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.preview-color.primary {
  background: var(--theme-primary);
}

.color-pickers {
  display: grid;
  gap: 12px;
}

.color-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.color-picker label {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.color-picker input[type="color"] {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.appearance-options {
  display: grid;
  gap: 16px;
}

.range-slider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-slider input {
  flex: 1;
}

.range-slider span {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  min-width: 48px;
}

.toggle-options {
  display: grid;
  gap: 12px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-slider {
  position: relative;
  width: 40px;
  height: 20px;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle input:checked + .toggle-slider {
  background: var(--vp-c-brand);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle input {
  display: none;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  gap: 8px;
}

.panel-footer button {
  flex: 1;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.apply-button {
  background: var(--vp-c-brand);
  border: none;
  color: white;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Scrollbar */
.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: var(--vp-c-bg-soft);
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 2px;
}

/* Mobile styles */
@media (max-width: 768px) {
  .customizer-panel {
    width: 100%;
  }
  
  .theme-toggle {
    width: 40px;
    height: 40px;
  }
  
  .theme-icon {
    width: 20px;
    height: 20px;
  }
}
</style>