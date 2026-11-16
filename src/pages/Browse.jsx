import { LuShield, LuUsers, LuMapPin, LuFilter, LuSearch } from 'react-icons/lu';

export default function Browse() {
  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">M</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">MeetAm</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-300 hover:text-white transition-colors">
              <LuShield size={20} strokeWidth={1.5} />
            </button>
            <button className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all">
              Post Intro
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-20 px-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">Discover Singles</h1>
              <p className="text-slate-400">Find meaningful connections across Nigeria</p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 md:w-80">
                <LuSearch size={18} className="absolute left-3 top-3 text-slate-500" />
                <input type="text" placeholder="Search by name, city, or keyword..." className="input-field pl-10" />
              </div>
              <button className="bg-white/5 border border-white/10 text-white px-5 py-3 rounded-xl hover:bg-white/10 transition-all">
                <LuFilter size={18} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
            <button className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs font-medium hover:bg-emerald-500/20 transition-all">
              All States
            </button>
            <button className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">
              Lagos
            </button>
            <button className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">
              Abuja
            </button>
            <button className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">
              Serious Relationship
            </button>
            <button className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">
              Marriage
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 hover:border-emerald-500/50 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Adeoluwa O.</h3>
                    <p className="text-sm text-slate-400">28 • Lagos, Nigeria</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-medium">Serious</span>
                </div>
                <div className="space-y-2 mb-6 text-sm text-slate-300">
                  <p><LuMapPin size={14} className="inline mr-1" /> Ikeja, Lagos</p>
                  <p><LuUsers size={14} className="inline mr-1" /> Yoruba • Christian</p>
                  <p className="flex items-center gap-1"><LuShield size={14} className="inline mr-1" /> Verified</p>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Software engineer passionate about tech, travel, and meaningful conversations. Looking for someone intentional about building a future together.
                </p>
                <button className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white w-full py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}