<template>
  <div class="pdf-uploader">
    <div class="upload-container">
      <input 
        type="file" 
        accept="application/pdf" 
        @change="handleFileUpload"
        class="file-input"
      >
      <button 
        @click="processFile" 
        :disabled="!selectedFile || isProcessing"
        class="process-btn"
      >
        {{ isProcessing ? 'Processing...' : 'Process PDF' }}
      </button>
    </div>

    <div v-if="result" class="result-container">
      <h3>Results:</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract'

const config = useRuntimeConfig()
const selectedFile = ref(null)
const isProcessing = ref(false)
const result = ref(null)

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0]
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

<style scoped>
.pdf-uploader {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}

.upload-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.file-input {
  flex: 1;
}

.process-btn {
  padding: 0.5rem 1rem;
  background-color: #00dc82;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.process-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.result-container {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
