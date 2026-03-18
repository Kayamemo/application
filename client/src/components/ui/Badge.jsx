// Status badge with color variants
const variants = {
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100 text-red-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-gray-100 text-gray-600',
};

const statusColors = {
  ACTIVE: 'green', COMPLETED: 'green', TRIALING: 'blue',
  PENDING: 'yellow', DELIVERED: 'blue',
  CANCELLED: 'gray', REFUNDED: 'gray', PAST_DUE: 'red',
  DISPUTED: 'red', OPEN: 'red', UNDER_REVIEW: 'yellow',
};

export default function Badge({ label, variant }) {
  const color = variant || statusColors[label] || 'gray';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[color]}`}>
      {label}
    </span>
  );
}
