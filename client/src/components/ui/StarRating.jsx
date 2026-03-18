// Read-only or interactive star rating
export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-2xl' };
  return (
    <div className={`flex gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`${onChange ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${star <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
