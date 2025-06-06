import { toast } from "sonner";

// Define types for our API responses
type OpenAIResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};

// Retrieve API key from localStorage (set via AIApiKeySetup) or fallback to env
const getApiKey = () => {
  const localStorageKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : null;
  const apiKey = localStorageKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OpenAI API key is missing. Provide it in localStorage or set VITE_OPENAI_API_KEY in your environment.");
    return null;
  }

  return apiKey;
};

// Generate a response from OpenAI based on the prompt
export const generateAIResponse = async (
  prompt: string,
  model: "gpt-4" | "claude" | "llama" = "gpt-4"
): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    toast.error("OpenAI API key is not configured");
    return null;
  }

  // Map our UI model names to actual API model names
  const modelMap = {
    "gpt-4": "gpt-4o",
    "claude": "gpt-4o", // We'll simulate Claude with GPT-4o
    "llama": "gpt-3.5-turbo" // We'll simulate Llama with GPT-3.5-turbo
  };

  const actualModel = modelMap[model];
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: actualModel,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that generates responses based on user prompts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Unknown error occurred");
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices?.[0]?.message?.content || null;
  } catch (error: any) {
    const message =
      error.name === "TypeError"
        ? "Network request failed. Check your connection."
        : error.message || "Failed to generate response";
    console.error("Error generating AI response:", error);
    toast.error(`Error: ${message}`);
    return null;
  }
};