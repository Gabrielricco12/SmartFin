export function Input({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`w-full px-4 py-2.5 rounded-xl border bg-white/50 backdrop-blur-sm transition-all outline-none focus:ring-2 focus:border-transparent ${
          error 
            ? 'border-red-300 focus:ring-red-500/20' 
            : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}