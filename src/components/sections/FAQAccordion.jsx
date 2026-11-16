import { useState } from 'react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { FAQS } from '../../lib/constants.js';

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="safety" className="py-20 bg-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Safety & FAQ</h2>
          <p className="text-slate-400">
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
                  className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors"
                >
                  <h3 className="text-white font-semibold text-sm">{faq.question}</h3>
                  {isOpen ? <LuChevronUp size={16} strokeWidth={2} className="text-slate-400" /> : <LuChevronDown size={16} strokeWidth={2} className="text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-300 text-sm leading-relaxed">{faq.answer}</p>
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