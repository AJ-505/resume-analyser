import { config } from "dotenv";
import fetch from "node-fetch";

config();
// const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const REQUESTY_API_KEY = process.env.REQUESTY_API_KEY;
const REQUESTY_API_URL = "https://router.requesty.ai/v1/chat/completions";

async function generateResponse(prompt) {
  const response = await fetch(
    REQUESTY_API_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REQUESTY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-pro",
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
