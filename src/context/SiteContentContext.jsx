import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import defaultSiteContent from '../data/siteContent.json';
import { FACEBOOK_POSTS } from '../data/facebookEvents.js';

const STORAGE_KEY = 'kcc_site_content_v1';
const SiteContentContext = createContext(null);

/**
 * Checks if a URL string belongs strictly to official HTTPS Facebook domains.
 */
export function isTrustedFacebookUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'facebook.com' || parsed.hostname.endsWith('.facebook.com'))
    );
  } catch {
    return false;
  }
}

/**
 * Utility to parse any Facebook URL or iframe embed snippet
 * and format it into a standardized Facebook plugin iframe embed URL.
 * Strictly validates domain safety to prevent non-Facebook URL injection.
 */
export function parseFacebookInput(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Case 1: Pasted iframe code (e.g. <iframe src="https://www.facebook.com/plugins/post.php?href=..." ...></iframe>)
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) {
    const rawSrc = iframeMatch[1];
    if (!isTrustedFacebookUrl(rawSrc)) {
      return null;
    }
    const hrefMatch = rawSrc.match(/href=([^&]+)/);
    const postUrl = hrefMatch ? decodeURIComponent(hrefMatch[1]) : rawSrc;
    return {
      postUrl,
      iframeSrc: rawSrc,
      width: 500,
      height: 645,
      isShareUrl: postUrl.includes('/share/')
    };
  }

  // Case 2: Already a facebook plugin URL (plugins/post.php or plugins/video.php)
  if (trimmed.includes('facebook.com/plugins/')) {
    if (!isTrustedFacebookUrl(trimmed)) {
      return null;
    }
    const hrefMatch = trimmed.match(/href=([^&]+)/);
    const postUrl = hrefMatch ? decodeURIComponent(hrefMatch[1]) : trimmed;
    return {
      postUrl,
      iframeSrc: trimmed,
      width: 500,
      height: 645,
      isShareUrl: postUrl.includes('/share/')
    };
  }

  // Case 3: Standard Facebook URL (post, permalink, reel, video, photo)
  let cleanUrl = trimmed.replace('m.facebook.com', 'www.facebook.com');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  if (!isTrustedFacebookUrl(cleanUrl)) {
    return null;
  }

  const isShareUrl = cleanUrl.includes('/share/');
  const isVideo = cleanUrl.includes('/watch') || cleanUrl.includes('/reel') || cleanUrl.includes('/videos/');
  const plugin = isVideo ? 'video.php' : 'post.php';
  const iframeSrc = `https://www.facebook.com/plugins/${plugin}?href=${encodeURIComponent(cleanUrl)}&show_text=true&width=500`;

  return {
    postUrl: cleanUrl,
    iframeSrc,
    width: 500,
    height: 645,
    isShareUrl
  };
}

/**
 * Resolves a temporary Facebook mobile share URL (e.g. /share/p/...) to its canonical permalink
 * via the serverless resolver endpoint /api/resolve-facebook.
 *
 * @param {string} url - The Facebook share URL.
 * @returns {Promise<string|null>} The canonical permalink or null if resolution fails.
 */
export async function resolveFacebookShareUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed.includes('/share/')) return trimmed;

  try {
    const res = await fetch(`/api/resolve-facebook?url=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.canonicalUrl) {
        return data.canonicalUrl;
      }
    }
  } catch (err) {
    console.warn('Unable to auto-resolve Facebook share link:', err);
  }
  return null;
}


const COMMITTED_STORAGE_KEY = 'kcc_last_committed_content_v1';

/**
 * Normalizes raw site content objects against defaultSiteContent structure.
 */
function normalizeSiteContent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const savedPrinciples = raw?.principles || {};
  const isLegacyVision = !savedPrinciples.vision ||
    savedPrinciples.vision?.english?.includes('cultivate disciplined') ||
    savedPrinciples.vision?.tamil?.includes('தொலைநோக்குத்');
  const isLegacyMission = !savedPrinciples.mission ||
    savedPrinciples.mission?.english?.includes('balanced education') ||
    savedPrinciples.mission?.tamil?.includes('கல்வித் தேர்ச்சி');

  const resolvedPrinciples = {
    ...defaultSiteContent.principles,
    ...savedPrinciples,
    ...(isLegacyVision ? { vision: defaultSiteContent.principles.vision } : {}),
    ...(isLegacyMission ? { mission: defaultSiteContent.principles.mission } : {})
  };

  return {
    ...defaultSiteContent,
    ...raw,
    hero: { ...defaultSiteContent.hero, ...raw?.hero },
    principles: resolvedPrinciples,
    performance: {
      ...defaultSiteContent.performance,
      ...raw?.performance
    },
    gallery: Array.isArray(raw?.gallery) ? raw.gallery : (defaultSiteContent.gallery || []),
    events: Array.isArray(raw?.events) ? raw.events : (defaultSiteContent.events || FACEBOOK_POSTS),
    contact: { ...defaultSiteContent.contact, ...raw?.contact },
    history: {
      ...defaultSiteContent.history,
      ...raw?.history,
      overview: {
        ...(defaultSiteContent.history?.overview || {}),
        ...(raw?.history?.overview || {})
      },
      milestones: Array.isArray(raw?.history?.milestones)
        ? raw.history.milestones
        : (defaultSiteContent.history?.milestones || []),
      headmasters: Array.isArray(raw?.history?.headmasters)
        ? raw.history.headmasters
        : (defaultSiteContent.history?.headmasters || []),
      managers: Array.isArray(raw?.history?.managers)
        ? raw.history.managers
        : (defaultSiteContent.history?.managers || [])
    }
  };
}

const defaultBaseContent = normalizeSiteContent(defaultSiteContent);

/**
 * Performs canonical deep equality check by stringifying payload
 */
function areContentsEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * SiteContentProvider
 * Centralized content state provider for user-customizable text, stats, gallery, events, and contact information.
 * Supports:
 * 1. Active React component state (in-memory)
 * 2. Browser localStorage overrides (persists edits across reloads)
 * 3. Packaged JSON defaults from siteContent.json (fallback)
 */
export function SiteContentProvider({ children }) {
  // Baseline committed content (either from last committed snapshot in localStorage or code defaults)
  const [committedContent, setCommittedContent] = useState(() => {
    try {
      const saved = localStorage.getItem(COMMITTED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeSiteContent(parsed);
        if (normalized) return normalized;
      }
    } catch (e) {
      console.warn('Failed to parse cached committed content:', e);
    }
    return defaultBaseContent;
  });

  const committedBaseRef = useRef(committedContent);
  committedBaseRef.current = committedContent;

  const [content, setContent] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeSiteContent(parsed);
        if (normalized) return normalized;
      }
    } catch (e) {
      console.warn('Failed to parse cached site content:', e);
    }
    return defaultBaseContent;
  });

  // Track if current in-memory content genuinely differs from committed baseline
  const [hasUncommittedChanges, setHasUncommittedChanges] = useState(() => {
    return !areContentsEqual(content, committedContent);
  });

  const [hasLocalOverrides, setHasLocalOverrides] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });

  // Undo / Redo History Stack Management
  const MAX_HISTORY = 40;
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const contentRef = useRef(content);
  contentRef.current = content;

  const pastRef = useRef([]);
  pastRef.current = past;

  const futureRef = useRef([]);
  futureRef.current = future;

  const typingSessionRef = useRef({
    active: false,
    timer: null
  });

  const commitContinuous = useCallback(() => {
    if (typingSessionRef.current.timer) {
      clearTimeout(typingSessionRef.current.timer);
      typingSessionRef.current.timer = null;
    }
    typingSessionRef.current.active = false;
  }, []);

  const saveContent = useCallback((updater, options = {}) => {
    const { isContinuous = false } = options;
    const current = contentRef.current;
    const next = typeof updater === 'function' ? updater(current) : updater;

    // Skip redundant updates
    if (JSON.stringify(current) === JSON.stringify(next)) {
      return;
    }

    if (isContinuous) {
      // If we are starting a continuous typing/editing sequence, record snapshot of state before typing started
      if (!typingSessionRef.current.active) {
        typingSessionRef.current.active = true;
        const newPast = [...pastRef.current.slice(-(MAX_HISTORY - 1)), current];
        pastRef.current = newPast;
        futureRef.current = [];
        setPast(newPast);
        setFuture([]);
      }

      // Debounce the typing session so user pauses reset the session boundary
      if (typingSessionRef.current.timer) {
        clearTimeout(typingSessionRef.current.timer);
      }
      typingSessionRef.current.timer = setTimeout(() => {
        typingSessionRef.current.active = false;
        typingSessionRef.current.timer = null;
      }, 750);
    } else {
      // Discrete action (e.g. upload, delete image, add event): seal any ongoing typing session
      if (typingSessionRef.current.timer) {
        clearTimeout(typingSessionRef.current.timer);
        typingSessionRef.current.timer = null;
      }
      typingSessionRef.current.active = false;

      const newPast = [...pastRef.current.slice(-(MAX_HISTORY - 1)), current];
      pastRef.current = newPast;
      futureRef.current = [];
      setPast(newPast);
      setFuture([]);
    }

    setContent(next);
    const isDirty = !areContentsEqual(next, committedBaseRef.current);
    setHasUncommittedChanges(isDirty);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setHasLocalOverrides(true);
    } catch (err) {
      console.error('LocalStorage write error:', err);
    }
  }, []);

  const undo = useCallback(() => {
    commitContinuous();

    const pastList = pastRef.current;
    if (pastList.length === 0) return false;

    const previousState = pastList[pastList.length - 1];
    const newPast = pastList.slice(0, -1);
    const newFuture = [contentRef.current, ...futureRef.current.slice(0, MAX_HISTORY - 1)];

    pastRef.current = newPast;
    futureRef.current = newFuture;
    setPast(newPast);
    setFuture(newFuture);

    setContent(previousState);
    const isDirty = !areContentsEqual(previousState, committedBaseRef.current);
    setHasUncommittedChanges(isDirty);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(previousState));
      setHasLocalOverrides(true);
    } catch (err) {
      console.error('LocalStorage write error during undo:', err);
    }

    return true;
  }, [commitContinuous]);

  const redo = useCallback(() => {
    commitContinuous();

    const futureList = futureRef.current;
    if (futureList.length === 0) return false;

    const nextState = futureList[0];
    const newFuture = futureList.slice(1);
    const newPast = [...pastRef.current.slice(-(MAX_HISTORY - 1)), contentRef.current];

    pastRef.current = newPast;
    futureRef.current = newFuture;
    setPast(newPast);
    setFuture(newFuture);

    setContent(nextState);
    const isDirty = !areContentsEqual(nextState, committedBaseRef.current);
    setHasUncommittedChanges(isDirty);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      setHasLocalOverrides(true);
    } catch (err) {
      console.error('LocalStorage write error during redo:', err);
    }

    return true;
  }, [commitContinuous]);

  const clearHistory = useCallback(() => {
    commitContinuous();
    pastRef.current = [];
    futureRef.current = [];
    setPast([]);
    setFuture([]);
  }, [commitContinuous]);

  const updateSection = useCallback((section, data) => {
    saveContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }), { isContinuous: true });
  }, [saveContent]);

  const updateHero = useCallback((hero) => updateSection('hero', hero), [updateSection]);
  const updatePrinciples = useCallback((principles) => updateSection('principles', principles), [updateSection]);
  const updatePerformance = useCallback((performanceData) => updateSection('performance', performanceData), [updateSection]);
  const updateContact = useCallback((contact) => updateSection('contact', contact), [updateSection]);

  const updateHistory = useCallback((historyData) => {
    saveContent(prev => ({
      ...prev,
      history: {
        ...(prev.history || defaultSiteContent.history || {}),
        ...historyData,
        overview: {
          ...((prev.history && prev.history.overview) || (defaultSiteContent.history && defaultSiteContent.history.overview) || {}),
          ...(historyData?.overview || {})
        }
      }
    }), { isContinuous: true });
  }, [saveContent]);

  const addHistoryMilestone = useCallback((newMilestone) => {
    saveContent(prev => {
      const currentList = prev.history?.milestones || defaultSiteContent.history?.milestones || [];
      const item = {
        id: `his-${Date.now()}`,
        year: 'Year / Era',
        yearTa: 'ஆண்டு / காலம்',
        titleEn: 'New Milestone Title',
        titleTa: 'புதிய மைல்கல் தலைப்பு',
        descEn: '',
        descTa: '',
        quoteEn: '',
        quoteTa: '',
        image: '/assets/his1.jpg',
        imageAlt: 'Milestone',
        ...newMilestone
      };
      return {
        ...prev,
        history: {
          ...(prev.history || defaultSiteContent.history || {}),
          milestones: [...currentList, item]
        }
      };
    }, { isContinuous: false });
  }, [saveContent]);

  const updateHistoryMilestone = useCallback((index, updatedData) => {
    saveContent(prev => {
      const currentList = [...(prev.history?.milestones || defaultSiteContent.history?.milestones || [])];
      if (currentList[index]) {
        currentList[index] = { ...currentList[index], ...updatedData };
      }
      return {
        ...prev,
        history: {
          ...(prev.history || defaultSiteContent.history || {}),
          milestones: currentList
        }
      };
    }, { isContinuous: true });
  }, [saveContent]);

  const deleteHistoryMilestone = useCallback((index) => {
    saveContent(prev => {
      const currentList = (prev.history?.milestones || defaultSiteContent.history?.milestones || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        history: {
          ...(prev.history || defaultSiteContent.history || {}),
          milestones: currentList
        }
      };
    }, { isContinuous: false });
  }, [saveContent]);

  const moveHistoryMilestone = useCallback((index, direction) => {
    saveContent(prev => {
      const currentList = [...(prev.history?.milestones || defaultSiteContent.history?.milestones || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;
      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;
      return {
        ...prev,
        history: {
          ...(prev.history || defaultSiteContent.history || {}),
          milestones: currentList
        }
      };
    }, { isContinuous: false });
  }, [saveContent]);

  const updateLeadershipList = useCallback((category, list) => {
    saveContent(prev => ({
      ...prev,
      history: {
        ...(prev.history || defaultSiteContent.history || {}),
        [category]: list
      }
    }), { isContinuous: false });
  }, [saveContent]);

  const addGalleryImage = useCallback((newImg) => {
    saveContent(prev => {
      if (Array.isArray(newImg)) {
        const newItems = newImg.map(item => ({
          src: typeof item === 'string' ? item : (item.src || '/assets/hero.jpg')
        }));
        return {
          ...prev,
          gallery: [...(prev.gallery || []), ...newItems]
        };
      }
      const src = typeof newImg === 'string' ? newImg : (newImg.src || '/assets/hero.jpg');
      return {
        ...prev,
        gallery: [...(prev.gallery || []), { src }]
      };
    }, { isContinuous: false });
  }, [saveContent]);

  const deleteGalleryImage = useCallback((indexOrSrc) => {
    saveContent(prev => ({
      ...prev,
      gallery: (prev.gallery || []).filter((item, idx) => {
        if (typeof indexOrSrc === 'number') return idx !== indexOrSrc;
        return item.src !== indexOrSrc;
      })
    }), { isContinuous: false });
  }, [saveContent]);

  const updateGalleryImage = useCallback((index, newSrc) => {
    saveContent(prev => {
      const newGallery = [...(prev.gallery || [])];
      if (newGallery[index]) {
        newGallery[index] = { src: newSrc };
      }
      return {
        ...prev,
        gallery: newGallery
      };
    }, { isContinuous: false });
  }, [saveContent]);

  const addEvent = useCallback((eventOrFbUrl) => {
    saveContent(prev => {
      let newEvent;
      if (typeof eventOrFbUrl === 'string') {
        const parsed = parseFacebookInput(eventOrFbUrl);
        if (!parsed) return prev;
        newEvent = {
          id: `post-${Date.now()}`,
          type: 'facebook',
          ...parsed
        };
      } else if (eventOrFbUrl.type === 'manual' || eventOrFbUrl.image || eventOrFbUrl.title) {
        newEvent = {
          id: eventOrFbUrl.id || `event-${Date.now()}`,
          type: 'manual',
          title: eventOrFbUrl.title || '',
          titleTa: eventOrFbUrl.titleTa || '',
          date: eventOrFbUrl.date || new Date().toISOString().slice(0, 10),
          description: eventOrFbUrl.description || '',
          descriptionTa: eventOrFbUrl.descriptionTa || '',
          image: eventOrFbUrl.image || '',
          images: Array.isArray(eventOrFbUrl.images) ? eventOrFbUrl.images : [],
          category: eventOrFbUrl.category || 'School Event',
          location: eventOrFbUrl.location || '',
          createdAt: eventOrFbUrl.createdAt || new Date().toISOString()
        };
      } else {
        newEvent = {
          id: eventOrFbUrl.id || `post-${Date.now()}`,
          type: 'facebook',
          postUrl: eventOrFbUrl.postUrl,
          iframeSrc: eventOrFbUrl.iframeSrc,
          width: eventOrFbUrl.width || 500,
          height: eventOrFbUrl.height || 645
        };
      }
      return {
        ...prev,
        events: [newEvent, ...(prev.events || FACEBOOK_POSTS)]
      };
    }, { isContinuous: false });
  }, [saveContent]);

  const deleteEvent = useCallback((id) => {
    saveContent(prev => ({
      ...prev,
      events: (prev.events || FACEBOOK_POSTS).filter(ev => ev.id !== id)
    }), { isContinuous: false });
  }, [saveContent]);

  const updateEvent = useCallback((id, updatedData) => {
    saveContent(prev => ({
      ...prev,
      events: (prev.events || FACEBOOK_POSTS).map(ev => {
        if (ev.id === id) {
          return { ...ev, ...updatedData };
        }
        return ev;
      })
    }), { isContinuous: false });
  }, [saveContent]);

  const markAsCommitted = useCallback((committedData) => {
    const target = committedData || contentRef.current;
    const normalized = normalizeSiteContent(target) || target;
    committedBaseRef.current = normalized;
    setCommittedContent(normalized);
    setHasUncommittedChanges(false);
    try {
      localStorage.setItem(COMMITTED_STORAGE_KEY, JSON.stringify(normalized));
    } catch (err) {
      console.warn('Failed to save committed baseline to storage:', err);
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    try {
      commitContinuous();
      const current = contentRef.current;
      const newPast = [...pastRef.current.slice(-(MAX_HISTORY - 1)), current];
      pastRef.current = newPast;
      futureRef.current = [];
      setPast(newPast);
      setFuture([]);

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COMMITTED_STORAGE_KEY);
      committedBaseRef.current = defaultBaseContent;
      setCommittedContent(defaultBaseContent);
      setContent(defaultBaseContent);
      setHasUncommittedChanges(false);
      setHasLocalOverrides(false);
      return true;
    } catch (e) {
      console.error('Failed to reset content defaults:', e);
      return false;
    }
  }, [commitContinuous]);

  const exportJson = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(content, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kcc_site_content_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [content]);

  const importJson = useCallback((jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        saveContent(parsed, { isContinuous: false });
        return { success: true };
      }
      return { success: false, error: 'Malformed JSON payload' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [saveContent]);

  const value = {
    content,
    hasLocalOverrides,
    hasUncommittedChanges,
    markAsCommitted,
    committedContent,
    defaultContent: defaultSiteContent,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undoCount: past.length,
    redoCount: future.length,
    undo,
    redo,
    clearHistory,
    commitContinuous,
    saveContent,
    updateSection,
    updateHero,
    updatePrinciples,
    updatePerformance,
    addGalleryImage,
    deleteGalleryImage,
    updateGalleryImage,
    addEvent,
    deleteEvent,
    updateEvent,
    updateContact,
    updateHistory,
    addHistoryMilestone,
    updateHistoryMilestone,
    deleteHistoryMilestone,
    moveHistoryMilestone,
    updateLeadershipList,
    resetToDefaults,
    exportJson,
    importJson
  };

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
}
