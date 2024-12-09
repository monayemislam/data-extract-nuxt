<template>
  <div class="bg-white rounded-lg shadow-lg p-6 mt-8">
    <h3 class="text-xl font-semibold text-gray-800 mb-4">Ask Questions About Your Document</h3>
    
    <!-- Chat/QA Area -->
    <div class="space-y-4">
      <!-- Messages Display -->
      <div class="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto space-y-4">
        <div v-for="(message, index) in messages" :key="index"
             :class="[
               'p-4 rounded-lg max-w-[80%]',
               message.type === 'user' 
                 ? 'bg-blue-100 ml-auto' 
                 : 'bg-white border'
             ]"
        >
          <p class="text-sm" :class="message.type === 'user' ? 'text-blue-800' : 'text-gray-800'">
            {{ message.text }}
          </p>
          <p v-if="message.confidence" class="text-xs text-gray-500 mt-1">
            Confidence: {{ Math.round(message.confidence * 100) }}%
          </p>
        </div>
      </div>

      <!-- Input Area -->
      <div class="flex space-x-3">
        <textarea
          v-model="userQuestion"
          @keyup.enter.exact="handleQuestion"
          placeholder="Ask a question about your document..."
          class="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="2"
        ></textarea>
        <button
          @click="handleQuestion"
          :disabled="!userQuestion.trim() || isProcessing"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
                 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition duration-150 ease-in-out"
        >
          <span v-if="!isProcessing">Ask</span>
          <svg v-else class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { analyzeWithOpenAI } from '../utils/openaiService'

const props = defineProps({
  extractedText: {
    type: Array,
    required: true
  }
})

const userQuestion = ref('')
const isProcessing = ref(false)
const messages = ref([
  {
    type: 'system',
    text: 'Hello! I can help you understand your document. What would you like to know?'
  }
])

const config = useRuntimeConfig()

const handleQuestion = async () => {
  if (!userQuestion.value.trim() || isProcessing.value) return

  const question = userQuestion.value.trim()
  messages.value.push({ type: 'user', text: question })
  userQuestion.value = ''
  isProcessing.value = true

  try {
    const response = await analyzeWithOpenAI(question, props.extractedText.join(' '), config)
    messages.value.push({
      type: 'system',
      text: response.answer,
      confidence: response.confidence
    })
  } catch (error) {
    messages.value.push({
      type: 'system',
      text: 'I apologize, but I encountered an error analyzing your question. Please try again.',
      error: true
    })
  } finally {
    isProcessing.value = false
  }
}
</script> 