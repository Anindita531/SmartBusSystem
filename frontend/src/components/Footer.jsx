import { Link } from 'react-router-dom'
import { Bus, Mail, Phone, MapPin, ArrowUp } from 'lucide-react'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR }}>
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">SmartBus</span>
                <p className="text-gray-500 text-xs">Book Smart, Travel Smart</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              India's most trusted bus booking platform. Book tickets, track buses, and travel with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { name: 'Search Buses', path: '/search' },
                { name: 'My Bookings', path: '/bookings' },
                { name: 'Track Bus', path: '/track' },
                { name: 'Offers', path: '/offers' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    onMouseEnter={(e) => e.target.style.color = PRIMARY_COLOR}
                    onMouseLeave={(e) => e.target.style.color = ''}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
            <ul className="space-y-2.5">
              {[
                { name: 'Help Center', path: '/help' },
                { name: 'Contact Us', path: '/contact' },
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms & Conditions', path: '/terms' },
                { name: 'Refund Policy', path: '/refund' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    onMouseEnter={(e) => e.target.style.color = PRIMARY_COLOR}
                    onMouseLeave={(e) => e.target.style.color = ''}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${PRIMARY_COLOR}15` }}>
                  <Phone className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">24/7 Support</p>
                  <a 
                    href="tel:+911800123456" 
                    className="text-gray-900 text-sm font-semibold transition-colors"
                    onMouseEnter={(e) => e.target.style.color = PRIMARY_COLOR}
                    onMouseLeave={(e) => e.target.style.color = ''}
                  >
                    1800-123-456
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${PRIMARY_COLOR}15` }}>
                  <Mail className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Email Us</p>
                  <a 
                    href="mailto:support@smartbus.com" 
                    className="text-gray-900 text-sm font-semibold transition-colors"
                    onMouseEnter={(e) => e.target.style.color = PRIMARY_COLOR}
                    onMouseLeave={(e) => e.target.style.color = ''}
                  >
                    support@smartbus.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${PRIMARY_COLOR}15` }}>
                  <MapPin className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Head Office</p>
                  <p className="text-gray-900 text-sm">XYZ Street, Kolkata, West Bengal 700001</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            © 2026 SmartBus. All rights reserved.
          </p>
          
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 transition-all group"
          >
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-sm font-medium">Back to Top</span>
          </button>
        </div>
      </div>
    </footer>
  )
}