import FAQ from '../models/faq.model.js'

// @desc   Get all FAQs - Admin only
// @route  GET /api/faqs
export const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 })
    res.json({ success: true, data: faqs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc   Create FAQ - Admin only
// @route  POST /api/faqs
export const createFAQ = async (req, res) => {
  try {
    const { question, answer, category, order, isActive } = req.body
    const faq = await FAQ.create({ question, answer, category, order, isActive })
    res.status(201).json({ success: true, data: faq })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// @desc   Update FAQ - Admin only
// @route  PUT /api/faqs/:id
export const updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' })
    res.json({ success: true, data: faq })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// @desc   Delete FAQ - Admin only
// @route  DELETE /api/faqs/:id
export const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id)
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' })
    res.json({ success: true, message: 'FAQ deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
//@desc Get all active FAQs-Public
// @route GET /api/faqs/public
//Controller
export const getPublicFAQs=async(req,res)=>{
 try{
    const faqs=await FAQ.find({
      isActive:true
    }).sort({
      order:1
    })
    res.json({success:true,data:faqs})
  }
  catch(err)
  {
    res.status(500).json({
      success:false,message:err.message
    })
  }
}
