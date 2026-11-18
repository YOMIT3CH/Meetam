import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import supabase from '../lib/supabase'
import { useMeetAm } from '../context/MeetAmContext'
import AppNavbar from '../components/AppNavbar'
import AnnouncementBanner from '../components/AnnouncementBanner'
import CreditTopUpModal from '../components/CreditTopUpModal'
import { NIGERIAN_STATES, INTENTS, BODY_TYPES } from '../lib/data'
import {
  LuPencil,
  LuMapPin,
  LuBriefcase,
  LuGlobe,
  LuHeart,
  LuSparkles,
  LuUser,
  LuRuler,
  LuMessageCircle,
  LuGhost,
  LuShieldCheck,
  LuCamera,
  LuCircleCheck,
  LuCircleAlert,
  LuChevronDown,
  LuX,
  LuLogOut,
  LuLayoutGrid,
} from 'react-icons/lu'

// ── Gradient initials avatar ──────────────────────────────────────────────────
function InitialsAvatar({ name = '', size = 'lg' }) {
  const initials = name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const gradients = [
    'from-emerald-500 to-teal-500',
    'from-pink-500 to-rose-500',
    'from-violet-500 to-purple-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-blue-500',
  ]
  const idx = name.charCodeAt(0) % gradients.length
  const grad = gradients[idx] || gradients[0]

  const sizeClass =
    size === 'lg'
      ? 'w-28 h-28 text-3xl'
      : size === 'md'
      ? 'w-16 h-16 text-xl'
      : 'w-10 h-10 text-base'

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white shrink-0 select-none`}
    >
      {initials || <LuUser size={28} />}
    </div>
  )
}

// ── A single stat pill ────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, iconColor = 'text-slate-400' }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/8">
      <Icon size={15} className={`${iconColor} shrink-0 mt-0.5`} />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold truncate">
          {label}
        </p>
        <p className="text-sm text-white font-medium mt-0.5 capitalize leading-snug break-words">
          {value || <span className="text-slate-500 italic">Not set</span>}
        </p>
      </div>
    </div>
  )
}

// ── Field wrapper for the edit modal ─────────────────────────────────────────
function EditField({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLS =
  'w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20 placeholder:text-slate-500'
const SELECT_CLS =
  'w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all hover:border-white/20 appearance-none'

// ─────────────────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate()
  const { creditsBalance, logout } = useMeetAm()

  const [authUser, setAuthUser] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  // Photo upload state (edit modal)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const photoInputRef = useRef(null)

  // Edit form state — all fields
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editLookingFor, setEditLookingFor] = useState('')
  const [editInterests, setEditInterests] = useState('')
  const [editOrientation, setEditOrientation] = useState('')
  const [editTribe, setEditTribe] = useState('')
  const [editOccupation, setEditOccupation] = useState('')
  const [editBodyType, setEditBodyType] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editState, setEditState] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editIntent, setEditIntent] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editSnapchat, setEditSnapchat] = useState('')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

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

      if (profileError) console.error(profileError)

      if (data) {
        setProfileData(data)
        prefillEdit(data)
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const prefillEdit = (d) => {
    setEditName(d.full_name || d.display_name || '')
    setEditBio(d.bio || d.about_me || '')
    setEditLookingFor(d.looking_for || '')
    setEditInterests(Array.isArray(d.interests) ? d.interests.join(', ') : '')
    setEditOrientation(d.orientation || '')
    setEditTribe(d.tribe || '')
    setEditOccupation(d.occupation || '')
    setEditBodyType(d.body_type || '')
    setEditHeight(d.height || '')
    setEditState(d.state || d.location_state || '')
    setEditCity(d.area || d.location_city || '')
    setEditIntent(d.intent || '')
    setEditWhatsapp(d.whatsapp_number || '')
    setEditSnapchat(d.snapchat_handle || '')
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  useEffect(() => {
    fetchUserProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') fetchUserProfile()
    })

    return () => subscription.unsubscribe()
  }, [])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    if (!authUser) return
    setSaving(true)
    setError('')

    try {
      let finalPhotoUrl = profileData?.photo_url || null

      // Upload new photo if selected
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `avatars/${authUser.id}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('profile-photos')
          .upload(path, photoFile, { upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(path)
          finalPhotoUrl = urlData?.publicUrl || finalPhotoUrl
        }
      }

      const interestsArray = editInterests
        ? editInterests
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []

      const payload = {
        full_name: editName,
        display_name: editName,
        bio: editBio,
        about_me: editBio,
        looking_for: editLookingFor,
        interests: interestsArray,
        orientation: editOrientation,
        tribe: editTribe,
        occupation: editOccupation,
        body_type: editBodyType,
        height: editHeight,
        state: editState,
        location_state: editState,
        area: editCity,
        location_city: editCity,
        intent: editIntent,
        whatsapp_number: editWhatsapp,
        snapchat_handle: editSnapchat,
        photo_url: finalPhotoUrl,
        updated_at: new Date().toISOString(),
      }

      if (profileData?.id) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', profileData.id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase.from('profiles').insert({
          ...payload,
          id: authUser.id,
          user_id: authUser.id,
        })
        if (insertErr) throw insertErr
      }

      await fetchUserProfile()
      setShowEditModal(false)
      showToast('Profile updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full" />
          <p className="text-slate-400 text-sm">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-4">
          <p className="text-slate-400 text-sm">Please log in to view your profile</p>
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

  const displayName =
    profileData?.full_name || profileData?.display_name || authUser.email?.split('@')[0] || 'You'
  const location = [
    profileData?.area || profileData?.location_city,
    profileData?.state || profileData?.location_state,
  ]
    .filter(Boolean)
    .join(', ')

  const intentLabel =
    INTENTS.find((i) => i.value === profileData?.intent)?.label || profileData?.intent

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />
      <AnnouncementBanner />

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-300'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? (
            <LuCircleAlert size={16} />
          ) : (
            <LuCircleCheck size={16} />
          )}
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 space-y-4">
        {/* ── Hero Card ──────────────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10">
          {/* gradient bg strip */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-pink-500/20" />

          <div className="relative px-5 pt-8 pb-5">
            {/* Avatar + Edit button row */}
            <div className="flex items-end justify-between gap-3 mb-4">
              <div className="relative">
                {profileData?.photo_url ? (
                  <img
                    src={profileData.photo_url}
                    alt={displayName}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-2 border-white/20 shadow-xl overflow-hidden">
                    <InitialsAvatar name={displayName} size="lg" />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-1">
                <button
                  onClick={() => { prefillEdit(profileData || {}); setShowEditModal(true) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <LuPencil size={13} />
                  Edit
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 text-xs font-semibold transition-all cursor-pointer"
                >
                  <LuLogOut size={13} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Name + meta */}
            <h1 className="text-2xl font-bold text-white tracking-tight">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-400">
              {profileData?.age && <span>{profileData.age} yrs</span>}
              {profileData?.gender && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="capitalize">{profileData.gender}</span>
                </>
              )}
              {location && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1">
                    <LuMapPin size={12} className="text-pink-400" />
                    {location}
                  </span>
                </>
              )}
            </div>

            {/* Intent badge + credits */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {intentLabel && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold">
                  <LuHeart size={11} />
                  {intentLabel}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <LuSparkles size={11} />
                {creditsBalance} credit{creditsBalance !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ── Bio ────────────────────────────────────────────────────────── */}
        {(profileData?.bio || profileData?.about_me) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">About Me</p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {profileData.bio || profileData.about_me}
            </p>
          </div>
        )}

        {/* ── Looking For ────────────────────────────────────────────────── */}
        {profileData?.looking_for && (
          <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 px-5 py-4">
            <p className="text-xs font-bold text-pink-400/70 uppercase tracking-wider mb-2">Looking For</p>
            <p className="text-sm text-pink-200 italic leading-relaxed">
              "{profileData.looking_for}"
            </p>
          </div>
        )}

        {/* ── Stats grid ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Profile Details</p>
          <div className="grid grid-cols-2 gap-2.5">
            <StatPill icon={LuGlobe} label="Tribe / Ethnicity" value={profileData?.tribe} iconColor="text-sky-400" />
            <StatPill icon={LuBriefcase} label="Occupation" value={profileData?.occupation} iconColor="text-amber-400" />
            <StatPill
              icon={LuSparkles}
              label="Body Type"
              value={profileData?.body_type?.replace(/_/g, ' ')}
              iconColor="text-purple-400"
            />
            <StatPill icon={LuRuler} label="Height" value={profileData?.height} iconColor="text-teal-400" />
            <StatPill icon={LuUser} label="Orientation" value={profileData?.orientation} iconColor="text-pink-400" />
            {intentLabel && (
              <StatPill icon={LuHeart} label="Intent" value={intentLabel} iconColor="text-rose-400" />
            )}
          </div>
        </div>

        {/* ── Interests ──────────────────────────────────────────────────── */}
        {profileData?.interests?.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Interests</p>
            <div className="flex flex-wrap gap-2">
              {profileData.interests.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Contact Handles (private info) ─────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Handles</p>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <LuShieldCheck size={12} />
              Private to others
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/8">
              <LuMessageCircle size={15} className="text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">WhatsApp</p>
                <p className="text-sm text-white font-medium mt-0.5 truncate">
                  {profileData?.whatsapp_number || (
                    <span className="text-slate-500 italic">Not set</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/8">
              <LuGhost size={15} className="text-yellow-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Snapchat</p>
                <p className="text-sm text-white font-medium mt-0.5 truncate">
                  {profileData?.snapchat_handle || (
                    <span className="text-slate-500 italic">Not set</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick nav ──────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/feed')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-all cursor-pointer"
        >
          <LuLayoutGrid size={15} />
          Browse the Feed
        </button>
      </div>

      {/* ══════════════ EDIT PROFILE MODAL ══════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setShowEditModal(false)}
          />

          <div className="relative bg-slate-900 border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-2xl max-w-lg w-full max-h-[94dvh] flex flex-col shadow-2xl z-10 overflow-hidden">
            {/* drag handle (mobile) */}
            <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur-md">
              <h2 className="text-base font-bold text-white">Edit Profile</h2>
              <button
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                onClick={() => setShowEditModal(false)}
              >
                <LuX size={16} />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-5 mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs shrink-0">
                <LuCircleAlert size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain">

              {/* ── Photo upload ── */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-950/60 border border-white/10">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : profileData?.photo_url ? (
                      <img src={profileData.photo_url} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <InitialsAvatar name={editName || displayName} size="md" />
                    )}
                  </div>
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <LuCamera size={13} />
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {photoFile ? photoFile.name : 'PNG, JPG or WebP · max 5 MB'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/8 pt-3 space-y-3.5">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Basic Info</p>

                <EditField label="Full Name *">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className={INPUT_CLS}
                  />
                </EditField>

                <EditField label="Bio / About Me">
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    placeholder="Tell daters about yourself…"
                    className="w-full p-3 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all hover:border-white/20 placeholder:text-slate-500"
                  />
                </EditField>

                <EditField label="Looking For">
                  <input
                    type="text"
                    value={editLookingFor}
                    onChange={(e) => setEditLookingFor(e.target.value)}
                    placeholder="e.g. Someone kind, ambitious, funny…"
                    className={INPUT_CLS}
                  />
                </EditField>
              </div>

              <div className="border-t border-white/8 pt-3 space-y-3.5">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Dating Specs</p>

                <div className="grid grid-cols-2 gap-3">
                  <EditField label="State">
                    <div className="relative">
                      <select
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s} className="bg-slate-900">{s}</option>
                        ))}
                      </select>
                      <LuChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </EditField>

                  <EditField label="City / Area">
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="e.g. Lekki, Ikeja"
                      className={INPUT_CLS}
                    />
                  </EditField>

                  <EditField label="Intent">
                    <div className="relative">
                      <select
                        value={editIntent}
                        onChange={(e) => setEditIntent(e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="">Select Intent</option>
                        {INTENTS.map((i) => (
                          <option key={i.value} value={i.value} className="bg-slate-900">{i.label}</option>
                        ))}
                      </select>
                      <LuChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </EditField>

                  <EditField label="Orientation">
                    <div className="relative">
                      <select
                        value={editOrientation}
                        onChange={(e) => setEditOrientation(e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="">Select</option>
                        <option value="straight" className="bg-slate-900">Straight</option>
                        <option value="gay" className="bg-slate-900">Gay</option>
                        <option value="bi" className="bg-slate-900">Bisexual</option>
                        <option value="other" className="bg-slate-900">Other</option>
                      </select>
                      <LuChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </EditField>

                  <EditField label="Body Type">
                    <div className="relative">
                      <select
                        value={editBodyType}
                        onChange={(e) => setEditBodyType(e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="">Select</option>
                        {BODY_TYPES.map((bt) => (
                          <option key={bt.value} value={bt.value} className="bg-slate-900">{bt.label}</option>
                        ))}
                      </select>
                      <LuChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </EditField>

                  <EditField label="Height">
                    <input
                      type="text"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      placeholder="e.g. 5ft 9in"
                      className={INPUT_CLS}
                    />
                  </EditField>

                  <EditField label="Tribe / Ethnicity">
                    <input
                      type="text"
                      value={editTribe}
                      onChange={(e) => setEditTribe(e.target.value)}
                      placeholder="e.g. Yoruba, Igbo, Hausa"
                      className={INPUT_CLS}
                    />
                  </EditField>

                  <EditField label="Occupation">
                    <input
                      type="text"
                      value={editOccupation}
                      onChange={(e) => setEditOccupation(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className={INPUT_CLS}
                    />
                  </EditField>
                </div>

                <EditField label="Interests (comma separated)">
                  <input
                    type="text"
                    value={editInterests}
                    onChange={(e) => setEditInterests(e.target.value)}
                    placeholder="e.g. Tech, Travel, Music, Football"
                    className={INPUT_CLS}
                  />
                </EditField>
              </div>

              <div className="border-t border-white/8 pt-3 space-y-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Contact Handles</p>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <LuShieldCheck size={12} className="text-emerald-400" />
                    Private until unlocked
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <EditField label="WhatsApp Number *">
                    <div className="relative">
                      <LuMessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                      <input
                        type="tel"
                        value={editWhatsapp}
                        onChange={(e) => setEditWhatsapp(e.target.value)}
                        placeholder="+2348012345678"
                        className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20 placeholder:text-slate-500"
                      />
                    </div>
                  </EditField>

                  <EditField label="Snapchat Handle">
                    <div className="relative">
                      <LuGhost size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none" />
                      <input
                        type="text"
                        value={editSnapchat}
                        onChange={(e) => setEditSnapchat(e.target.value)}
                        placeholder="@yourhandle"
                        className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20 placeholder:text-slate-500"
                      />
                    </div>
                  </EditField>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md flex gap-3">
              <button
                className="flex-1 bg-white/5 border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                onClick={handleSaveProfile}
              >
                {saving ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
