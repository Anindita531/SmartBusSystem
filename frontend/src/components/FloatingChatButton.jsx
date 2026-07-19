import { useState } from 'react'
import { MessageCircle, X, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PRIMARY_COLOR = '#0F4C75'

export default function FloatingChatButton() {
  const [showTooltip, setShowTooltip] = useState(false)
  const navigate = useNavigate()

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
          AI Assistant ke jigges korun
          <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={() => navigate('/ai-chat')}
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(15,76,117,0.4)] group"
        style={{ backgroundColor: PRIMARY_COLOR }}
      >
        <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition" />
        <Sparkles className="w-3 h-3 text-yellow-300 absolute top-2 right-2 animate-pulse" />
      </button>
    </div>
  )
}