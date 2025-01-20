<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps({
  modelValue: String,
  language: String,
  options: Object
})

const emit = defineEmits(['update:modelValue', 'change'])

const editorContainer = ref(null)
let editor = null

onMounted(() => {
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    ...props.options
  })

  editor.onDidChangeModelContent(() => {
    const value = editor.getValue()
    emit('update:modelValue', value)
    emit('change', value)
  })
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})

watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
  }
})

watch(() => props.language, (newValue) => {
  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel(), newValue)
  }
})

watch(() => props.options, (newValue) => {
  if (editor) {
    editor.updateOptions(newValue)
  }
}, { deep: true })
</script>

<style>
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
</style>