import { useState, useRef, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useMeetAm } from '../context/MeetAmContext';
import { BANK_DETAILS, SITE_NAME } from '../lib/constants';
import { PAYSTACK_BUNDLES, SUPPORT_WHATSAPP } from '../lib/data';
import {
  LuCreditCard,
  LuBuilding,
  LuCopy,
  LuCheck,
  LuUpload,
  LuImage,
  LuX,
  LuCircleAlert,
  LuCircleCheck,
  LuClock,
  LuArrowRight,
  LuArrowLeft,
  LuMessageCircle,
} from 'react-icons/lu';

export default function CreditTopUpModal({ open, onClose, onCompleted }) {
  const { user, bankDetails: ctxBankDetails } = useMeetAm();
  const fileInputRef = useRef(null);

  // Dynamic live bank details from context, cache, or database
  const [bankInfo, setBankInfo] = useState(() => {
    try {
      const cached = localStorage.getItem('meetam_bank_details');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      bankName: import.meta.env.VITE_BANK_NAME || BANK_DETAILS.bankName,
      accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || BANK_DETAILS.accountName,
      accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER || BANK_DETAILS.accountNumber,
      supportWhatsapp: import.meta.env.VITE_SUPPORT_WHATSAPP || SUPPORT_WHATSAPP,
    };
  });

  // Sync with context updates
  useEffect(() => {
    if (ctxBankDetails) {
      setBankInfo(ctxBankDetails);
    }
  }, [ctxBankDetails]);

  // When modal is opened, fetch fresh bank details from app_settings
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'bank_details')
          .maybeSingle();

        if (!cancelled && data?.value) {
          setBankInfo((prev) => {
            const next = {
              bankName: data.value.bankName || prev.bankName,
              accountName: data.value.accountName || prev.accountName,
              accountNumber: data.value.accountNumber || prev.accountNumber,
              supportWhatsapp: data.value.supportWhatsapp || prev.supportWhatsapp,
            };
            try {
              localStorage.setItem('meetam_bank_details', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      } catch (e) {
        // use cached/fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const [selectedBundle, setSelectedBundle] = useState(PAYSTACK_BUNDLES[0]);
  const [activeStep, setActiveStep] = useState(1); // 1: Package & Bank Details, 2: Receipt & Sender Info, 3: Success

  // Form fields
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedTx, setSubmittedTx] = useState(null);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        resetModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  const bankName = bankInfo.bankName || import.meta.env.VITE_BANK_NAME || BANK_DETAILS.bankName;
  const accountName = bankInfo.accountName || import.meta.env.VITE_BANK_ACCOUNT_NAME || BANK_DETAILS.accountName;
  const accountNumber = bankInfo.accountNumber || import.meta.env.VITE_BANK_ACCOUNT_NUMBER || BANK_DETAILS.accountNumber;
  const supportPhone = bankInfo.supportWhatsapp || import.meta.env.VITE_SUPPORT_WHATSAPP || SUPPORT_WHATSAPP;

  const handleCopyAccount = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Receipt file size must be less than 5MB');
      return;
    }

    setErrorMessage('');
    setReceiptFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const removeFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProceedToProof = () => {
    setErrorMessage('');
    setActiveStep(2);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('You must be logged in to submit payment proof');
      return;
    }

    if (!senderName.trim()) {
      setErrorMessage('Please enter the sender account name');
      return;
    }

    if (!senderPhone.trim()) {
      setErrorMessage('Please enter your phone / WhatsApp number');
      return;
    }

    if (!receiptFile && !receiptPreview) {
      setErrorMessage('Please attach your payment receipt screenshot or document');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let receiptUrl = receiptPreview || null;

      // Try uploading to Supabase Storage 'receipts' bucket if configured
      if (receiptFile) {
        try {
          const fileExt = receiptFile.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, receiptFile, { upsert: true });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('receipts')
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              receiptUrl = publicUrlData.publicUrl;
            }
          }
        } catch {
          // Fallback to base64 data URL
        }
      }

      const txRef = 'MANUAL-' + Date.now().toString().slice(-8);

      const { data: txRecord, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'topup',
          credits: selectedBundle.credits,
          amount_ngn: selectedBundle.amountNgn,
          status: 'pending',
          payment_method: 'bank_transfer',
          paystack_ref: txRef,
          metadata: {
            sender_name: senderName.trim(),
            sender_phone: senderPhone.trim(),
            receipt_url: receiptUrl,
            receipt_filename: receiptFile?.name || 'receipt',
            transfer_notes: transferNotes.trim(),
            bundle_credits: selectedBundle.credits,
            amount_ngn: selectedBundle.amountNgn,
            submitted_at: new Date().toISOString(),
          },
        })
        .select()
        .maybeSingle();

      if (txError) throw txError;

      setSubmittedTx(txRecord || { paystack_ref: txRef });
      setActiveStep(3);
      if (onCompleted) onCompleted();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setActiveStep(1);
    setSenderName('');
    setSenderPhone('');
    setTransferNotes('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setErrorMessage('');
    setSubmittedTx(null);
    onClose();
  };

  const getWhatsAppMessage = () => {
    const ref = submittedTx?.paystack_ref || 'PENDING';
    const text = `Hello ${SITE_NAME} Support,\n\nI just made a manual bank transfer of ₦${selectedBundle.amountNgn.toLocaleString()} for ${selectedBundle.credits} credit(s).\n\n• Sender Name: ${senderName}\n• Reference: ${ref}\n• User Email: ${user?.email || 'N/A'}\n\nPlease verify and credit my wallet. Thank you!`;
    return encodeURIComponent(text);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Dimmed & Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={resetModal}
      />

      {/* Responsive Sheet / Dialog Card */}
      <div className="relative w-full sm:max-w-lg bg-slate-900 border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] z-10 overflow-hidden text-white animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile Pull Indicator Bar */}
        <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Sticky Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <LuCreditCard size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Top Up Credits</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Manual Bank Transfer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStep !== 3 && (
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 bg-white/5 border border-white/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                <span className={activeStep === 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>1. Bank</span>
                <span className="text-slate-600">&rarr;</span>
                <span className={activeStep === 2 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>2. Proof</span>
              </div>
            )}
            <button
              onClick={resetModal}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <LuX size={18} />
            </button>
          </div>
        </div>

        {/* ================= STEP 1: SELECT BUNDLE & VIEW BANK DETAILS ================= */}
        {activeStep === 1 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Step 1 Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 overscroll-contain">
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
                  <LuCircleAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Credit Packages */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  1. Choose Credit Package
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {PAYSTACK_BUNDLES.map((b) => {
                    const isSelected = selectedBundle.credits === b.credits;
                    return (
                      <button
                        key={b.credits}
                        type="button"
                        onClick={() => setSelectedBundle(b)}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/15 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/40'
                            : 'border-white/10 bg-slate-950/60 hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-white">
                            {b.credits} {b.credits === 1 ? 'Credit' : 'Credits'}
                          </span>
                          {isSelected && <LuCheck size={16} className="text-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-400 font-semibold mt-1">
                          ₦{b.amountNgn.toLocaleString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Bank Details Card */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    2. Company Bank Details
                  </label>
                  <span className="text-[11px] sm:text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Pay ₦{selectedBundle.amountNgn.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm pb-2 border-b border-white/5">
                    <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                      <LuBuilding size={14} className="text-slate-400" /> Bank Name
                    </span>
                    <span className="font-semibold text-white text-right">{bankName}</span>
                  </div>

                  <div className="flex items-start justify-between text-xs sm:text-sm pb-2 border-b border-white/5 gap-2">
                    <span className="text-slate-400 shrink-0">Account Name</span>
                    <span className="font-semibold text-white text-right break-words max-w-[210px]">
                      {accountName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Account Number</span>
                      <span className="font-mono text-base sm:text-lg font-extrabold text-emerald-400 tracking-wider">
                        {accountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <LuCheck size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <LuCopy size={14} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Step 1 Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md flex items-center gap-2.5">
              <button
                type="button"
                onClick={resetModal}
                className="px-3.5 sm:px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToProof}
                className="flex-1 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <span>I've Paid &bull; Attach Receipt</span>
                <LuArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: ATTACH RECEIPT FORM ================= */}
        {activeStep === 2 && (
          <form onSubmit={handleSubmitProof} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Step 2 Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 overscroll-contain">
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
                  <LuCircleAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selected package reminder pill */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] sm:text-[11px]">Selected Package</span>
                  <span className="font-bold text-white text-xs sm:text-sm">
                    {selectedBundle.credits} Credits &bull; ₦{selectedBundle.amountNgn.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 text-xs cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sender Account Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Adeyemi Adeleke"
                  className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>

              {/* Sender Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone / WhatsApp Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678"
                  className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Receipt Screenshot / PDF <span className="text-red-400">*</span>
                </label>

                {!receiptFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-emerald-400/50 rounded-2xl p-3.5 sm:p-5 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-white/5 active:bg-white/10"
                  >
                    <LuUpload size={22} className="mx-auto text-emerald-400 mb-1.5" />
                    <p className="text-xs sm:text-sm font-medium text-white">
                      Tap to upload receipt screenshot
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                      PNG, JPG, WEBP, or PDF up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {receiptPreview ? (
                        <img
                          src={receiptPreview}
                          alt="Receipt Preview"
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <LuImage size={20} />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate max-w-[170px] sm:max-w-[220px]">
                          {receiptFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-400">
                          {(receiptFile.size / 1024).toFixed(0)} KB &middot; Attached
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <LuX size={16} />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Optional note */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Narration / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Bank transfer narration or session ID"
                  className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>
            </div>

            {/* Sticky Step 2 Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-3.5 sm:px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LuArrowLeft size={15} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>
                    <span>Submit Proof</span>
                    <LuArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: SUCCESS CONFIRMATION ================= */}
        {activeStep === 3 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Step 3 Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 overscroll-contain text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <LuCircleCheck size={32} />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] sm:text-xs font-semibold mb-2">
                  <LuClock size={13} />
                  <span>Verification Pending</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Receipt Submitted!</h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-sm mx-auto leading-relaxed">
                  Thank you, <span className="text-white font-medium">{senderName}</span>. Your transfer of{' '}
                  <span className="text-emerald-400 font-semibold">₦{selectedBundle.amountNgn.toLocaleString()}</span> for{' '}
                  <span className="text-white font-semibold">{selectedBundle.credits} credit(s)</span> is being processed.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-400 text-left space-y-2">
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono text-white font-semibold">{submittedTx?.paystack_ref}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timeline:</span>
                  <span className="text-slate-300">Typically 15–60 mins (max 12h)</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-amber-400 font-semibold">Pending Admin Approval</span>
                </div>
              </div>
            </div>

            {/* Sticky Step 3 Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md space-y-2">
              <a
                href={`${supportPhone}?text=${getWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-green-500/20"
              >
                <LuMessageCircle size={18} />
                <span>Notify Support on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={resetModal}
                className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
