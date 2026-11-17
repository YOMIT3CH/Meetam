import { useState } from 'react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { FAQS } from '../../lib/constants.js';

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="safety" className="py-16 sm:py-20 bg-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">Safety & FAQ</h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Everything you need to know about dating with intention on MeetAm.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 text-left transition-colors cursor-pointer"
                >
                  <h3 className="text-white font-semibold text-xs sm:text-sm pr-2">{faq.question}</h3>
                  {isOpen ? <LuChevronUp size={16} strokeWidth={2} className="text-slate-400 shrink-0" /> : <LuChevronDown size={16} strokeWidth={2} className="text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4">
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}