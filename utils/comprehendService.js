import { ComprehendClient, DetectSentimentCommand } from "@aws-sdk/client-comprehend";

export async function analyzeSentiment(text, config) {
  const client = new ComprehendClient({
    region: config.public.awsRegion,
    credentials: {
      accessKeyId: config.public.awsAccessKeyId,
      secretAccessKey: config.public.awsSecretAccessKey
    }
  });

  const command = new DetectSentimentCommand({
    Text: text,
    LanguageCode: "en"
  });

  try {
    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    throw error;
  }
}

export async function analyzeText(question, documentText) {
  // Common bill-related keywords
  const keywords = {
    amount: ['amount', 'bill', 'charge', 'payment', 'cost', 'price', 'fee'],
    date: ['due date', 'deadline', 'payment date', 'due by'],
    usage: ['usage', 'consumption', 'used', 'kwh', 'units'],
    overcharge: ['overcharge', 'excessive', 'high', 'expensive', 'wrong']
  }

  // Simple response generation based on question type
  const questionLower = question.toLowerCase()
  let response = {
    answer: '',
    confidence: 0.7
  }

  // Extract numbers and dates from the document text
  const numbers = documentText.match(/\$?\d+(?:,\d{3})*(?:\.\d{2})?/g) || []
  const dates = documentText.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}/g) || []

  // Check for amount-related questions
  if (keywords.amount.some(word => questionLower.includes(word))) {
    const amount = numbers.find(num => num.includes('$')) || numbers[0]
    if (amount) {
      response.answer = `The bill amount is ${amount}. `
      if (questionLower.includes('overcharge') || questionLower.includes('high')) {
        response.answer += 'Based on the available information, I cannot definitively determine if this is an overcharge. Please compare with your previous bills or contact your utility provider for clarification.'
      }
    }
  }

  // Check for date-related questions
  else if (keywords.date.some(word => questionLower.includes(word))) {
    if (dates.length > 0) {
      response.answer = `The due date is ${dates[0]}.`
    }
  }

  // Check for usage-related questions
  else if (keywords.usage.some(word => questionLower.includes(word))) {
    const usage = numbers.find(num => documentText.toLowerCase().includes('kwh')) || numbers[1]
    if (usage) {
      response.answer = `The usage amount is ${usage} units.`
    }
  }

  // Default response if no specific pattern is matched
  if (!response.answer) {
    response.answer = "I apologize, but I couldn't find specific information to answer your question. Please try rephrasing or ask something else about the document."
    response.confidence = 0.3
  }

  return response
} 