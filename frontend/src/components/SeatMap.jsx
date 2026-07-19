import { useState, useEffect } from 'react'
import { joinWaitlist } from '../api/waitlist.api'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function SeatMap({ busData, selectedSeats, onSeatToggle, userId }) {
  const SEATS = [
    ['A1','A2','','A3','A4'],
    ['B1','B2','','B3','B4'],
    ['C1','C2','','C3','C4'],
    ['D1','D2','','D3','D4'],
    ['E1','E2','','E3','E4'],
    ['F1','F2','','F3','F4'],
    ['G1','G2','','G3','G4'],
    ['H1','H2','','H3','H4'],
  ]

  const { 
    bookedSeats = [], 
    lockedSeats = [], 
    waitlistedSeats = [],
    hasActiveWaitlist = false,
    waitlistUserId = null
  } = busData

  const getSeatStatus = (seat) => {
    if (bookedSeats.includes(seat)) return 'booked'
    if (selectedSeats.includes(seat)) return 'selected'
    
    if (waitlistedSeats.includes(seat)) {
      return waitlistUserId?.toString() === userId?.toString() ? 'myWaitlist' : 'waitlist'
    }

    const lock = lockedSeats.find(l => l.seatNumber === seat && new Date(l.expiresAt) > new Date())
    if (lock) {
      return lock.userId?.toString() === userId?.toString() ? 'myLock' : 'locked'
    }

    return 'available'
  }

  const getTooltip = (seat, status) => {
    switch(status) {
      case 'booked': return `${seat} - Already Booked - Click to Join Waitlist`
      case 'locked': return `${seat} - Locked by another user`
      case 'myLock': return `${seat} - Locked by you`
      case 'waitlist': return `${seat} - Reserved for Waitlisted User`
      case 'myWaitlist': return `${seat} - Reserved for you! Book now`
      case 'selected': return `${seat} - Selected`
      default: return `${seat} - Available`
    }
  }

  const handleClick = async (seat) => {
    const status = getSeatStatus(seat)
    
    if (status === 'waitlist') {
      if (confirm('This seat is reserved for waitlisted passengers. Join waitlist to get priority?')) {
        try {
          await joinWaitlist({
            busId: busData._id,
            journeyDate: busData.journeyDate,
            seatsNeeded: 1
          })
          toast.success('Added to waitlist! You will be notified within 30min if seats become available.')
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to join waitlist')
        }
      }
      return
    }

    if (status === 'myWaitlist') {
      onSeatToggle(seat)
      return
    }

    if (status === 'booked') {
      if (confirm('Seat already booked. Join waitlist to get notified if cancelled?')) {
        try {
          await joinWaitlist({
            busId: busData._id,
            journeyDate: busData.journeyDate,
            seatsNeeded: 1
          })
          toast.success('Added to waitlist!')
        } catch (err) {
          toast.error(err.response?.data?.message)
        }
      }
      return
    }

    if (status === 'locked') {
      toast.error('This seat is temporarily locked by another user')
      return
    }
    
    onSeatToggle(seat)
  }

  const seatStyles = {
    available: 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50 cursor-pointer',
    selected: 'text-white border-2 shadow-lg cursor-pointer',
    myLock: 'text-white border-2 ring-2 shadow-lg cursor-pointer',
    locked: 'bg-yellow-50 border-yellow-300 text-yellow-700 cursor-not-allowed',
    booked: 'bg-red-100 border-red-300 text-red-700 cursor-pointer hover:bg-red-200',
    waitlist: 'bg-orange-50 border-orange-300 text-orange-700 cursor-pointer animate-pulse',
    myWaitlist: 'bg-green-600 border-green-500 text-white ring-2 ring-green-400 shadow-lg shadow-green-500/50 cursor-pointer'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {hasActiveWaitlist && (
        <div className="w-full bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
          <p className="text-orange-700 text-sm text-center">
            ⚠️ {waitlistedSeats.length} seats are reserved for waitlisted passengers for 30 minutes
          </p>
        </div>
      )}

      <div className="w-16 h-8 bg-gray-300 rounded-t-lg mb-4 flex items-center justify-center text-xs text-gray-700 font-semibold">Driver</div>

      {SEATS.map((row, i) => (
        <div key={i} className="flex gap-3">
          {row.map((seat, j) => seat === ''?
            <div key={j} className="w-12"></div> :
            <button
              key={seat}
              onClick={() => handleClick(seat)}
              disabled={['locked'].includes(getSeatStatus(seat))}
              title={getTooltip(seat, getSeatStatus(seat))}
              className={`w-12 h-12 rounded-lg border-2 font-medium transition-all text-sm ${
                getSeatStatus(seat) === 'selected' || getSeatStatus(seat) === 'myLock' 
                  ? seatStyles[getSeatStatus(seat)] 
                  : seatStyles[getSeatStatus(seat)]
              }`}
              style={{
                backgroundColor: getSeatStatus(seat) === 'selected' ? PRIMARY_COLOR : 
                                 getSeatStatus(seat) === 'myLock' ? PRIMARY_COLOR : undefined,
                borderColor: getSeatStatus(seat) === 'selected' ? PRIMARY_COLOR : 
                             getSeatStatus(seat) === 'myLock' ? PRIMARY_COLOR : undefined,
                ringColor: getSeatStatus(seat) === 'myLock' ? PRIMARY_COLOR : undefined
              }}
            >
              {seat}
            </button>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-4 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: PRIMARY_COLOR }}></div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 border border-green-500 rounded"></div>
          <span className="text-gray-600">Your Waitlist</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-50 border border-orange-300 rounded"></div>
          <span className="text-gray-600">Waitlist Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded ring-2" style={{ backgroundColor: PRIMARY_COLOR, ringColor: PRIMARY_COLOR }}></div>
          <span className="text-gray-600">Your Lock</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
          <span className="text-gray-600">Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div> 
          <span className="text-gray-600">Booked</span>
        </div>
      </div>
    </div>
  )
}