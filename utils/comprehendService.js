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