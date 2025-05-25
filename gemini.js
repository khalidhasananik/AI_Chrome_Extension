// require('dotenv').config();

// import { config } from "dotenv";

// import { CONFIG } from "./config.js";

const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY

export async function callGeminiAPI(promptText, model = "gemini-2.0-flash") {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: promptText }]
                    }
                ]
            })
        });

        const data = await response.json();

        const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
        return aiReply;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error calling Gemini API.";
    }
}
