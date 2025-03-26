import { InferenceClient } from "@huggingface/inference";
import { config } from "dotenv";

config();
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!HF_API_KEY) {
  console.error("Error: HUGGINGFACE_API_KEY is not set!");
  process.exit(1);
}

async function generateResponse(prompt) {
  const client = new InferenceClient(HF_API_KEY);

  try {
    const chatCompletion = await client.chatCompletion({
      provider: "hyperbolic",
      model: "deepseek-ai/DeepSeek-R1",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("API request failed:", error.message);
  }
}

export default generateResponse;
