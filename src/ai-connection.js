import { config } from "dotenv";
import fetch from "node-fetch";

config();
// const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// const REQUESTY_API_KEY = process.env.REQUESTY_API_KEY;
// const REQUESTY_API_URL = "https://router.requesty.ai/v1";

async function generateResponse(prompt) {
  let response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-zero:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });
  } catch (error) {
    console.error("Error during resume analysis:", error);
  }
  const responseText = await response.text();
  return responseText;
}

export default generateResponse;
