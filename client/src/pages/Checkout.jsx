// ============================================================
// Checkout Page — Stripe Elements payment form
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { servicesAPI, ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import BackButton from '../components/ui/BackButton';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Inner form component (must be inside <Elements>)
function CheckoutForm({ service, packageId, clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState('');

  const pkg = packageId ? service.packages.find((p) => p.id === packageId) : null;
  const price = pkg ? pkg.price : service.basePrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const card = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success(t('checkout.toasts.placed'));
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(t('checkout.toasts.paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order summary */}
      <div className="card p-4">
        <h2 className="font-semibold mb-3">{t('checkout.orderSummary')}</h2>
        <div className="flex justify-between text-sm mb-1">
          <span>{service.title}</span>
          <span className="font-medium">${parseFloat(price).toFixed(2)}</span>
        </div>
        {pkg && (
          <div className="text-xs text-gray-400 mb-2">{pkg.name} {t('checkout.package')} · {pkg.deliveryDays} {t('checkout.daysDelivery')}</div>
        )}
        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
          <span>{t('checkout.total')}</span>
          <span>${parseFloat(price).toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">{t('checkout.escrowNote')}</p>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('checkout.requirementsLabel')} <span className="text-gray-400">{t('checkout.requirementsOptional')}</span>
        </label>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="input h-24 resize-none"
          placeholder={t('checkout.requirementsPlaceholder')}
        />
      </div>

      {/* Card input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.paymentDetails')}</label>
        <div className="input">
          <CardElement options={{ style: { base: { fontSize: '14px' } } }} />
        </div>
      </div>

      <button type="submit" disabled={loading || !stripe} className="btn-primary w-full py-3">
        {loading ? t('checkout.processing') : `${t('checkout.pay')} $${parseFloat(price).toFixed(2)}`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { serviceId } = useParams();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('packageId') || null;
  const [clientSecret, setClientSecret] = useState(null);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesAPI.get(serviceId).then((r) => r.data),
  });

  // Create order + get client secret
  useEffect(() => {
    if (!service) return;
    ordersAPI.create({ serviceId, packageId })
      .then(({ data }) => {
        setClientSecret(data.clientSecret);
      })
      .catch(() => toast.error(t('checkout.toasts.createFailed')));
  }, [service]);

  if (isLoading || !clientSecret) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-4"><BackButton /></div>
      <h1 className="text-2xl font-bold mb-6">{t('checkout.title')}</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm service={service} packageId={packageId} clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}
