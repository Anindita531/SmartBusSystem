import { useState, useEffect } from 'react'
import { createBus } from '../../api/bus.api'
import { getConductors, getDrivers } from '../../api/user.api'
import { Plus, X, MapPin, DollarSign, Bus, Settings } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AddBusForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    busName: '', busNumber: '', busType: 'AC Sleeper', ac: true,
    from: '', to: '', departureTime: '', arrivalTime: '', duration: '',
    totalSeats: '', journeyDate: '', conductorId: '', driverId: '',
    mode: 'A'
  })
  const [checkpoints, setCheckpoints] = useState([
    { name: '', estimatedTime: '', order: 1, distanceFromStart: 0, fareFromHere: 0 },
    { name: '', estimatedTime: '', order: 2, distanceFromStart: 0, fareFromHere: 0 }
  ])
  const [conductors, setConductors] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getConductors().then(res => setConductors(res?.data?.data || [])).catch(() => setConductors([]))
    getDrivers().then(res => setDrivers(res?.data?.data || [])).catch(() => setDrivers([]))
  }, [])

  const addCheckpoint = () => {
    setCheckpoints([...checkpoints, {
      name: '', estimatedTime: '', order: checkpoints.length + 1,
      distanceFromStart: 0, fareFromHere: 0
    }])
  }

  const removeCheckpoint = (index) => {
    const updated = checkpoints.filter((_, i) => i!== index)
    updated.forEach((cp, i) => cp.order = i + 1)
    setCheckpoints(updated)
  }

  const updateCheckpoint = (index, field, value) => {
    const updated = [...checkpoints]
    updated[index][field] = value
    setCheckpoints(updated)
  }

  const totalPrice = Number(checkpoints[0]?.fareFromHere || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validCheckpoints = checkpoints
   .filter(cp => cp.name.trim()!== '')
   .map(cp => ({
        name: cp.name.trim(),
        estimatedTime: cp.estimatedTime,
        order: cp.order,
        distanceFromStart: Number(cp.distanceFromStart),
        fareFromHere: Number(cp.fareFromHere)
      }))

    if (validCheckpoints.length < 2) {
      toast.error('Add at least 2 checkpoints')
      return
    }

    setLoading(true)
    try {
      const payload = {
        busName: form.busName.trim(),
        busNumber: form.busNumber.trim().toUpperCase(),
        busType: form.busType,
        mode: form.mode,
        ac: form.ac,
        from: form.from.trim(),
        to: form.to.trim(),
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime,
        duration: form.duration,
        price: Number(validCheckpoints[0].fareFromHere),
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.totalSeats),
        date: form.journeyDate, // ✅ FIX: Backend 'date' চায়, 'journeyDate' না
        checkpoints: validCheckpoints
      }

      if (form.mode === 'B' && form.conductorId) {
        const selectedConductor = conductors.find(c => c._id === form.conductorId)
        payload.conductor = form.conductorId
        payload.conductorName = selectedConductor?.name || ''
        payload.conductorPhone = selectedConductor?.phone || ''
      }

      if (form.driverId) {
        const selectedDriver = drivers.find(d => d._id === form.driverId)
        payload.driver = form.driverId
        payload.driverName = selectedDriver?.name || ''
        payload.driverPhone = selectedDriver?.phone || ''
      }

      console.log("Final Payload:", payload)
      await createBus(payload)

      toast.success('Bus added successfully')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Submit error:', err)
      toast.error(err.response?.data?.message || 'Failed to add bus')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Toaster position="top-right" />
      <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-5xl my-8">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bus className="w-6 h-6 text-blue-400" /> Add New Bus
              </h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid lg:grid-cols-2 gap-4">
                  <input type="text" placeholder="Bus Name" value={form.busName} onChange={e => setForm({...form, busName: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />
                  <input type="text" placeholder="Bus Number" value={form.busNumber} onChange={e => setForm({...form, busNumber: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />

                  <div className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-4">
                    <label className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Operation Mode
                    </label>
                    <select
                      value={form.mode}
                      onChange={e => setForm({...form, mode: e.target.value, conductorId: ''})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="A">Mode A - Driver Only + GPS Auto Track</option>
                      <option value="B">Mode B - Driver + Conductor Manual</option>
                    </select>
                  </div>

                  <select value={form.busType} onChange={e => setForm({...form, busType: e.target.value, ac: e.target.value.includes('AC')})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white">
                    <option value="AC Sleeper">AC Sleeper</option>
                    <option value="Non-AC Sleeper">Non-AC Sleeper</option>
                    <option value="AC Seater">AC Seater</option>
                    <option value="Non-AC Seater">Non-AC Seater</option>
                  </select>

                  <select value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white">
                    <option value="">Select Driver (Optional)</option>
                    {Array.isArray(drivers) && drivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name} - {d.phone}</option>
                    ))}
                  </select>

                  {form.mode === 'B' && (
                    <div className="col-span-2">
                      <select
                        value={form.conductorId}
                        onChange={e => setForm({...form, conductorId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                        required
                      >
                        <option value="">Select Conductor (Required for Mode B)</option>
                        {Array.isArray(conductors) && conductors.map(c => (
                          <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <input type="text" placeholder="From City" value={form.from} onChange={e => setForm({...form, from: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />
                  <input type="text" placeholder="To City" value={form.to} onChange={e => setForm({...form, to: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />
                  <input type="time" value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />
                  <input type="time" value={form.arrivalTime} onChange={e => setForm({...form, arrivalTime: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />
                  <input type="text" placeholder="Duration e.g 10h" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />
                  <input type="number" placeholder="Total Seats" value={form.totalSeats} onChange={e => setForm({...form, totalSeats: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />
                  <input type="date" min={today} value={form.journeyDate} onChange={e => setForm({...form, journeyDate: e.target.value})} className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white" required />

                  <div className="px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-slate-400 text-xs">Total Fare (Auto)</p>
                      <p className="text-xl font-bold text-white">₹{totalPrice}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-400" /> Route Checkpoints
                    </h4>
                    <button type="button" onClick={addCheckpoint} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Add Stop
                    </button>
                  </div>

                  <div className="space-y-2">
                    {checkpoints.map((cp, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <span className="text-slate-400 col-span-1 pt-3">{idx + 1}.</span>
                        <input type="text" placeholder="Stop Name" value={cp.name} onChange={e => updateCheckpoint(idx, 'name', e.target.value)} className="col-span-3 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm" required />
                        <input type="text" placeholder="Time" value={cp.estimatedTime} onChange={e => updateCheckpoint(idx, 'estimatedTime', e.target.value)} className="col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm" />
                        <input type="number" placeholder="Distance" value={cp.distanceFromStart} onChange={e => updateCheckpoint(idx, 'distanceFromStart', e.target.value)} className="col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm" />
                        <input type="number" placeholder="Fare ₹" value={cp.fareFromHere} onChange={e => updateCheckpoint(idx, 'fareFromHere', e.target.value)} className="col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm" />
                        {checkpoints.length > 2 && (
                          <button type="button" onClick={() => removeCheckpoint(idx)} className="col-span-2 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30">
                            <X className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-orange-400 text-xs mt-2">⚠️ First stop = Full fare, Last stop = 0</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-700 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" /> {loading? 'Adding...' : 'Add Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}