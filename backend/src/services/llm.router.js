import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const callGroq = async (prompt, context) => {
  const res = await groq.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [{ role: "user", content: `${context}\n\nQ: ${prompt}` }],
    max_tokens: 300,
  });
  return res.choices[0].message.content;
}

const callGemini = async (prompt, context) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const res = await model.generateContent(`${context}\n\nQ: ${prompt}`);
  return res.response.text();
}

const callGPT = async (prompt, context) => {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: `${context}\n\nQ: ${prompt}` }],
    max_tokens: 300,
  });
  return res.choices[0].message.content;
}

export const askAI = async (prompt, context) => {
  const providers = [
    { name: "Groq", fn: callGroq },
    { name: "Gemini", fn: callGemini },
    { name: "GPT", fn: callGPT }
  ];

  for (let p of providers) {
    try {
      console.log(`Trying ${p.name}...`);
      const answer = await p.fn(prompt, context);
      return { answer, provider: p.name };
    } catch (e) {
      console.log(`${p.name} fail, next e jacchi`);
      continue;
    }
  }
  throw new Error("All AI APIs failed");
}