import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import supabase from '../lib/supabase'
import { useMeetAm } from '../context/MeetAmContext'
import AppNavbar from '../components/AppNavbar'
import AnnouncementBanner from '../components/AnnouncementBanner'
import CreditTopUpModal from '../components/CreditTopUpModal'
import { NIGERIAN_STATES, INTENTS, BODY_TYPES, INTENT_LOOKUP } from '../lib/data'
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
  LuCreditCard,
  LuLockOpen,
  LuZap,
  LuRocket,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuTrash2,
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
  const idx = (name.charCodeAt(0) || 0) % gradients.length

  const sizeClass =
    size === 'xl'
      ? 'w-24 h-24 text-3xl'
      : size === 'lg'
        ? 'w-16 h-16 text-xl'
        : size === 'md'
          ? 'w-14 h-14 text-lg'
          : 'w-10 h-10 text-base'

  return (
    <div
      className={`${sizeClass} rounded-2xl bg-gradient-to-br ${gradients[idx]} flex items-center justify-center font-bold text-white shrink-0 select-none`}
    >
      {initials || <LuUser size={22} />}
    </div>
  )
}

// ── Stat summary card ─────────────────────────────────────────────────────────
function StatCard({ icon, label, value, highlight, action }) {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-2 ${highlight ? 'border-amber-400/30 bg-amber-500/5' : 'border-white/10 bg-white/[0.03]'
        }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold leading-none ${highlight ? 'text-amber-300' : 'text-white'}`}>
        {value}
      </p>
      {action && <div className="mt-0.5">{action}</div>}
    </div>
  )
}

// ── A single detail pill ──────────────────────────────────────────────────────
function DetailPill({ icon: Icon, label, value, iconColor = 'text-slate-400' }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/8">
      <Icon size={15} className={`${iconColor} shrink-0 mt-0.5`} />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold truncate">
          {label}
        </p>
        <p className="text-sm text-white font-medium mt-0.5 capitalize leading-snug break-words">
          {value || <span className="text-slate-500 italic font-normal">Not set</span>}
        </p>
      </div>
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">{children}</p>
  )
}

// ── Edit modal field wrapper ──────────────────────────────────────────────────
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

const IC = 'w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20 placeholder:text-slate-500'
const SC = 'w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all hover:border-white/20 appearance-none'

// ─────────────────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate()
  const {
    user,
    loading: authLoading,
    creditsBalance,
    unlockedContacts,
    boostMyProfile,
    refreshCredits,
    showTopUp,
    setShowTopUp,
  } = useMeetAm()

  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Boost state
  const [boosting, setBoosting] = useState(false)
  const [boostMsg, setBoostMsg] = useState(null)

  // Photo upload
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const photoInputRef = useRef(null)

  // Edit form
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editLookingFor, setEditLookingFor] = useState('')
  const [editInterests, setEditInterests] = useState('')
  const [editOrientation, setEditOrientation] = useState('')
  const [editTribe, setEditTribe] = useState('')
  const [editReligion, setEditReligion] = useState('')
  const [editOccupation, setEditOccupation] = useState('')
  const [editBodyType, setEditBodyType] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editState, setEditState] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editIntent, setEditIntent] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editSnapchat, setEditSnapchat] = useState('')
  const [editShowPhoto, setEditShowPhoto] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true })
  }, [authLoading, user, navigate])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchProfile = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .maybeSingle()
      setProfileData(data || null)
      if (data) prefillEdit(data)
    } catch (err) {
      setError(err.message)
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
    setEditReligion(d.religion || '')
    setEditOccupation(d.occupation || '')
    setEditBodyType(d.body_type || '')
    setEditHeight(d.height || '')
    setEditState(d.state || d.location_state || '')
    setEditCity(d.area || d.location_city || '')
    setEditIntent(d.intent || '')
    setEditWhatsapp(d.whatsapp_number || '')
    setEditSnapchat(d.snapchat_handle || '')
    setEditShowPhoto(d.show_photo !== false)
    setRemovePhoto(false)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5 MB')
      return
    }
    setError('')
    setRemovePhoto(false)
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaveSuccess(false)
    setError('')

    try {
      let finalPhotoUrl = removePhoto ? null : (profileData?.photo_url || null)

        if (photoFile && !removePhoto) {
          const ext = photoFile.name.split('.').pop()
          const path = `avatars/${user.id}_${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, photoFile, { upsert: true })
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
            finalPhotoUrl = urlData?.publicUrl || finalPhotoUrl
          }
        }

        const interestsArray = editInterests
          ? editInterests.split(',').map((s) => s.trim()).filter(Boolean)
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
          religion: editReligion,
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
          show_photo: editShowPhoto,
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
            id: user.id,
            user_id: user.id,
          })
          if (insertErr) throw insertErr
        }

        setSaveSuccess(true)
        await fetchProfile()
        setTimeout(() => {
          setSaveSuccess(false)
          setShowEditModal(false)
          showToast('Profile saved!')
        }, 900)
      } catch (err) {
        setError(err.message || 'Failed to save profile')
      } finally {
        setSaving(false)
      }
    }

  const handleBoost = async () => {
      if (!profileData) return
      setBoosting(true)
      setBoostMsg(null)
      const result = await boostMyProfile(profileData.id)
      setBoosting(false)
      if (result?.ok) {
        setBoostMsg({ ok: true, text: 'Profile boosted for 24 hours! 🚀' })
        refreshCredits()
        await fetchProfile()
      } else if (result?.error === 'INSUFFICIENT_CREDITS') {
        setShowTopUp(true)
      } else {
        setBoostMsg({ ok: false, text: result?.error || 'Boost failed.' })
      }
    }

    const handleLogout = async () => {
      await supabase.auth.signOut()
      navigate('/login')
    }

    // ── Loading / unauthenticated ─────────────────────────────────────────────
    if (authLoading || loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full" />
            <p className="text-slate-400 text-sm">Loading…</p>
          </div>
        </div>
      )
    }

    const displayName =
      profileData?.full_name ||
      profileData?.display_name ||
      user?.email?.split('@')[0] ||
      'You'

    const location = [
      profileData?.area || profileData?.location_city,
      profileData?.state || profileData?.location_state,
    ]
      .filter(Boolean)
      .join(', ')

    const intentLabel =
      INTENT_LOOKUP?.[profileData?.intent] ||
      INTENTS.find((i) => i.value === profileData?.intent)?.label ||
      profileData?.intent

    const isBoosted =
      profileData?.is_featured &&
      profileData?.featured_until &&
      new Date(profileData.featured_until) > new Date()

    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <AppNavbar />
        <AnnouncementBanner />

        {/* Top-up modal */}
        <CreditTopUpModal
          open={showTopUp}
          onClose={() => setShowTopUp(false)}
          onCompleted={() => { setShowTopUp(false); refreshCredits() }}
        />

        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-medium whitespace-nowrap ${toast.type === 'error'
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              }`}
          >
            {toast.type === 'error' ? <LuCircleAlert size={16} /> : <LuCircleCheck size={16} />}
            {toast.msg}
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 space-y-4">

          {/* ── HERO CARD ──────────────────────────────────────────────────── */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-pink-500/20 pointer-events-none" />

            <div className="relative px-5 pt-7 pb-5">
              {/* Avatar + action buttons */}
              <div className="flex items-end justify-between gap-3 mb-4">
                <div className="relative">
                  {profileData?.photo_url ? (
                  <div className="relative">
                    <img
                      src={profileData.photo_url}
                      alt={displayName}
                      className={`w-24 h-24 rounded-2xl object-cover border-2 shadow-xl ${
                        profileData?.show_photo === false
                          ? 'border-amber-400/50 opacity-90'
                          : 'border-white/20'
                      }`}
                    />
                    {profileData?.show_photo === false && (
                      <span className="absolute -bottom-2 -right-1 bg-slate-900 border border-amber-400/40 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                        <LuEyeOff size={10} />
                        Hidden on feed
                      </span>
                    )}
                  </div>
                  ) : (
                    <div className="border-2 border-white/20 shadow-xl rounded-2xl overflow-hidden">
                      <InitialsAvatar name={displayName} size="xl" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-1 flex-wrap justify-end">
                  <button
                    onClick={() => { prefillEdit(profileData || {}); setShowEditModal(true) }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LuPencil size={13} />
                    Edit Profile
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

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {intentLabel && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold">
                    <LuHeart size={11} />
                    {intentLabel}
                  </span>
                )}
                {isBoosted && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                    <LuZap size={11} />
                    Boosted
                  </span>
                )}
                {profileData?.photo_url && profileData?.show_photo === false && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                    <LuEyeOff size={11} />
                    Photo Hidden from Feed
                  </span>
                )}
                {profileData?.photo_url && profileData?.show_photo !== false && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    <LuEye size={11} />
                    Photo Visible
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── STATS ROW ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<LuCreditCard size={16} className="text-emerald-400" />}
              label="Credits"
              value={creditsBalance}
              action={
                <button
                  onClick={() => setShowTopUp(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium cursor-pointer"
                >
                  Top up →
                </button>
              }
            />
            <StatCard
              icon={<LuLockOpen size={16} className="text-pink-400" />}
              label="Unlocked"
              value={unlockedContacts.length}
            />
            <StatCard
              icon={<LuZap size={16} className="text-amber-400" />}
              label="Boost"
              value={isBoosted ? 'Active' : 'Off'}
              highlight={isBoosted}
              action={
                !isBoosted && (
                  <button
                    onClick={handleBoost}
                    disabled={boosting || creditsBalance < 1}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40 font-medium cursor-pointer"
                  >
                    {boosting ? 'Boosting…' : '1 credit →'}
                  </button>
                )
              }
            />
          </div>

          {/* Boost feedback */}
          {boostMsg && (
            <div
              className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${boostMsg.ok
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}
            >
              {boostMsg.ok ? <LuRocket size={15} /> : <LuCircleAlert size={15} />}
              {boostMsg.text}
            </div>
          )}

          {/* ── BIO ──────────────────────────────────────────────────────────── */}
          {(profileData?.bio || profileData?.about_me) && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <SectionLabel>About Me</SectionLabel>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {profileData.bio || profileData.about_me}
              </p>
            </div>
          )}

          {/* ── LOOKING FOR ──────────────────────────────────────────────────── */}
          {profileData?.looking_for && (
            <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 px-5 py-4">
              <SectionLabel>Looking For</SectionLabel>
              <p className="text-sm text-pink-200 italic leading-relaxed">
                "{profileData.looking_for}"
              </p>
            </div>
          )}

          {/* ── PROFILE DETAILS ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <SectionLabel>Profile Details</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              <DetailPill icon={LuGlobe} label="Tribe" value={profileData?.tribe} iconColor="text-sky-400" />
              <DetailPill icon={LuBriefcase} label="Occupation" value={profileData?.occupation} iconColor="text-amber-400" />
              <DetailPill
                icon={LuSparkles}
                label="Body Type"
                value={profileData?.body_type?.replace(/_/g, ' ')}
                iconColor="text-purple-400"
              />
              <DetailPill icon={LuRuler} label="Height" value={profileData?.height} iconColor="text-teal-400" />
              <DetailPill icon={LuUser} label="Orientation" value={profileData?.orientation} iconColor="text-pink-400" />
              {profileData?.religion && (
                <DetailPill icon={LuGlobe} label="Religion" value={profileData.religion} iconColor="text-indigo-400" />
              )}
            </div>
          </div>

          {/* ── INTERESTS ────────────────────────────────────────────────────── */}
          {profileData?.interests?.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <SectionLabel>Interests</SectionLabel>
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

          {/* ── CONTACT HANDLES ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Contact Handles</SectionLabel>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium -mt-3">
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
                    {profileData?.whatsapp_number || <span className="text-slate-500 italic font-normal">Not set</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/8">
                <LuGhost size={15} className="text-yellow-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Snapchat</p>
                  <p className="text-sm text-white font-medium mt-0.5 truncate">
                    {profileData?.snapchat_handle || <span className="text-slate-500 italic font-normal">Not set</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── UNLOCKED CONTACTS ────────────────────────────────────────────── */}
          {unlockedContacts.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <SectionLabel>Unlocked Contacts ({unlockedContacts.length})</SectionLabel>
              <div className="space-y-2.5">
                {unlockedContacts.map((c) => {
                  const name = c.profiles?.display_name || c.profiles?.full_name || 'Member'
                  const wa = c.profiles?.whatsapp_number || c.whatsapp_number
                  const snap = c.profiles?.snapchat_handle || c.snapchat_handle

                  return (
                    <div
                      key={c.profile_id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/8 bg-slate-900/50 hover:bg-slate-900 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-white text-sm">{name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Unlocked {new Date(c.unlocked_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {wa && (
                          <a
                            href={`https://wa.me/${wa.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-semibold hover:bg-green-500 hover:text-white transition-colors"
                          >
                            <LuMessageCircle size={13} />
                            {wa}
                          </a>
                        )}
                        {snap && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-semibold">
                            <LuGhost size={13} />
                            {snap.startsWith('@') ? snap : `@${snap}`}
                          </span>
                        )}
                        {!wa && !snap && (
                          <span className="text-xs text-slate-500 italic">No handles set</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── QUICK NAV ────────────────────────────────────────────────────── */}
          <button
            onClick={() => navigate('/feed')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-all cursor-pointer"
          >
            <LuLayoutGrid size={15} />
            Browse the Feed
          </button>
        </div>

        {/* ══════════════════════ EDIT PROFILE MODAL ══════════════════════════ */}
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setShowEditModal(false)} />

            <div className="relative bg-slate-900 border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-2xl max-w-lg w-full max-h-[94dvh] flex flex-col shadow-2xl z-10 overflow-hidden">
              {/* Mobile drag handle */}
              <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur-md">
                <h2 className="text-base font-bold text-white">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <LuX size={16} />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-5 mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs shrink-0">
                  <LuCircleAlert size={14} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain">

                {/* Photo */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Profile Picture
                  </label>
                  <span className="text-[11px] text-slate-500">JPG, PNG or WebP · max 5 MB</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/15 shadow-inner">
                    {!removePhoto && (photoPreview || profileData?.photo_url) ? (
                      <img
                        src={photoPreview || profileData.photo_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <InitialsAvatar name={editName || displayName} size="lg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <LuCamera size={13} />
                        {!removePhoto && (photoPreview || profileData?.photo_url) ? 'Change Photo' : 'Upload Photo'}
                      </button>

                      {!removePhoto && (photoPreview || profileData?.photo_url) && (
                        <button
                          type="button"
                          onClick={() => {
                            setRemovePhoto(true)
                            setPhotoFile(null)
                            setPhotoPreview(null)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <LuTrash2 size={12} />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {photoFile
                        ? photoFile.name
                        : removePhoto
                        ? 'Photo marked for removal (avatar initials will be shown).'
                        : profileData?.photo_url
                        ? 'Photo is currently set.'
                        : 'No picture uploaded yet.'}
                    </p>
                  </div>
                </div>

                {/* Visibility Option Toggle */}
                <div className="pt-3 border-t border-white/8 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {editShowPhoto ? (
                        <LuEye size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <LuEyeOff size={14} className="text-amber-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-slate-200">
                        Display picture on feed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {editShowPhoto
                        ? 'Your photo is visible to daters browsing the feed.'
                        : 'Personality-first: only your initials avatar will be shown to others.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={editShowPhoto}
                    onClick={() => setEditShowPhoto((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      editShowPhoto ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        editShowPhoto ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="border-t border-white/8 pt-3 space-y-3.5">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Basic Info</p>

                <EditField label="Full Name *">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" className={IC} />
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
                  <input type="text" value={editLookingFor} onChange={(e) => setEditLookingFor(e.target.value)} placeholder="e.g. Someone kind, ambitious…" className={IC} />
                </EditField>
              </div>

              {/* Dating Specs */}
              <div className="border-t border-white/8 pt-3 space-y-3.5">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Dating Specs</p>

                <div className="grid grid-cols-2 gap-3">
                  <EditField label="State">
                    <div className="relative">
                      <select value={editState} onChange={(e) => setEditState(e.target.value)} className={SC}>
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map((s) => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                      </select>
                      <LuChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </EditField>

                  <EditField label="City / Area">
                    <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="e.g. Lekki" className={IC} />
                  </EditField>

                  <EditField label="Intent">
                    <div className="relative">
                      <select value={editIntent} onChange={(e) => setEditIntent(e.target.value)} className={SC}>
                        <option value="">Select Intent</option>
                        {INTENTS.map((i) => <option key={i.value} value={i.value} className="bg-slate-900">{i.label}</option>)}
                      </select>
                      <LuChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </EditField>

                  <EditField label="Orientation">
                    <div className="relative">
                      <select value={editOrientation} onChange={(e) => setEditOrientation(e.target.value)} className={SC}>
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
                      <select value={editBodyType} onChange={(e) => setEditBodyType(e.target.value)} className={SC}>
                        <option value="">Select</option>
                        {BODY_TYPES.map((bt) => <option key={bt.value} value={bt.value} className="bg-slate-900">{bt.label}</option>)}
                      </select>
                      <LuChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </EditField>

                  <EditField label="Height">
                    <input type="text" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} placeholder="e.g. 5ft 9in" className={IC} />
                  </EditField>

                  <EditField label="Tribe / Ethnicity">
                    <input type="text" value={editTribe} onChange={(e) => setEditTribe(e.target.value)} placeholder="e.g. Yoruba, Igbo" className={IC} />
                  </EditField>

                  <EditField label="Religion">
                    <input type="text" value={editReligion} onChange={(e) => setEditReligion(e.target.value)} placeholder="e.g. Christian" className={IC} />
                  </EditField>

                  <EditField label="Occupation">
                    <input type="text" value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)} placeholder="e.g. Software Engineer" className={IC} />
                  </EditField>
                </div>

                <EditField label="Interests (comma separated)">
                  <input type="text" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} placeholder="e.g. Tech, Travel, Music" className={IC} />
                </EditField>
              </div>

              {/* Contact Handles */}
              <div className="border-t border-white/8 pt-3 space-y-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Contact Handles</p>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <LuShieldCheck size={12} className="text-emerald-400" />
                    Private until unlocked
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <EditField label="WhatsApp *">
                    <div className="relative">
                      <LuMessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                      <input type="tel" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} placeholder="+2348012345678" className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20 placeholder:text-slate-500" />
                    </div>
                  </EditField>
                  <EditField label="Snapchat">
                    <div className="relative">
                      <LuGhost size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none" />
                      <input type="text" value={editSnapchat} onChange={(e) => setEditSnapchat(e.target.value)} placeholder="@yourhandle" className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-950/70 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20 placeholder:text-slate-500" />
                    </div>
                  </EditField>
                </div>
              </div>
            </div>

            {/* Footer */}
                      <div className="shrink-0 px-5 py-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md flex gap-3">
                        <button
                          onClick={() => setShowEditModal(false)}
                          className="flex-1 bg-white/5 border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={saving}
                          onClick={handleSave}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                          ) : saveSuccess ? (
                            <><LuCheck size={15} /> Saved!</>
                          ) : (
                            'Save Profile'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
      )}
                </div>
                )
}
