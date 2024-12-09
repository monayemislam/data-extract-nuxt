import OpenAI from 'openai'

let openaiInstance = null

function getOpenAIInstance(config) {
  if (!openaiInstance) {
    if (!config?.public?.openaiApiKey) {
      console.error('OpenAI API key is missing from config:', config)
      throw new Error('OpenAI API key is not configured')
    }
    
    openaiInstance = new OpenAI({
      apiKey: config.public.openaiApiKey,
      dangerouslyAllowBrowser: true
    })
  }
  return openaiInstance
}

export async function analyzeWithOpenAI(question, documentText, config) {
  try {
    console.log('Initializing OpenAI with config:', {
      hasApiKey: !!config?.public?.openaiApiKey,
      question: question,
      documentLength: documentText?.length
    })

    const openai = getOpenAIInstance(config)
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions about documents. Use the provided document text to answer questions accurately. If the information isn't in the document, say so."
        },
        {
          role: "user",
          content: `Document text: ${documentText}\n\nQuestion: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    console.log('OpenAI Response:', response)

    return {
      answer: response.choices[0].message.content,
      confidence: 0.95
    }
  } catch (error) {
    console.error('OpenAI Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      config: {
        hasApiKey: !!config?.public?.openaiApiKey
      }
    })
    throw error
  }
} 