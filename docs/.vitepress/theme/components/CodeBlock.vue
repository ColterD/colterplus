<template>
  <div class="code-block-wrapper" :class="{ 'has-filename': filename }">
    <div v-if="filename" class="code-filename">
      {{ filename }}
    </div>
    <div class="code-block">
      <div class="code-header">
        <div class="language-tag">{{ language }}</div>
        <button 
          class="copy-button" 
          @click="copyCode"
          :class="{ copied }"
        >
          <svg v-if="!copied" class="copy-icon" viewBox="0 0 24 24">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          <svg v-else class="check-icon" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
        </button>
      </div>
      <div 
        class="code-content"
        ref="codeContainer"
        @scroll="handleScroll"
      >
        <div class="line-numbers" v-if="showLineNumbers">
          <span 
            v-for="n in lineCount" 
            :key="n"
            :class="{ 'highlighted': highlightedLines.includes(n) }"
          >
            {{ n }}
          </span>
        </div>
        <pre><code 
          :class="languageClass"
          ref="codeBlock"
        ><slot /></code></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/plugins/line-highlight/prism-line-highlight'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-yaml'

const props = defineProps({
  language: {
    type: String,
    default: 'javascript'
  },
  filename: {
    type: String,
    default: ''
  },
  highlight: {
    type: String,
    default: ''
  },
  showLineNumbers: {
    type: Boolean,
    default: true
  }
})

const copied = ref(false)
const codeBlock = ref(null)
const codeContainer = ref(null)
const lineCount = ref(0)

const languageClass = computed(() => `language-${props.language}`)

const highlightedLines = computed(() => {
  if (!props.highlight) return []
  return props.highlight.split(',').flatMap(range => {
    const [start, end] = range.split('-').map(Number)
    return end 
      ? Array.from({ length: end - start + 1 }, (_, i) => start + i)
      : [start]
  })
})

const copyCode = async () => {
  const code = codeBlock.value.textContent
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
    
    // Show notification
    window.$notify?.success('Copied!', 'Code copied to clipboard', 2000)
  } catch (err) {
    window.$notify?.error('Error', 'Failed to copy code', 2000)
  }
}

const handleScroll = () => {
  if (!codeContainer.value) return
  const { scrollLeft } = codeContainer.value
  codeContainer.value.style.setProperty('--scroll-offset', `${scrollLeft}px`)
}

onMounted(() => {
  if (codeBlock.value) {
    Prism.highlightElement(codeBlock.value)
    lineCount.value = codeBlock.value.textContent.split('\n').length
  }
})
</script>

<style scoped>
.code-block-wrapper {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-code-block-bg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.code-filename {
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.code-block {
  position: relative;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--vp-code-block-bg);
  border-bottom: 1px solid var(--vp-c-divider);
}

.language-tag {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.copy-button.copied {
  background: var(--vp-c-green);
  color: white;
  border-color: var(--vp-c-green);
}

.copy-icon, .check-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.code-content {
  display: flex;
  overflow-x: auto;
  position: relative;
}

.line-numbers {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  background: var(--vp-code-block-bg);
  border-right: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 0.85em;
  line-height: 1.5;
  user-select: none;
}

.line-numbers span {
  padding: 0 1rem;
  min-width: 3rem;
  text-align: right;
}

.line-numbers span.highlighted {
  background: rgba(var(--vp-c-brand-rgb), 0.1);
  color: var(--vp-c-brand);
}

pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.85em;
  line-height: 1.5;
  background: transparent;
}

code {
  font-family: var(--vp-font-family-mono);
}

/* Scrollbar styles */
.code-content::-webkit-scrollbar {
  height: 8px;
}

.code-content::-webkit-scrollbar-track {
  background: var(--vp-code-block-bg);
}

.code-content::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 4px;
}

.code-content::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}
</style>