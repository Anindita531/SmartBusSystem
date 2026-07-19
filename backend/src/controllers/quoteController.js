import Quote from '../models/Quote.js'

// Public: Get random quote for today
export const getTodaysQuote = async (req, res) => {
  try {
    // Daily cache: same quote for whole day based on date
    const today = new Date().toISOString().split('T')[0]
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0)

    const count = await Quote.countDocuments({ isActive: true })
    if (count === 0) {
      return res.json({ data: { text: 'Journey of a thousand miles begins with a single step', author: 'Lao Tzu' } })
    }

    const random = seed % count
    const quote = await Quote.findOne({ isActive: true }).skip(random)

    res.json({ data: quote })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Admin: Get all quotes
export const getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().sort('-createdAt').populate('addedBy', 'name')
    res.json({ data: quotes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Admin: Add quote
export const addQuote = async (req, res) => {
  try {
    const { text, author } = req.body
    const quote = await Quote.create({ text, author, addedBy: req.user._id })
    res.status(201).json({ data: quote, message: 'Quote added successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Admin: Toggle active
export const toggleQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
    quote.isActive =!quote.isActive
    await quote.save()
    res.json({ data: quote, message: 'Quote status updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Admin: Delete
export const deleteQuote = async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id)
    res.json({ message: 'Quote deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}