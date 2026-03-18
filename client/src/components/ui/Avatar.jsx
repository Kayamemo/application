export default function Avatar({ src, name = '?', size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow-sm`} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm ring-2 ring-white`}>
      {initials}
    </div>
  );
}
