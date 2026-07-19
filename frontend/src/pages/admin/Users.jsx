import { useState, useEffect } from 'react'
import { Users as UsersIcon, Trash2, Loader, Copy, Check, UserPlus, X, Shield, Car, User, Search } from 'lucide-react'
import { getAllUsers, updateUserRole, deleteUser, createStaff } from '../../api/admin.api'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState('admin') // admin, customer, staff
  const [searchQuery, setSearchQuery] = useState('')
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', password: '', role: 'conductor' })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers()
      setUsers(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    try {
      await createStaff(newStaff)
      toast.success(`${newStaff.role} created`)
      setShowAddModal(false)
      fetchUsers()
      setNewStaff({ name: '', email: '', phone: '', password: '', role: 'conductor' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole)
      fetchUsers()
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user?')) return
    try {
      await deleteUser(userId)
      fetchUsers()
      toast.success('User deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const maskPhone = (phone) => {
    if (!phone) return 'N/A'
    return `${phone.slice(0,3)}****${phone.slice(-2)}`
  }

  const copyPhone = (phone, userId) => {
    navigator.clipboard.writeText(phone)
    setCopiedId(userId)
    toast.success('Phone copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ✅ Count করো
  const adminCount = users.filter(u => u.role === 'admin').length
  const customerCount = users.filter(u => u.role === 'user').length
  const staffCount = users.filter(u => u.role === 'conductor' || u.role === 'driver').length

  // ✅ Filter by tab + search
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.phone?.includes(searchQuery)
    
    if (activeTab === 'admin') return u.role === 'admin' && matchSearch
    if (activeTab === 'customer') return u.role === 'user' && matchSearch
    if (activeTab === 'staff') return (u.role === 'conductor' || u.role === 'driver') && matchSearch
    return matchSearch
  })

  if (loading) return <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} /></div>

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <UsersIcon className="w-8 h-8" style={{ color: PRIMARY_COLOR }} /> Manage Users
        </h1>
        {activeTab === 'staff' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <UserPlus className="w-5 h-5" /> Add Driver/Conductor
          </button>
        )}
      </div>

      {/* ✅ 3টা Clickable Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => setActiveTab('admin')}
          className={`bg-white border rounded-lg p-6 cursor-pointer transition-all ${
            activeTab === 'admin' ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Admins</p>
              <p className="text-4xl font-bold text-gray-900">{adminCount}</p>
            </div>
            <Shield className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('customer')}
          className={`bg-white border rounded-lg p-6 cursor-pointer transition-all ${
            activeTab === 'customer' ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Customers</p>
              <p className="text-4xl font-bold text-gray-900">{customerCount}</p>
            </div>
            <User className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('staff')}
          className={`bg-white border rounded-lg p-6 cursor-pointer transition-all ${
            activeTab === 'staff' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Drivers & Conductors</p>
              <p className="text-4xl font-bold text-gray-900">{staffCount}</p>
            </div>
            <Car className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* ✅ Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Search in ${activeTab === 'admin' ? 'Admins' : activeTab === 'customer' ? 'Customers' : 'Drivers & Conductors'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* ✅ Table - শুধু active tab এর data */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Name</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Email</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Phone</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Role</th>
                <th className="text-left py-3 px-4 text-gray-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-900 font-semibold">{user.name}</td>
                    <td className="py-4 px-4 text-gray-700">{user.email}</td>
                    <td className="py-4 px-4 text-gray-700">
                      <div className="flex items-center gap-2 group">
                        <span className="font-mono">{maskPhone(user.phone)}</span>
                        {user.phone && (
                          <button
                            onClick={() => copyPhone(user.phone, user._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                          >
                            {copiedId === user._id? 
                              <Check className="w-4 h-4 text-green-600" /> : 
                              <Copy className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-300 ${
                          user.role === 'admin'? 'text-red-600' : 
                          user.role === 'conductor'? 'text-yellow-600' : 
                          user.role === 'driver'? 'text-blue-600' : 'text-green-600'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="conductor">Conductor</option>
                        <option value="driver">Driver</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => handleDelete(user._id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateStaff} className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Add Driver/Conductor</h2>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-900" />
              </button>
            </div>
            <input placeholder="Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" required />
            <input type="email" placeholder="Email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" required />
            <input placeholder="Phone" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" required />
            <input type="password" placeholder="Password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" required />
            <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900">
              <option value="conductor">Conductor</option>
              <option value="driver">Driver</option>
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 text-white py-2 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR }}>Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}