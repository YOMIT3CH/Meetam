export default function GlassButton({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  onClick,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-pink-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 active:scale-95",
    outline:
      "border border-white/10 text-white bg-white/5 hover:bg-white/10 hover:border-white/20",
    ghost:
      "text-slate-300 hover:text-white hover:bg-white/5",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

