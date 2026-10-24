import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import SearchModal from './components/SearchModal.jsx';
import AnthemModal from './components/AnthemModal.jsx';
import { SiteContentProvider } from './context/SiteContentContext.jsx';
import { GlassRouteLoader } from './components/GlassSkeleton.jsx';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const HistoryPage = lazy(() => import('./pages/HistoryPage.jsx'));
const EventsPage = lazy(() => import('./pages/EventsPage.jsx'));
const GalleryPage = lazy(() => import('./pages/GalleryPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const AnthemPage = lazy(() => import('./pages/AnthemPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));

function scrollToElementWithNavOffset(el) {
  if (!el) return;
  const header = document.getElementById('mainHeader') || document.querySelector('header');
  const navHeight = header ? header.getBoundingClientRect().height : 76;
  const elementPosition = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: Math.max(0, Math.round(elementPosition - navHeight)),
    behavior: 'smooth'
  });
}

/**
 * Root Application Component
 * Manages routing, global modals, SEO metadata sync, and SPA redirects.
 */
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const historyLang = searchParams.get('lang') === 'ta' ? 'ta' : 'en';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAnthemOpen, setIsAnthemOpen] = useState(false);

  const getActivePageName = () => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/history')) return 'history';
    if (path.startsWith('/events')) return 'events';
    if (path.startsWith('/gallery')) return 'gallery';
    if (path.startsWith('/contact')) return 'contact';
    if (path.startsWith('/anthem')) return 'anthem';
    return 'home';
  };

  const currentPage = getActivePageName();
  const isAdminRoute = location.pathname.toLowerCase().startsWith('/admin');

  // Handle SPA redirects from static hosts (GitHub Pages 404.html) and legacy hash URLs
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirect_path');
    if (redirectPath) {
      sessionStorage.removeItem('redirect_path');
      // Ensure redirectPath is a safe relative path to prevent open redirect vulnerabilities
      if (typeof redirectPath === 'string' && redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        navigate(redirectPath, { replace: true });
        return;
      }
    }

    const hash = window.location.hash.toLowerCase();
    if (hash.startsWith('#admin')) {
      navigate('/admin', { replace: true });
    } else if (hash.startsWith('#history')) {
      navigate('/history', { replace: true });
    } else if (hash.startsWith('#events')) {
      navigate('/events', { replace: true });
    } else if (hash.startsWith('#gallery')) {
      navigate('/gallery', { replace: true });
    } else if (hash.startsWith('#principles')) {
      if (window.location.pathname === '/') {
        const el = document.getElementById('principles');
        if (el) scrollToElementWithNavOffset(el);
      } else {
        navigate('/#principles', { replace: true });
      }
    } else if (hash.startsWith('#performance')) {
      if (window.location.pathname === '/') {
        const el = document.getElementById('performance');
        if (el) scrollToElementWithNavOffset(el);
      } else {
        navigate('/#performance', { replace: true });
      }
    } else if (hash.startsWith('#contact')) {
      navigate('/contact', { replace: true });
    } else if (hash.startsWith('#anthem')) {
      navigate('/anthem', { replace: true });
    }
  }, [navigate]);

  const handleHistoryLangChange = useCallback((lang) => {
    const nextParams = new URLSearchParams(searchParams);
    if (lang === 'ta') {
      nextParams.set('lang', 'ta');
    } else {
      nextParams.delete('lang');
    }
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Synchronize document title, OpenGraph metadata, and indexing directives per route
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const metaDesc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');

    let pageTitle = "J/Kopay Christian College";
    let descContent = "Official portal of J/Kopay Christian College (யா/ கோப்பாய் கிறிஸ்தவ கல்லூரி), Kopay, Jaffna, Sri Lanka. Established in 1852. Academic excellence, history, traditions, and collegiate education.";

    if (path.startsWith('/admin')) {
      pageTitle = "Admin Portal";
      descContent = "Administration portal for J/Kopay Christian College.";
      // Enforce strict noindex for Admin portal to prevent search engine indexing
      if (robotsMeta) robotsMeta.setAttribute("content", "noindex, nofollow");
    } else {
      if (robotsMeta) robotsMeta.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

      if (path.startsWith('/history')) {
        pageTitle = historyLang === 'ta'
          ? "கல்லூரி வரலாறு"
          : "History & Heritage";
        descContent = "Explore the 170+ year historic timeline of J/Kopay Christian College (1849 - Present), from Robert Bren and the CMS English School to the modern collegiate era in Kopay, Jaffna.";
      } else if (path.startsWith('/events')) {
        pageTitle = "School Events";
        descContent = "Explore latest sports meets, academic exhibitions, cultural festivals, prize givings, and school milestones from the official Facebook community of Kopay Christian College.";
      } else if (path.startsWith('/gallery')) {
        pageTitle = "Photo Gallery";
        descContent = "Explore our 3D digital photo gallery showcasing collegiate life, laboratory sessions, sports meets, and historic moments at J/Kopay Christian College.";
      } else if (path.startsWith('/contact')) {
        pageTitle = "Contact Us";
        descContent = "Contact the administration office of J/Kopay Christian College, Kopay, Jaffna, Sri Lanka. Telephone: 021 223 0040. Email: kcckopay@gmail.com.";
      } else if (path.startsWith('/anthem')) {
        pageTitle = "School Anthem";
        descContent = "Official School Anthem of J/Kopay Christian College (யா/ கோப்பாய் கிறிஸ்தவ கல்லூரி). Composed in Ragam Hamsadhwani celebrating truth, justice, and collegiate heritage.";
      }
    }

    document.title = pageTitle;
    if (metaDesc) metaDesc.setAttribute("content", descContent);
    if (ogTitle) ogTitle.setAttribute("content", pageTitle);
    if (ogDesc) ogDesc.setAttribute("content", descContent);

    if (typeof window !== 'undefined') {
      const canonicalHref = `${window.location.origin}${location.pathname}`;
      if (canonicalLink) canonicalLink.setAttribute("href", canonicalHref);
      if (ogUrl) ogUrl.setAttribute("content", canonicalHref);
    }
  }, [location.pathname, historyLang]);

  const handleNavigate = useCallback((page) => {
    if (page === 'performance') {
      if (location.pathname === '/') {
        const el = document.getElementById('performance');
        if (el) {
          scrollToElementWithNavOffset(el);
          window.history.replaceState(null, '', '/#performance');
        } else {
          window.location.hash = '#performance';
        }
      } else {
        navigate('/#performance');
      }
      return;
    }

    if (page === 'motto' || page === 'principles') {
      if (location.pathname === '/') {
        const el = document.getElementById('principles');
        if (el) {
          scrollToElementWithNavOffset(el);
          window.history.replaceState(null, '', '/#principles');
        } else {
          window.location.hash = '#principles';
        }
      } else {
        navigate('/#principles');
      }
      return;
    }

    let target = '/';
    if (page === 'history') target = '/history';
    else if (page === 'events') target = '/events';
    else if (page === 'gallery') target = '/gallery';
    else if (page === 'contact') target = '/contact';
    else if (page === 'anthem') target = '/anthem';

    navigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate, location.pathname]);

  // Global hotkeys for accessible search invocation
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        else if (isAnthemOpen) setIsAnthemOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isAnthemOpen]);

  // Dedicated full-screen layout for admin console
  if (isAdminRoute) {
    return (
      <SiteContentProvider>
        <Suspense fallback={<GlassRouteLoader />}>
          <AdminPage />
        </Suspense>
      </SiteContentProvider>
    );
  }

  return (
    <SiteContentProvider>
      <div className="min-h-screen flex flex-col bg-brand-white dark:bg-[#0b120c] text-slate-800 dark:text-slate-100 font-sans selection:bg-brand-pale selection:text-brand-forest dark:selection:bg-emerald-950 dark:selection:text-emerald-300 antialiased transition-colors duration-150">
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAnthem={() => setIsAnthemOpen(true)}
          historyLang={historyLang}
          onChangeHistoryLang={handleHistoryLangChange}
        />

        <Suspense fallback={<GlassRouteLoader />}>
          <Routes>
            <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
            <Route path="/history" element={<HistoryPage lang={historyLang} />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/anthem" element={<AnthemPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/performance" element={<Navigate to="/#performance" replace />} />
            <Route path="/academics" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <Footer
          onNavigate={handleNavigate}
          onOpenAnthem={() => setIsAnthemOpen(true)}
        />

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={handleNavigate}
          onOpenAnthem={() => setIsAnthemOpen(true)}
        />

        <AnthemModal
          isOpen={isAnthemOpen}
          onClose={() => setIsAnthemOpen(false)}
        />
      </div>
    </SiteContentProvider>
  );
}
