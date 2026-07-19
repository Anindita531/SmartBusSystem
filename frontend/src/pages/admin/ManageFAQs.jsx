import { useState, useEffect } from 'react'
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../../api/admin.api'
import { Plus, Pencil, Trash2, Loader, HelpCircle, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ManageFAQs() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ question: '', answer: '', category: 'General', order: 0, isActive: true })

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      setLoading(true)
      const res = await getFAQs()
      console.log('FAQ API Response:', res.data)
      const faqPayload = res.data?.data || res.data || []
      setFaqs(Array.isArray(faqPayload) ? faqPayload : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch FAQs')
      setFaqs([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateFAQ(editing._id, form)
        toast.success('FAQ updated')
      } else {
        await createFAQ(form)
        toast.success('FAQ created')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ question: '', answer: '', category: 'General', order: 0, isActive: true })
      fetchFAQs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save FAQ')
    }
  }

  const handleEdit = (faq) => {
    setEditing(faq)
    setForm(faq)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure to delete this FAQ?')) return
    try {
      await deleteFAQ(id)
      toast.success('FAQ deleted')
      fetchFAQs()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) || 
    f.answer.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader className="w-8 h-8 animate-spin text-indigo-600" /></div>
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <HelpCircle className="text-indigo-600" /> Manage FAQs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Add, edit and manage website FAQs</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setEditing(null); setForm({ question: '', answer: '', category: 'General', order: 0, isActive: true })}} 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            placeholder="Search FAQs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit FAQ' : 'Add New FAQ'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Question *</label>
                <input 
                  value={form.question} 
                  onChange={e => setForm({...form, question: e.target.value})} 
                  placeholder="e.g. How to cancel booking?" 
                  className="w-full border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Answer *</label>
                <textarea 
                  value={form.answer} 
                  onChange={e => setForm({...form, answer: e.target.value})} 
                  placeholder="Write detailed answer here..." 
                  className="w-full border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                  rows="5" 
                  required 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    <option>General</option>
                    <option>Booking</option>
                    <option>Payment</option>
                    <option>Pay on Exit</option>
                    <option>Cancellation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Order</label>
                  <input type="number" value={form.order} onChange={e => setForm({...form, order: Number(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4" />
                  <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 dark:bg-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
            <HelpCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No FAQs found. Click "Add FAQ" to create one.</p>
          </div>
        ) : (
          filteredFaqs.map(faq => (
            <div key={faq._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-medium">{faq.category}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Order: {faq.order}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${faq.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {faq.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{faq.question}</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{faq.answer}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(faq)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(faq._id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}