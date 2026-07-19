import { useState, useEffect, useMemo } from 'react'
import { getBuses, getConductors, assignConductor, removeConductor, assignDriver, removeDriver } from '../../api/bus.api'
import { Plus, UserPlus, UserMinus, Bus as BusIcon, X, Search, Filter, Users, Car, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import AddBusForm from './AddBusForm'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function ManageBuses() {
  const [buses, setBuses] = useState([])
  const [conductors, setConductors] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [showAssignConductorModal, setShowAssignConductorModal] = useState(false)
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterConductor, setFilterConductor] = useState('all')
  const [filterDriver, setFilterDriver] = useState('all')
  const [filterMode, setFilterMode] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const [busRes, conductorRes, driverRes] = await Promise.all([
        getBuses(),
        getConductors(),
        fetch('/api/users?role=driver', { 
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())
      ])
      
      setBuses(busRes.data.data || busRes.data || [])
      setConductors(conductorRes.data.data || conductorRes.data || [])
      setDrivers(driverRes.data || [])
    } catch (err) {
      console.log('fetchData error:', err)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredBuses = useMemo(() => {
    return buses.filter(bus => {
      const matchesSearch =
        bus.busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.conductor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFrom = !filterFrom || bus.from.toLowerCase().includes(filterFrom.toLowerCase())
      const matchesTo = !filterTo || bus.to.toLowerCase().includes(filterTo.toLowerCase())

      const matchesConductor =
        filterConductor === 'all' ||
        (filterConductor === 'assigned' && bus.conductor) ||
        (filterConductor === 'unassigned' && !bus.conductor)

      const matchesDriver =
        filterDriver === 'all' ||
        (filterDriver === 'assigned' && bus.driver) ||
        (filterDriver === 'unassigned' && !bus.driver)

      const matchesMode =
        filterMode === 'all' ||
        (filterMode === 'A' && (bus.mode === 'A' || !bus.mode)) ||
        (filterMode === 'B' && bus.mode === 'B')

      return matchesSearch && matchesFrom && matchesTo && matchesConductor && matchesDriver && matchesMode
    })
  }, [buses, searchTerm, filterFrom, filterTo, filterConductor, filterDriver, filterMode])

  const cities = useMemo(() => {
    const fromCities = buses.map(b => b.from)
    const toCities = buses.map(b => b.to)
    return [...new Set([...fromCities, ...toCities])].sort()
  }, [buses])

  const handleAssignConductor = async (conductorId) => {
    try {
      await assignConductor(selectedBus._id, conductorId)
      toast.success('Conductor assigned')
      setShowAssignConductorModal(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign')
    }
  }

  const handleRemoveConductor = async (busId) => {
    if (!confirm('Remove conductor from this bus?')) return
    try {
      await removeConductor(busId)
      toast.success('Conductor removed')
      fetchData()
    } catch (err) {
      toast.error('Failed to remove')
    }
  }

  const handleAssignDriver = async (driverId) => {
    try {
      await assignDriver(selectedBus._id, driverId)
      toast.success('Driver assigned')
      setShowAssignDriverModal(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign')
    }
  }

  const handleRemoveDriver = async (busId) => {
    if (!confirm('Remove driver from this bus?')) return
    try {
      await removeDriver(busId)
      toast.success('Driver removed')
      fetchData()
    } catch (err) {
      toast.error('Failed to remove')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterFrom('')
    setFilterTo('')
    setFilterConductor('all')
    setFilterDriver('all')
    setFilterMode('all')
  }

  if (loading) return <div className="text-gray-900 text-center py-20">Loading...</div>

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Manage Buses & Staff</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus className="w-5 h-5" /> Add New Bus
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by bus, conductor, driver..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                showFilters ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ backgroundColor: showFilters ? PRIMARY_COLOR : undefined }}
            >
              <Filter className="w-5 h-5" /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid md:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-200">
              <select
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="">From City (All)</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <select
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="">To City (All)</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <select
                value={filterConductor}
                onChange={e => setFilterConductor(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="all">All Conductors</option>
                <option value="assigned">Conductor Assigned</option>
                <option value="unassigned">No Conductor</option>
              </select>

              <select
                value={filterDriver}
                onChange={e => setFilterDriver(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="all">All Drivers</option>
                <option value="assigned">Driver Assigned</option>
                <option value="unassigned">No Driver</option>
              </select>

              <select
                value={filterMode}
                onChange={e => setFilterMode(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="all">All Modes</option>
                <option value="A">Mode A - GPS Auto</option>
                <option value="B">Mode B - Manual</option>
              </select>

              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold"
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="mt-3 text-gray-600 text-sm">
            Showing {filteredBuses.length} of {buses.length} buses
          </div>
        </div>

        <div className="space-y-4">
          {filteredBuses.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <BusIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 text-lg">No buses found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            filteredBuses.map(bus => (
              <div key={bus._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <BusIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900">{bus.busName}</h3>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{bus.busNumber}</span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">{bus.busType}</span>
                      
                      <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                        bus.mode === 'B'
                          ? 'bg-orange-50 text-orange-700' 
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        <Settings className="w-3 h-3" />
                        {bus.mode === 'B'? 'Mode B - Manual' : 'Mode A - GPS Auto'}
                      </span>
                    </div>
                    <p className="text-gray-700">{bus.from} → {bus.to}</p>
                    <p className="text-gray-500 text-sm">{bus.departureTime} - {bus.arrivalTime} | ₹{bus.price} | {bus.totalSeats} seats</p>
                    <p className="text-gray-500 text-xs mt-1">Date: {new Date(bus.journeyDate).toLocaleDateString('en-GB')}</p>

                    {bus.mode === 'B' && !bus.conductor && (
                      <div className="mt-2 px-3 py-1 bg-red-50 border border-red-200 rounded text-red-700 text-xs inline-block">
                        ⚠️ Mode B requires conductor assignment
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:w-80">
                    {bus.mode === 'B' && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          {bus.conductor ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-green-700 text-xs font-semibold flex items-center gap-1">
                                <Users className="w-3 h-3" /> Conductor
                              </p>
                              <p className="text-gray-900 text-sm">{bus.conductor.name}</p>
                              <p className="text-gray-600 text-xs">{bus.conductor.phone}</p>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-red-700 text-xs">No Conductor</p>
                              <p className="text-gray-500 text-xs mt-1">Required for Mode B</p>
                            </div>
                          )}
                        </div>
                        {bus.conductor ? (
                          <button
                            onClick={() => handleRemoveConductor(bus._id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSelectedBus(bus); setShowAssignConductorModal(true) }}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {bus.mode === 'A' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-purple-700 text-xs font-semibold">GPS Auto Mode</p>
                        <p className="text-gray-600 text-xs mt-1">No conductor needed</p>
                        <p className="text-gray-500 text-xs">Boarding tracked via GPS</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        {bus.driver ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-blue-700 text-xs font-semibold flex items-center gap-1">
                              <Car className="w-3 h-3" /> Driver
                            </p>
                            <p className="text-gray-900 text-sm">{bus.driver.name}</p>
                            <p className="text-gray-600 text-xs">{bus.driver.phone}</p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-gray-600 text-xs">No Driver</p>
                            <p className="text-gray-500 text-xs mt-1">Optional</p>
                          </div>
                        )}
                      </div>
                      {bus.driver ? (
                        <button
                          onClick={() => handleRemoveDriver(bus._id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSelectedBus(bus); setShowAssignDriverModal(true) }}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Bus</h2>
              <AddBusForm
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchData}
              />
            </div>
          </div>
        </div>
      )}

      {showAssignConductorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignConductorModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Assign Conductor to {selectedBus.busName}
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {conductors.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No conductors available</p>
              ) : (
                conductors.map(c => (
                  <button
                    key={c._id}
                    onClick={() => handleAssignConductor(c._id)}
                    className="w-full bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-left transition-colors"
                  >
                    <p className="text-gray-900 font-semibold">{c.name}</p>
                    <p className="text-gray-600 text-sm">{c.phone}</p>
                    <p className="text-gray-500 text-xs">{c.email}</p>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowAssignConductorModal(false)}
              className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAssignDriverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignDriverModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Assign Driver to {selectedBus.busName}
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {drivers.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No drivers available</p>
              ) : (
                drivers.map(d => (
                  <button
                    key={d._id}
                    onClick={() => handleAssignDriver(d._id)}
                    className="w-full bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-left transition-colors"
                  >
                    <p className="text-gray-900 font-semibold">{d.name}</p>
                    <p className="text-gray-600 text-sm">{d.phone}</p>
                    <p className="text-gray-500 text-xs">{d.email}</p>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowAssignDriverModal(false)}
              className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}