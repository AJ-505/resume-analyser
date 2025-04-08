import { config } from "dotenv";
import fetch from "node-fetch";

config();
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!HF_API_KEY) {
  console.error("Error: HUGGINGFACE_API_KEY is not set!");
  process.exit(1);
}

async function generateResponse(prompt) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  );
  const responseText = await response.text();
  return responseText;
}

export default generateResponse;
