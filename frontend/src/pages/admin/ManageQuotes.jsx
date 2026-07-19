import { useState, useEffect } from 'react'
import { Plus, Trash2, Power, Quote as QuoteIcon } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const PRIMARY_COLOR = '#0F4C75'

export default function ManageQuotes() {
  const [quotes, setQuotes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ text: '', author: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      const res = await api.get('/quotes/all')
      setQuotes(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/quotes/add', formData)
      toast.success('Quote added!')
      setFormData({ text: '', author: '' })
      setShowForm(false)
      fetchQuotes()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add')
    }
  }

  const handleToggle = async (id) => {
    try {
      await api.patch(`/quotes/toggle/${id}`)
      toast.success('Status updated')
      fetchQuotes()
    } catch (err) {
      toast.error('Failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this quote?')) return
    try {
      await api.delete(`/quotes/${id}`)
      toast.success('Deleted')
      fetchQuotes()
    } catch (err) {
      toast.error('Failed')
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <QuoteIcon className="w-8 h-8" style={{ color: PRIMARY_COLOR }} />
            Manage Quotes
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus className="w-5 h-5" /> Add Quote
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 text-sm mb-1 block">Quote Text *</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({...formData, text: e.target.value })}
                  required
                  rows="3"
                  className="w-full bg-white text-gray-900 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter inspirational quote..."
                />
              </div>
              <div>
                <label className="text-gray-700 text-sm mb-1 block">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value })}
                  className="w-full bg-white text-gray-900 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Anonymous"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 text-white py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}>
                  Add Quote
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {quotes.map(quote => (
            <div key={quote._id} className={`bg-white border rounded-lg p-4 ${quote.isActive? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-gray-900 mb-1">"{quote.text}"</p>
                  <p className="text-gray-600 text-sm">— {quote.author || 'Anonymous'}</p>
                  <p className="text-gray-500 text-xs mt-2">Added by: {quote.addedBy?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(quote._id)}
                    className={`p-2 rounded-lg ${quote.isActive? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} hover:opacity-80`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(quote._id)}
                    className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}