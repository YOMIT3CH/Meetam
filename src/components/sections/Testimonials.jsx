import { TESTIMONIALS } from '../../lib/constants.js';

const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= rating ? (
      <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 001.51.34h.22l.48 1.48a1 1 0 001.282.348l.747-1.437a1 1 0 00-.31-1.42l-1.13-.693a1 1 0 00-1.177 0l-1.13.693a1 1 0 00-.31 1.42l.747 1.437a1 1 0 001.282.348l.48 1.48h.22a1 1 0 001.51-.34l1.07-3.292c.3-.921-.752-1.834-1.603-1.145l-2.37 1.444c-1.123.68-1.794 1.931-1.212 2.989l.559 3.063a1 1 0 001 .949h2a1 1 0 001-.949l.559-3.063c.582-1.058-.094-2.309-1.212-2.989l-2.37-1.444c-.85-.302-1.903.224-1.603 1.145z"/></svg>
    ) : (
      <svg key={i} className="w-4 h-4 text-slate-600 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 001.51.34h.22l.48 1.48a1 1 0 001.282.348l.747-1.437a1 1 0 00-.31-1.42l-1.13-.693a1 1 0 00-1.177 0l-1.13.693a1 1 0 00-.31 1.42l.747 1.437a1 1 0 001.282.348l.48 1.48h.22a1 1 0 001.51-.34l1.07-3.292c.3-.921-.752-1.834-1.603-1.145l-2.37 1.444c-1.123.68-1.794 1.931-1.212 2.989l.559 3.063a1 1 0 001 .949h2a1 1 0 001-.949l.559-3.063c.582-1.058-.094-2.309-1.212-2.989l-2.37-1.444c-.85-.302-1.903.224-1.603 1.145z"/></svg>
    ));
  }
  return <div className="flex gap-1">{stars}</div>;
};

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">What Our Members Say</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Real connections, real stories from singles across Nigeria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass-card p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.city}</p>
                  </div>
                </div>
                <div className="flex items-end gap-1 mb-3">
                  <StarRating rating={t.rating} />
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

