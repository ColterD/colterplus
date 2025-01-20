<template>
  <div class="language-switch">
    <button 
      class="language-button"
      @click="toggleLanguageMenu"
      :aria-label="'Current language: ' + currentLanguage.name"
    >
      <span class="language-icon">{{ currentLanguage.icon }}</span>
      <span class="language-name">{{ currentLanguage.name }}</span>
      <span class="language-code">{{ currentLanguage.code }}</span>
      <span class="arrow" :class="{ open: isOpen }">▼</span>
    </button>

    <Transition name="fade">
      <div v-if="isOpen" class="language-menu">
        <div class="menu-header">
          <h3>{{ t('common.selectLanguage') }}</h3>
          <div class="search-box">
            <input 
              type="text"
              v-model="searchQuery"
              :placeholder="t('common.search')"
              @input="filterLanguages"
            >
          </div>
        </div>

        <div class="language-groups">
          <div 
            v-for="(group, region) in groupedLanguages"
            :key="region"
            class="language-group"
          >
            <div class="group-header">{{ region }}</div>
            <div class="group-languages">
              <button
                v-for="lang in group"
                :key="lang.code"
                class="language-option"
                :class="{ 
                  active: currentLocale === lang.code,
                  'auto-translated': lang.autoTranslated 
                }"
                @click="selectLanguage(lang.code)"
              >
                <span class="option-icon">{{ lang.icon }}</span>
                <div class="option-info">
                  <span class="option-name">{{ lang.name }}</span>
                  <span class="option-native">{{ lang.nativeName }}</span>
                </div>
                <div class="option-meta">
                  <span 
                    v-if="lang.autoTranslated"
                    class="auto-translate-badge"
                    :title="t('common.autoTranslated')"
                  >
                    🤖
                  </span>
                  <span 
                    v-if="lang.completeness < 100"
                    class="translation-status"
                  >
                    {{ lang.completeness }}%
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="menu-footer">
          <div class="translation-info">
            <span class="info-icon">ℹ️</span>
            <span class="info-text">{{ t('common.translationNote') }}</span>
          </div>
          <button 
            class="contribute-button"
            @click="openContributionGuide"
          >
            {{ t('common.contributeTranslations') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- RTL Warning -->
    <div 
      v-if="showRTLWarning"
      class="rtl-warning"
    >
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <p>{{ t('common.rtlWarning') }}</p>
        <div class="warning-actions">
          <button @click="applyRTL">{{ t('common.applyRTL') }}</button>
          <button @click="dismissRTLWarning">{{ t('common.dismiss') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vitepress'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

// State
const isOpen = ref(false)
const searchQuery = ref('')
const showRTLWarning = ref(false)

// Language data
const languages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    icon: '🇺🇸',
    region: 'Americas',
    completeness: 100,
    autoTranslated: false,
    rtl: false
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    icon: '🇪🇸',
    region: 'Europe',
    completeness: 95,
    autoTranslated: false,
    rtl: false
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    icon: '🇨🇳',
    region: 'Asia',
    completeness: 90,
    autoTranslated: false,
    rtl: false
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    icon: '🇸🇦',
    region: 'Middle East',
    completeness: 85,
    autoTranslated: true,
    rtl: true
  }
]

// Computed
const currentLocale = computed(() => locale.value)

const currentLanguage = computed(() => {
  return languages.find(lang => lang.code === currentLocale.value) || languages[0]
})

const filteredLanguages = computed(() => {
  if (!searchQuery.value) return languages
  
  const query = searchQuery.value.toLowerCase()
  return languages.filter(lang => 
    lang.name.toLowerCase().includes(query) ||
    lang.nativeName.toLowerCase().includes(query) ||
    lang.code.toLowerCase().includes(query)
  )
})

const groupedLanguages = computed(() => {
  return filteredLanguages.value.reduce((groups, lang) => {
    if (!groups[lang.region]) {
      groups[lang.region] = []
    }
    groups[lang.region].push(lang)
    return groups
  }, {})
})

// Methods
const toggleLanguageMenu = () => {
  isOpen.value = !isOpen.value
}

const selectLanguage = async (langCode) => {
  const selectedLang = languages.find(lang => lang.code === langCode)
  
  // Save preference
  localStorage.setItem('preferred-language', langCode)
  
  // Check for RTL
  if (selectedLang.rtl && !document.dir === 'rtl') {
    showRTLWarning.value = true
  }

  // Update locale
  locale.value = langCode
  
  // Update URL if it has a language prefix
  const currentPath = route.path
  const langPrefix = /^\/[a-z]{2}(-[a-z]{2})?/i
  const newPath = currentPath.replace(langPrefix, `/${langCode}`)
  
  if (currentPath !== newPath) {
    router.go(newPath)
  }

  isOpen.value = false
}

const applyRTL = () => {
  document.dir = 'rtl'
  document.documentElement.classList.add('rtl')
  showRTLWarning.value = false
  localStorage.setItem('rtl-enabled', 'true')
}

const dismissRTLWarning = () => {
  showRTLWarning.value = false
  localStorage.setItem('rtl-warning-dismissed', 'true')
}

const openContributionGuide = () => {
  window.open('https://github.com/yourusername/yourrepo/blob/main/CONTRIBUTING.md', '_blank')
}

// Click outside to close
const handleClickOutside = (event) => {
  const container = document.querySelector('.language-switch')
  if (container && !container.contains(event.target)) {
    isOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Load preferred language
  const savedLang = localStorage.getItem('preferred-language')
  if (savedLang && savedLang !== currentLocale.value) {
    selectLanguage(savedLang)
  }

  // Check for RTL support
  const rtlEnabled = localStorage.getItem('rtl-enabled')
  if (rtlEnabled === 'true') {
    document.dir = 'rtl'
    document.documentElement.classList.add('rtl')
  }

  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-switch {
  position: relative;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-button:hover {
  background: var(--vp-c-bg-mute);
}

.language-icon {
  font-size: 1.2em;
}

.language-code {
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

.arrow {
  font-size: 0.8em;
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

.language-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 320px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.menu-header {
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.menu-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1em;
}

.search-box input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text);
}

.language-groups {
  max-height: 400px;
  overflow-y: auto;
}

.language-group {
  padding: 0.5rem 0;
}

.group-header {
  padding: 0.5rem 1rem;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.language-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  color: var(--vp-c-text);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.language-option:hover {
  background: var(--vp-c-bg-soft);
}

.language-option.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
}

.option-info {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
}

.option-native {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.option-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auto-translate-badge {
  font-size: 1.2em;
  cursor: help;
}

.translation-status {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}

.menu-footer {
  padding: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.translation-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.contribute-button {
  width: 100%;
  padding: 0.5rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.contribute-button:hover {
  background: var(--vp-c-brand-dark);
}

.rtl-warning {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem;
  background: var(--vp-c-warning-soft);
  border: 1px solid var(--vp-c-warning);
  border-radius: 8px;
  z-index: 1000;
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.warning-actions {
  display: flex;
  gap: 0.5rem;
}

/* RTL styles */
:root[dir="rtl"] .language-menu {
  left: 0;
  right: auto;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile styles */
@media (max-width: 768px) {
  .language-menu {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    margin: 0;
    border-radius: 8px 8px 0 0;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .language-groups {
    flex: 1;
  }

  .language-name {
    display: none;
  }
}
</style>