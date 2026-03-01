export function Button({ children, isLoading, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  };

  return (
    <button
      disabled={isLoading || props.disabled}
      className={`relative flex items-center justify-center w-full px-4 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin absolute" />
      ) : null}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>{children}</span>
    </button>
  );
}