import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Faq from '../models/faq.model.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This will load backend/.env no matter where you run from
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seedFaqs() {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI); // debug
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    await Faq.deleteMany({}); 
    console.log('🗑️ Old FAQs deleted');

    const faqs = [
      {
        question: "What is the difference between Mode A and Mode B buses?",
        answer: "Mode A buses operate without a conductor. Passengers need to book tickets via QR code or UPI through the app. Mode B buses have both a Driver and a Conductor for ticketing.",
        category: "General",
        order: 1,
        isActive: true
      },
      {
        question: "Can I get a refund if I miss the bus?",
        answer: "No refund is provided after the bus departure time. If you cancel the ticket 30 minutes before departure via the app, you will receive an 80% refund.",
        category: "Cancellation",
        order: 2,
        isActive: true
      },
      {
        question: "How can I track the live location of a bus?",
        answer: "Go to the 'Track Bus' section on the home screen and enter the bus number or select the route. You will see the live GPS location of the bus.",
        category: "General",
        order: 3,
        isActive: true
      },
      {
        question: "Are there discounts for Students and Senior Citizens?",
        answer: "Yes. Upload your Student ID or Senior Citizen card in your profile. You will get a 50% discount on Mode B buses.",
        category: "Booking",
        order: 4,
        isActive: true
      },
      {
        question: "Where can I file a complaint if the bus is late?",
        answer: "You can file a complaint from the 'Help & Support' section in the app or call our helpline at 1800-123-4567.",
        category: "General",
        order: 5,
        isActive: true
      },
      {
        question: "How do I book a ticket on a Mode A bus without a conductor?",
        answer: "After boarding a Mode A bus, scan the QR code near your seat or use the 'Book Ticket' option in the app and enter the bus number.",
        category: "Booking",
        order: 6,
        isActive: true
      },
      {
        question: "Do buses run after 10 PM?",
        answer: "Yes. Selected Night Service Mode B buses operate until 12 AM. Use the 'Night Bus' filter in the app to see them.",
        category: "General",
        order: 7,
        isActive: true
      },
      {
        question: "What payment methods are accepted in the app?",
        answer: "We accept UPI, Debit/Credit Cards, Net Banking, and Wallets like Paytm, PhonePe, and GPay.",
        category: "Payment",
        order: 8,
        isActive: true
      },
      {
        question: "What should I do if I lost something in the bus?",
        answer: "Report it immediately via 'Lost & Found' in the app or contact the depot office with your bus number and travel time.",
        category: "General",
        order: 9,
        isActive: true
      }
    ];

    await Faq.insertMany(faqs);
    console.log(`✅ ${faqs.length} FAQs Seeded Successfully`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedFaqs();