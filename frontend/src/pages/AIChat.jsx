import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'

const PRIMARY_COLOR = '#0F4C75'

export default function AIChat() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [appLang, setAppLang] = useState('bn')
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const getWelcomeMessage = useCallback((lang) => {
    if(lang === 'en') return 'Hello! 🙏\nI am SmartBus AI Assistant.\nI can help you with bus timings, fares, and booking.\n\nFor example: "Are there any AC buses from Kolkata to Digha?"'
    if(lang === 'hi') return 'Namaste! 🙏\nMain SmartBus AI Assistant hun.\nMain aapki bus ka samay, kiraya aur booking mein madad kar sakta hun.\n\nJaise: "Kolkata se Digha AC bus hai kya?"'
    return 'Nomoskar! 🙏\nAmi SmartBus AI Assistant.\nAmi apnake bus er somoy, dam, ar booking e help korte pari.\n\nJemon jigges korun: "Kolkata theke Digha AC bus ache?"'
  }, [])

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') || 'bn'
    setAppLang(savedLang)
    setMessages([{ role: 'bot', text: getWelcomeMessage(savedLang) }])
  }, [getWelcomeMessage])

  useEffect(() => {
    const updateLang = () => {
      const savedLang = localStorage.getItem('lang') || 'bn'
      setAppLang(savedLang)
      setMessages([{ role: 'bot', text: getWelcomeMessage(savedLang) }])
    }
    window.addEventListener('appLangChanged', updateLang)
    return () => window.removeEventListener('appLangChanged', updateLang)
  }, [getWelcomeMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if(!query.trim()) return

    const userMsg = { role: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setLoading(true) // Google logo show

    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(
        'http://localhost:5000/api/search/chat',
        { query, language: appLang }, // 'lang' na 'language'
        { headers: { Authorization: token? `Bearer ${token}` : '' } }
      )

      const isLoggedIn = res.data.isLoggedIn??!!user

      setMessages(prev => [...prev, {
        role: 'bot',
        text: res.data.message, // 'answer' na 'message'
        buses: res.data.data, // 'buses' na 'data'
        isLoggedIn
      }])

    } catch (err) {
      console.error(err)
      const errorText = appLang === 'en'? 'Sorry, server problem. Try again later.' : appLang === 'hi'? 'Server mein samasya hai.' : 'Dukkhitoh, server e problem hocche. Pore try korun.'
      setMessages(prev => [...prev, { role: 'bot', text: errorText }])
    } finally {
      setLoading(false) // Eta must. Nahole ghurei jabe
    }
  }

  const placeholderText = appLang === 'en'? 'Example: Fare for AC bus from Kolkata to Siliguri?' : appLang === 'hi'? 'Jaise: Kolkata se Siliguri AC bus ka kiraya?' : 'Jemon: Kolkata to Siliguri AC bus er dam koto?'

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col bg-white rounded-2xl shadow-2xl border-gray-200 my-4 relative z-20">
      <div className="p-4 border-b flex items-center gap-3 rounded-t-2xl flex-shrink-0" style={{ backgroundColor: PRIMARY_COLOR }}>
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">SmartBus AI</h2>
          <p className="text-xs text-blue-100 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {appLang === 'en'? 'Always ready to help' : appLang === 'hi'? 'Hamesha madad ke liye taiyaar' : 'Sob somoy help er jonno ready'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`mb-4 flex gap-3 ${m.role === 'user'? 'justify-end' : 'justify-start'}`}>
            {m.role === 'bot' && <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PRIMARY_COLOR }}><Bot className="w-5 h-5 text-white"/></div>}
            <div className={`max-w-[75%] ${m.role === 'user'? 'order-2' : ''}`}>
              <div className={`p-3 rounded-2xl shadow-sm select-text ${m.role === 'user'? 'bg-blue-500 text-white rounded-br-none' : 'bg-white border-gray-200 rounded-bl-none'}`}>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">{m.text}</p>
                {m.buses && m.buses.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {m.buses.map((bus, idx) => (
                      <div key={bus._id || idx} className="p-3 border border-gray-200 rounded-xl bg-blue-50 hover:shadow-md transition">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{bus.busName}</p> {/* FIX: name na busName */}
                            <p className="text-xs text-gray-600">{bus.busType} {bus.ac? 'AC' : 'Non-AC'}</p>
                            <div className="flex gap-4 mt-1 text-xs">
                              <p>🕐 {bus.departureTime} - {bus.arrivalTime}</p>
                              <p className="font-bold text-green-700">₹{bus.price}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{bus.from} → {bus.to}</p>
                          </div>
                          {m.isLoggedIn? (
                            <button onClick={() => navigate(`/bus/${bus._id}/seats`)} className="text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition whitespace-nowrap" style={{ backgroundColor: PRIMARY_COLOR }}>
                              {appLang === 'en'? 'Book Now' : appLang === 'hi'? 'बुक करें' : 'বুক করুন'}
                            </button>
                          ) : (
                            <button onClick={() => navigate('/login')} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-orange-600 transition whitespace-nowrap">
                              {appLang === 'en'? 'Login to Book' : appLang === 'hi'? 'लॉगिन करें' : 'লগইন করুন'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {m.role === 'user' && <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-white" /></div>}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: PRIMARY_COLOR }}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' &&!loading && handleSend()}
            placeholder={placeholderText}
            className="flex-1 border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 text-sm select-text bg-white text-gray-900"
            style={{'--tw-ring-color': PRIMARY_COLOR}}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading ||!query.trim()} className="px-5 rounded-xl text-white font-semibold hover:scale-105 transition disabled:opacity-50 disabled:scale-100 flex items-center gap-2" style={{ backgroundColor: PRIMARY_COLOR }}>
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{appLang === 'en'? 'Send' : appLang === 'hi'? 'भेजें' : 'পাঠান'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}