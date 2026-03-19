import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export default function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <footer className="hidden md:block bg-gray-950 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">K</span>
              </div>
              <span className="text-white font-black text-xl">Kaya</span>
            </div>
            <p className="text-sm leading-relaxed">{t('footer.tagline')}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer.exploreTitle')}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/explore?niche=gardening', label: t('footer.niches.gardening') },
                { to: '/explore?niche=tutoring',  label: t('footer.niches.tutoring') },
                { to: '/explore?niche=babysitting',label: t('footer.niches.babysitting') },
                { to: '/explore?niche=cleaning',  label: t('footer.niches.cleaning') },
              ].map((l) => (
                <li key={l.to}><Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer.sellersTitle')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={user ? '/dashboard/seller' : '/register'} className="hover:text-white transition-colors">{t('footer.becomeSeller')}</Link></li>
              <li><Link to="/dashboard/seller" className="hover:text-white transition-colors">{t('footer.sellerDashboard')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer.companyTitle')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            {t('footer.operational')}
          </div>
        </div>
      </div>
    </footer>
  );
}
