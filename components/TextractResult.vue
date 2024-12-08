<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h3 class="text-xl font-semibold text-gray-800 mb-4">Extracted Content</h3>
    
    <!-- Tabs -->
    <div class="mb-4 border-b border-gray-200">
      <nav class="flex space-x-4" aria-label="Tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            activeTab === tab.id 
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Sentiment Analysis Tab -->
    <div v-if="activeTab === 'sentiment'" class="space-y-6">
      <div v-if="sentimentResult" class="bg-white p-6 rounded-lg border">
        <div class="mb-4">
          <h4 class="text-lg font-semibold mb-2">Overall Sentiment</h4>
          <div class="flex items-center space-x-4">
            <span 
              class="px-3 py-1 rounded-full text-sm font-medium"
              :class="getSentimentColor(sentimentResult.Sentiment)"
            >
              {{ sentimentResult.Sentiment }}
            </span>
            <span class="text-gray-600">
              Confidence: {{ Math.round(getSentimentScore(sentimentResult) * 100) }}%
            </span>
          </div>
        </div>
        
        <div class="space-y-3">
          <h4 class="text-lg font-semibold">Sentiment Scores</h4>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="(score, type) in sentimentResult.SentimentScore" 
                 :key="type" 
                 class="bg-gray-50 p-4 rounded-lg">
              <div class="text-sm font-medium text-gray-600">{{ type }}</div>
              <div class="text-lg font-semibold">
                {{ Math.round(score * 100) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-8">
        Analyzing sentiment...
      </div>
    </div>

    <!-- Raw JSON Tab -->
    <div v-if="activeTab === 'raw'" class="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[500px]">
      <pre class="text-sm text-gray-700">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>

    <!-- Formatted Text Tab -->
    <div v-if="activeTab === 'text'" class="space-y-4">
      <div v-for="(block, index) in extractedText" :key="index" class="p-3 bg-gray-50 rounded-lg">
        <p class="text-gray-700">{{ block }}</p>
      </div>
    </div>

    <!-- Tables Tab -->
    <div v-if="activeTab === 'tables'" class="space-y-6">
      <div v-for="(table, tableIndex) in extractedTables" :key="tableIndex" class="overflow-x-auto">
        <div class="text-sm font-medium text-gray-600 mb-2">Table {{ tableIndex + 1 }}</div>
        <table class="min-w-full divide-y divide-gray-200">
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(row, rowIndex) in table" :key="rowIndex">
              <td 
                v-for="(cell, cellIndex) in row" 
                :key="cellIndex"
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="extractedTables.length === 0" class="text-gray-500 text-center py-4">
        No tables found in the document
      </div>
    </div>

    <!-- Forms Tab -->
    <div v-if="activeTab === 'forms'" class="space-y-4">
      <div v-for="(field, index) in extractedForms" :key="index" 
           class="flex items-start p-3 bg-gray-50 rounded-lg">
        <div class="flex-1">
          <span class="text-sm font-medium text-gray-600">{{ field.key }}:</span>
          <span class="ml-2 text-sm text-gray-700">{{ field.value }}</span>
        </div>
      </div>
      <div v-if="extractedForms.length === 0" class="text-gray-500 text-center py-4">
        No form fields found in the document
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { analyzeSentiment } from '../utils/comprehendService'

const config = useRuntimeConfig()
const props = defineProps({
  result: {
    type: Object,
    required: true
  }
})

const activeTab = ref('text')
const sentimentResult = ref(null)
const tabs = [
  { id: 'text', name: 'Extracted Text' },
  { id: 'tables', name: 'Tables' },
  { id: 'forms', name: 'Form Fields' },
  { id: 'sentiment', name: 'Sentiment Analysis' },
  { id: 'raw', name: 'Raw JSON' }
]

// Extract plain text
const extractedText = computed(() => {
  if (!props.result?.Blocks) return []
  return props.result.Blocks
    .filter(block => block.BlockType === 'LINE')
    .map(block => block.Text)
})

// Extract tables
const extractedTables = computed(() => {
  if (!props.result?.Blocks) return []
  
  const tables = []
  let currentTable = []
  let currentRow = []
  
  props.result.Blocks.forEach(block => {
    if (block.BlockType === 'TABLE') {
      currentTable = []
    } else if (block.BlockType === 'CELL') {
      if (block.RowIndex === 1 && block.ColumnIndex === 1) {
        if (currentTable.length > 0) {
          tables.push(currentTable)
        }
        currentTable = []
      }
      
      if (block.ColumnIndex === 1) {
        currentRow = []
      }
      
      currentRow.push(block.Text || '')
      
      if (block.ColumnIndex === block.ColumnSpan) {
        currentTable.push(currentRow)
      }
    }
  })
  
  if (currentTable.length > 0) {
    tables.push(currentTable)
  }
  
  return tables
})

// Extract form fields
const extractedForms = computed(() => {
  if (!props.result?.Blocks) return []
  
  const forms = []
  const keyMap = new Map()
  
  props.result.Blocks.forEach(block => {
    if (block.BlockType === 'KEY_VALUE_SET') {
      if (block.EntityTypes?.includes('KEY')) {
        const key = block.Relationships?.find(rel => rel.Type === 'CHILD')
          ?.Ids?.map(id => props.result.Blocks.find(b => b.Id === id)?.Text)
          .join(' ') || ''
        keyMap.set(block.Id, key)
      } else if (block.EntityTypes?.includes('VALUE')) {
        const keyId = block.Relationships?.find(rel => rel.Type === 'KEY')?.Ids?.[0]
        const value = block.Relationships?.find(rel => rel.Type === 'CHILD')
          ?.Ids?.map(id => props.result.Blocks.find(b => b.Id === id)?.Text)
          .join(' ') || ''
        
        if (keyId && keyMap.has(keyId)) {
          forms.push({
            key: keyMap.get(keyId),
            value: value
          })
        }
      }
    }
  })
  
  return forms
})

// Get the combined text for sentiment analysis
const combinedText = computed(() => {
  return extractedText.value.join(' ')
})

// Watch for changes in the extracted text and analyze sentiment
watch(combinedText, async (newText) => {
  if (newText) {
    try {
      sentimentResult.value = await analyzeSentiment(newText, config)
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
    }
  }
}, { immediate: true })

// Helper functions for sentiment display
const getSentimentColor = (sentiment) => {
  const colors = {
    POSITIVE: 'bg-green-100 text-green-800',
    NEGATIVE: 'bg-red-100 text-red-800',
    NEUTRAL: 'bg-gray-100 text-gray-800',
    MIXED: 'bg-yellow-100 text-yellow-800'
  }
  return colors[sentiment] || colors.NEUTRAL
}

const getSentimentScore = (result) => {
  if (!result?.SentimentScore) return 0
  const scores = {
    POSITIVE: result.SentimentScore.Positive,
    NEGATIVE: result.SentimentScore.Negative,
    NEUTRAL: result.SentimentScore.Neutral,
    MIXED: result.SentimentScore.Mixed
  }
  return scores[result.Sentiment] || 0
}
</script> 