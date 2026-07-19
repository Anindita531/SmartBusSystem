import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import Bus from '../models/Bus.js'
import Faq from '../models/faq.model.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

const seedEmbeddings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // 1. FAQs
    const faqs = await Faq.find({ embedding: { $exists: false } });
    for (const faq of faqs) {
      const text = `${faq.question} ${faq.answer}`;
      faq.embedding = await getEmbedding(text);
      await faq.save();
      console.log(`✅ FAQ Embedded: ${faq.question.substring(0,30)}...`);
    }

    // 2. Buses
    const buses = await Bus.find({ embedding: { $exists: false } });
    for (const bus of buses) {
      const text = `${bus.busName} ${bus.busType} from ${bus.from} to ${bus.to} departs at ${bus.departureTime} price ${bus.price}`;
      bus.embedding = await getEmbedding(text);
      await bus.save();
      console.log(`✅ Bus Embedded: ${bus.busNumber}`);
    }

    console.log('🎉 All embeddings generated!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedEmbeddings();