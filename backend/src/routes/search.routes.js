import express from 'express'
import Bus from '../models/Bus.js'
import axios from 'axios'

const router = express.Router()

// ✅ SIMPLE TRANSLATE FUNCTION - Google Translate API
const translateText = async (text, targetLang = 'en') => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    const res = await axios.get(url)
    return res.data[0].map(item => item[0]).join('')
  } catch (e) {
    console.log("Translate failed, using original:", text)
    return text // fail hole original tai return korbe
  }
}

router.post('/chat', async (req, res) => {
  try {
    const { query, language = 'bn' } = req.body
    const isLoggedIn =!!req.user
    console.log("====== CHAT REQUEST ======")
    console.log("Login:", isLoggedIn, "| Lang:", language, "| Query:", query)

    // 1. TRANSLATE to English for DB search
    let searchQuery = query
    if(language!== 'en') {
      searchQuery = await translateText(query, 'en')
    }
    console.log("Translated:", query, "->", searchQuery)

    let buses = []

    // 2. SMART ROUTE SEARCH - "Kolkata theke Digha" or "কলকাতা থেকে দিঘা"
    const parts = searchQuery.split(/to|থেকে/gi).map(s=>s.trim())

    // AC/Non-AC detect koro
    let acFilter = {}
    if(/ac|এসি/i.test(searchQuery)) acFilter = { ac: true }
    if(/non-ac|ন-এসি/i.test(searchQuery)) acFilter = { ac: false }

    // Date filter - TEMPORARY OFF for testing
    // const today = new Date()
    // today.setHours(0,0,0,0)
    // const tomorrow = new Date(today)
    // tomorrow.setDate(tomorrow.getDate() + 1)

    if(parts.length >= 2){
      // Route search: Kolkata to Digha
      buses = await Bus.find({
        from: new RegExp(parts[0], 'i'),
        to: new RegExp(parts[1], 'i'),
        // journeyDate: { $gte: today, $lt: tomorrow }, // Eta off rakho
        availableSeats: { $gt: 0 },
        status: 'active',
        tripStatus: { $in: ['not_started', 'started'] },
      ...acFilter
      }).limit(5);
      console.log("Searching Route:", parts[0], "->", parts[1], "AC:", acFilter)
    } else {
      // Single word search
      buses = await Bus.find({
        $or: [
          { busName: new RegExp(searchQuery, 'i') },
          { from: new RegExp(searchQuery, 'i') },
          { to: new RegExp(searchQuery, 'i') },
          { 'checkpoints.name': new RegExp(searchQuery, 'i') }
        ],
        // journeyDate: { $gte: today, $lt: tomorrow }, // Eta off rakho
        availableSeats: { $gt: 0 },
        status: 'active',
        tripStatus: { $in: ['not_started', 'started'] },
      ...acFilter
      }).limit(5);
    }

    console.log("Buses Found:", buses.length)

    // 3. RESPONSE BUILD
    if(buses.length === 0) {
      return res.json({
        success: true,
        message: language === 'bn'
         ? "এই রুটে এখনও কোন বাস পাওয়া যায় না। অন্য রুট চেষ্টা করুন।"
          : "No buses found on this route. Please try another route."
      })
    }

    let response = language === 'bn'
     ? `${buses.length} টি বাস পাওয়া গেছে:\n\n`
      : `Found ${buses.length} buses:\n\n`

    buses.forEach((bus, i) => {
      const acText = bus.ac? (language === 'bn'? 'AC' : 'AC') : (language === 'bn'? 'Non-AC' : 'Non-AC')
      response += `${i+1}. 🚌 ${bus.busName} - ${acText} ${bus.busType}\n`
      response += ` ${bus.departureTime} - ${bus.arrivalTime} | ${bus.duration} | ₹${bus.price}\n`
      response += ` ${bus.from} → ${bus.to}\n\n`
    })

    response += language === 'bn'
     ? "Booking er full details er jonno login korun 🙏"
      : "Login for full booking details 🙏"

    res.json({ success: true, message: response, data: buses })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Server Error" })
  }
})

export default router