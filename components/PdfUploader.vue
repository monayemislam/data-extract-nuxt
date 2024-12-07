<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Header with Logo -->
    <div class="mb-8 text-center">
        <div class="flex items-center justify-center mb-4">
       
       <img src="https://img1.wsimg.com/isteam/ip/ec854d99-43e6-4b7e-8e0a-4292c07646cb/Best%20Logo.jpg" alt="Troy and Banks" class="h-16">
     </div>
      <div class="flex items-center justify-center mb-4">
       
        <h2 class="text-3xl font-bold text-gray-800">Document Scanning App</h2>
      </div>

      <p class="text-gray-600">Upload your PDF document for text extraction</p>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div class="space-y-4">
        <!-- File Upload Area -->
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
             :class="{ 'border-blue-500 bg-blue-50': isDragging }"
             @dragover.prevent="isDragging = true"
             @dragleave.prevent="isDragging = false"
             @drop.prevent="handleDrop">
          <div class="space-y-2">
            <div class="flex items-center justify-center">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div class="text-gray-600">
              <label class="cursor-pointer hover:text-blue-600">
                <span class="text-blue-500 hover:text-blue-700">Choose a file</span>
                <span class="mx-2">or drag it here</span>
                <input type="file" 
                       accept="application/pdf" 
                       @change="handleFileUpload" 
                       class="hidden">
              </label>
            </div>
            <p class="text-sm text-gray-500">PDF files only</p>
          </div>
        </div>

        <!-- Selected File Info -->
        <div v-if="selectedFile" class="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
              <path d="M3 8a2 2 0 012-2v10h2a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <span class="text-sm text-gray-700">{{ selectedFile.name }}</span>
          </div>
          <button @click="clearFile" 
                  class="text-red-500 hover:text-red-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Process Button -->
        <div class="flex justify-center">
          <button @click="processFile"
                  :disabled="!selectedFile || isProcessing"
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition duration-150 ease-in-out">
            <div class="flex items-center space-x-2">
              <svg v-if="isProcessing" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isProcessing ? 'Processing...' : 'Process PDF' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <TextractResult v-if="result" :result="result" />

    <!-- Footer -->
    <footer class="mt-12 pt-8 border-t border-gray-200">
      <div class="text-center">
        <div class="flex items-center justify-center mb-4">
          <a href="https://obitodigital.com" 
             target="_blank" 
             rel="noopener noreferrer"
             class="text-gray-600 hover:text-blue-600 transition-colors">
            <img src="https://obitodigital.com/wp-content/uploads/2024/02/Obito-Digital.png" alt="Obito Digital" class="h-8">
          </a>
        </div>
        <div class="text-sm text-gray-500">
        
          <p class="mt-1">&copy; {{ new Date().getFullYear() }} Obito Digital. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract'


const config = useRuntimeConfig()
const selectedFile = ref(null)
const isProcessing = ref(false)
const result = ref(null)
const isDragging = ref(false)

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    selectedFile.value = file
    result.value = null
  } else {
    alert('Please select a PDF file')
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file && file.type === 'application/pdf') {
    selectedFile.value = file
    result.value = null
  } else {
    alert('Please drop a PDF file')
  }
}

const clearFile = () => {
  selectedFile.value = null
  result.value = null
}

const processFile = async () => {
  if (!selectedFile.value) return

  isProcessing.value = true
  try {
    const fileReader = new FileReader()
    fileReader.onload = async () => {
      const arrayBuffer = fileReader.result
      const bytes = new Uint8Array(arrayBuffer)

      const client = new TextractClient({
        region: config.public.awsRegion,
        credentials: {
          accessKeyId: config.public.awsAccessKeyId,
          secretAccessKey: config.public.awsSecretAccessKey
        }
      })

      const command = new AnalyzeDocumentCommand({
        Document: {
          Bytes: bytes
        },
        FeatureTypes: ['TABLES', 'FORMS']
      })

      try {
        const response = await client.send(command)
        result.value = response
      } catch (awsError) {
        console.error('AWS Textract Error:', awsError)
        alert('Error processing PDF with AWS Textract. Please check your AWS credentials and region.')
      }
    }

    fileReader.readAsArrayBuffer(selectedFile.value)
  } catch (error) {
    console.error('Error processing PDF:', error)
    alert('Error processing PDF. Please try again.')
  } finally {
    isProcessing.value = false
  }
}
</script>
