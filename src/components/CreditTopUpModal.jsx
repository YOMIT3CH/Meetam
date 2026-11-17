import { useState, useRef } from 'react';
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
  LuMessageCircle,
} from 'react-icons/lu';

export default function CreditTopUpModal({ open, onClose, onCompleted }) {
  const { user } = useMeetAm();
  const fileInputRef = useRef(null);

  const [selectedBundle, setSelectedBundle] = useState(PAYSTACK_BUNDLES[0]);
  const [step, setStep] = useState('select'); // 'select' | 'upload' | 'success'

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

  if (!open) return null;

  const bankName = import.meta.env.VITE_BANK_NAME || BANK_DETAILS.bankName;
  const accountName = import.meta.env.VITE_BANK_ACCOUNT_NAME || BANK_DETAILS.accountName;
  const accountNumber = import.meta.env.VITE_BANK_ACCOUNT_NUMBER || BANK_DETAILS.accountNumber;
  const supportPhone = import.meta.env.VITE_SUPPORT_WHATSAPP || SUPPORT_WHATSAPP;

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

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('You must be logged in to submit a payment proof');
      return;
    }

    if (!senderName.trim()) {
      setErrorMessage('Please enter the sender name (account name transferred from)');
      return;
    }

    if (!senderPhone.trim()) {
      setErrorMessage('Please enter your phone / WhatsApp number for confirmation');
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
          // If storage bucket isn't configured, receiptPreview (base64 Data URL) remains fallback
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
        .single();

      if (txError) {
        throw txError;
      }

      setSubmittedTx(txRecord || { paystack_ref: txRef });
      setStep('success');
      if (onCompleted) onCompleted();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep('select');
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg my-8 rounded-3xl border border-white/10 bg-slate-900/95 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Subtle glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <LuCreditCard size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Top Up Credits</h2>
              <p className="text-xs text-slate-400">Manual Bank Transfer</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* STEP 1 & 2: Select Bundle + Bank Details + Upload */}
        {step !== 'success' && (
          <div className="space-y-6 relative z-10">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
                <LuCircleAlert size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Credit Bundles */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                1. Select Credit Package
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PAYSTACK_BUNDLES.map((b) => {
                  const isSelected = selectedBundle.credits === b.credits;
                  return (
                    <button
                      key={b.credits}
                      type="button"
                      onClick={() => setSelectedBundle(b)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/15 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/40'
                          : 'border-white/10 bg-slate-950/60 hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-white">
                          {b.credits} {b.credits === 1 ? 'Credit' : 'Credits'}
                        </span>
                        {isSelected && <LuCheck size={16} className="text-emerald-400" />}
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold mt-1">
                        ₦{b.amountNgn.toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Company Bank Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>2. Transfer to Company Account</span>
                <span className="text-emerald-400 font-bold">₦{selectedBundle.amountNgn.toLocaleString()}</span>
              </label>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <LuBuilding size={14} className="text-slate-400" /> Bank Name
                  </span>
                  <span className="font-semibold text-white">{bankName}</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/5">
                  <span className="text-slate-400">Account Name</span>
                  <span className="font-semibold text-white text-right max-w-[200px] truncate">
                    {accountName}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Account Number</span>
                    <span className="font-mono text-base font-bold text-emerald-400 tracking-wider">
                      {accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
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

            {/* 3. Proof of Payment Upload Form */}
            <form onSubmit={handleSubmitProof} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                3. Attach Payment Receipt
              </label>

              {/* Sender Name */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Sender Account Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Adeyemi Adeleke"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>

              {/* Sender Phone */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Phone / WhatsApp Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Payment Receipt Screenshot / PDF <span className="text-red-400">*</span>
                </label>

                {!receiptFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-emerald-400/50 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-white/5"
                  >
                    <LuUpload size={24} className="mx-auto text-emerald-400 mb-2" />
                    <p className="text-xs font-medium text-white">
                      Click to upload receipt screenshot
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      PNG, JPG, WEBP, or PDF up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
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
                        <p className="text-xs font-semibold text-white truncate max-w-[220px]">
                          {receiptFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-400">
                          {(receiptFile.size / 1024).toFixed(0)} KB &middot; Ready to submit
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
                  Transfer Reference / Narration (Optional)
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Session ID or bank reference"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                />
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>
                    <span>Submit Payment Proof</span>
                    <LuArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && (
          <div className="py-4 text-center space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-2">
              <LuCircleCheck size={36} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
                <LuClock size={13} />
                <span>Verification Pending</span>
              </div>
              <h3 className="text-xl font-bold text-white">Receipt Uploaded Successfully</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-sm mx-auto leading-relaxed">
                Thank you, <span className="text-white font-medium">{senderName}</span>. Your transfer of{' '}
                <span className="text-emerald-400 font-semibold">₦{selectedBundle.amountNgn.toLocaleString()}</span> for{' '}
                <span className="text-white font-semibold">{selectedBundle.credits} credit(s)</span> is being verified.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-400 text-left space-y-2">
              <div className="flex justify-between">
                <span>Reference:</span>
                <span className="font-mono text-white font-semibold">{submittedTx?.paystack_ref}</span>
              </div>
              <div className="flex justify-between">
                <span>Verification Window:</span>
                <span className="text-slate-300">Within 15–60 mins (max 12h)</span>
              </div>
              <div className="flex justify-between">
                <span>Notification:</span>
                <span className="text-slate-300">Credits added directly to your balance</span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <a
                href={`${supportPhone}?text=${getWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
              >
                <LuMessageCircle size={18} />
                <span>Notify Support on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={resetModal}
                className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
