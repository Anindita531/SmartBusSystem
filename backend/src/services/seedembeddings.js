import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import FAQ from "../models/faq.model.js";

// dotenv load howar por embeddings import hocche
const { getEmbedding } = await import("../services/embeddings.js");

const seed = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found in .env");
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Sudhu jader embedding nei
    const faqs = await FAQ.find({
      embedding: { $exists: false },
    });

    if (faqs.length === 0) {
      console.log("All FAQs already have embeddings.");
      process.exit(0);
    }

    console.log(`${faqs.length} FAQs will be updated...`);

    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i];

      const text = `
Question: ${faq.question}
Answer: ${faq.answer}
      `.trim();

      const embedding = await getEmbedding(text);

      faq.embedding = embedding;
      await faq.save();

      console.log(
        `${i + 1}/${faqs.length} Done: ${faq.question.substring(0, 40)}...`
      );

      // Rate limit avoid
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("✅ All embeddings generated successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();