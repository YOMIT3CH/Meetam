import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'
import { useMeetAm } from '../context/MeetAmContext'
import AppNavbar from '../components/AppNavbar'
import AnnouncementBanner from '../components/AnnouncementBanner'
import CreditTopUpModal from '../components/CreditTopUpModal'
import { LuUsers, LuLogOut, LuArrowLeft, LuPencil } from 'react-icons/lu'

export default function Profile() {
  const navigate = useNavigate()
  const [authUser, setAuthUser] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editFullName, setEditFullName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editInterests, setEditInterests] = useState('')
  const [editOrientation, setEditOrientation] = useState('')

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAuthUser(null)
        setProfileData(null)
        setLoading(false)
        return
      }

      setAuthUser(user)

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .maybeSingle()

      if (profileError) {
        console.error(profileError)
      }

      if (data) {
        setProfileData(data)
        setEditFullName(data.full_name || data.display_name || '')
        setEditBio(data.bio || data.about_me || '')
        setEditInterests(Array.isArray(data.interests) ? data.interests.join(', ') : '')
        setEditOrientation(data.orientation || '')
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchUserProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSaveProfile = async () => {
    if (!authUser) return
    setSaving(true)
    setError('')

    const interestsArray = editInterests
      ? editInterests.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const payload = {
      full_name: editFullName,
      display_name: editFullName,
      bio: editBio,
      about_me: editBio,
      orientation: editOrientation,
      interests: interestsArray,
      updated_at: new Date().toISOString(),
    }

    try {
      if (profileData?.id) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', profileData.id)

        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert({
            ...payload,
            id: authUser.id,
            user_id: authUser.id,
          })

        if (insertErr) throw insertErr
      }

      await fetchUserProfile()
      setShowUpdateModal(false)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="glass-card p-8 rounded-2xl text-white text-center">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="glass-card p-8 rounded-2xl text-white text-center">
          <p className="text-slate-400 text-sm mb-4">Please log in to view your profile</p>
          <button
            className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />
      <AnnouncementBanner />

      <div className="pt-6 sm:pt-8 px-3.5 sm:px-6 pb-24 max-w-4xl mx-auto">
        <div className="glass-card p-5 sm:p-8 md:p-10 rounded-2xl mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">My Profile</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Your personality card</p>
            </div>
            <button
              className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-400/30 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 cursor-pointer self-start sm:self-auto"
              onClick={() => setShowUpdateModal(true)}
            >
              Edit Profile
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="glass-card p-6 text-center rounded-2xl relative bg-white/5 border border-white/10">
                <img
                  src={profileData?.photo_url || '/assets/hero.png'}
                  alt="Profile"
                  className="w-28 h-28 rounded-full mx-auto object-cover mb-4 border-2 border-emerald-500/30"
                />
                <button
                  className="mt-2 bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-all w-full"
                  onClick={() => navigate('/feed')}
                >
                  ← Browse Feed
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Full Name</p>
              <p className="text-lg font-bold text-white">
                {profileData?.full_name || profileData?.display_name || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Age</p>
              <p className="text-lg font-bold text-white">
                {profileData?.age ? `${profileData.age} years` : 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Gender</p>
              <p className="text-lg font-bold text-white capitalize">
                {profileData?.gender || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Orientation</p>
              <p className="text-lg font-bold text-white capitalize">
                {profileData?.orientation || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Location</p>
              <p className="text-lg font-bold text-white">
                {[profileData?.area || profileData?.location_city, profileData?.state || profileData?.location_state]
                  .filter(Boolean)
                  .join(', ') || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Tribe / Ethnicity</p>
              <p className="text-lg font-bold text-white">
                {profileData?.tribe || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Occupation</p>
              <p className="text-lg font-bold text-white">
                {profileData?.occupation || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Body Type</p>
              <p className="text-lg font-bold text-white capitalize">
                {profileData?.body_type?.replace('_', ' ') || 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Height</p>
              <p className="text-lg font-bold text-white">
                {profileData?.height || 'Not set'}
              </p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-slate-500 mb-1">About Me / Bio</p>
              <p className="text-base text-slate-300 leading-relaxed whitespace-pre-wrap">
                {profileData?.bio || profileData?.about_me || 'No bio provided yet.'}
              </p>
            </div>

            {profileData?.looking_for && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-slate-500 mb-1">Looking For</p>
                <p className="text-base text-pink-300 italic leading-relaxed">
                  "{profileData.looking_for}"
                </p>
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-slate-500 mb-1">Interests</p>
              <p className="text-sm text-emerald-400">
                {profileData?.interests && profileData.interests.length > 0
                  ? profileData.interests.join(', ')
                  : 'No interests listed'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showUpdateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setShowUpdateModal(false)}
          />
          <div className="relative bg-slate-900 border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-2xl max-w-md w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl z-10 overflow-hidden text-white">
            {/* Mobile drag handle */}
            <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden shrink-0 bg-slate-900">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Sticky Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur-md">
              <h2 className="text-base sm:text-lg font-bold text-white">Edit Profile</h2>
              <button
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-lg"
                onClick={() => setShowUpdateModal(false)}
              >
                ×
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 overscroll-contain">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Bio / About Me</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Introduce yourself..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Interests (comma separated)</label>
                <input
                  type="text"
                  value={editInterests}
                  onChange={(e) => setEditInterests(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Tech, Travel, Music"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Orientation</label>
                <select
                  value={editOrientation}
                  onChange={(e) => setEditOrientation(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">Select</option>
                  <option value="straight">Straight</option>
                  <option value="gay">Gay</option>
                  <option value="bi">Bisexual</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md flex gap-3">
              <button
                className="flex-1 bg-white/5 border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => setShowUpdateModal(false)}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
                onClick={handleSaveProfile}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
