import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'BUYER', referralCode: refCode });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error(t('auth.register.pwError'));
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(t('auth.register.welcome'));
      navigate(user.role === 'SELLER' ? '/dashboard/seller' : '/explore');
    } catch (err) {
      toast.error(err.response?.data?.error || t('auth.register.failed'));
    } finally {
      setLoading(false);
    }
  };

  const features = t('auth.register.features', { returnObjects: true });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-950 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
              <span className="text-white font-black">K</span>
            </div>
            <span className="text-white font-black text-xl">Kaya</span>
          </Link>
        </div>
        <div className="relative space-y-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-white/50 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm animate-fade-up">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className="font-black text-xl gradient-text">Kaya</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900">{t('auth.register.title')}</h1>
            <p className="text-gray-400 mt-1">{t('auth.register.subtitle')}</p>
          </div>

          {/* Role toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
            {[
              { role: 'BUYER',  label: t('auth.register.buyerLabel') },
              { role: 'SELLER', label: t('auth.register.sellerLabel') },
            ].map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => setForm({ ...form, role: r.role })}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  form.role === r.role
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {form.role === 'SELLER' && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
              <span className="text-lg">💡</span>
              <p className="text-xs text-amber-700">{t('auth.register.sellerTrial')}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.register.fullName')}</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.register.email')}</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.register.password')}</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input" placeholder={t('auth.register.pwPlaceholder')} />
            </div>

            {refCode && (
              <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-xl p-3">
                <span>🎁</span>
                <p className="text-xs text-primary-700">{t('auth.register.referralApplied')} <strong>{refCode}</strong></p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {t('auth.register.submitting')}
                </span>
              ) : t('auth.register.submit')}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            {t('auth.register.termsText')}{' '}
            <a href="#" className="text-primary-600 hover:underline">{t('auth.register.terms')}</a> {t('auth.register.and')}{' '}
            <a href="#" className="text-primary-600 hover:underline">{t('auth.register.privacy')}</a>.
          </p>
          <p className="text-center text-sm text-gray-400 mt-3">
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">{t('auth.register.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
