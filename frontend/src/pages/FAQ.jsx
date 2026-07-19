import { useState, useEffect } from 'react'
import { ChevronDown, Loader, HelpCircle } from 'lucide-react'
import api from '../api/axios' // tomar axios instance

export default function FAQ() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    fetchPublicFAQs() // <-- () ADD KORE DAO
  }, [])

  const fetchPublicFAQs = async () => {
    try {
      const res = await api.get('/faqs/public') // Public API
      setFaqs(res.data.data || [])
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
        <HelpCircle className="text-indigo-600" /> Frequently Asked Questions
      </h1>
      
      {faqs.length === 0 ? (
        <p className="text-center text-gray-500">No FAQs found</p>
      ) : (
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f._id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex justify-between items-center p-4 text-left"
              >
                <p className="font-semibold text-gray-900 dark:text-white">{f.question}</p>
                <ChevronDown className={`w-5 h-5 transition text-gray-500 ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4 text-gray-600 dark:text-gray-300 border-t dark:border-gray-700 pt-3">
                  {f.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}