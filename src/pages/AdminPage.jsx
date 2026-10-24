import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteContent, parseFacebookInput, resolveFacebookShareUrl } from '../context/SiteContentContext.jsx';
import { processImageFile, formatBytes, MAX_FILE_SIZE_MB } from '../utils/imageUpload.js';
import { commitFileToGitHub, checkGitHubProxyStatus } from '../utils/githubSync.js';
import GlassImage from '../components/GlassImage.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import {
  isFirebaseConfigured,
  firebaseProjectId,
  signInWithGoogle,
  signInWithEmail,
  sendPasswordReset,
  logOutFirebase,
  subscribeToAuth
} from '../firebase.js';

const LAST_ACTIVE_KEY = 'kcc_admin_last_active';
const GITHUB_TOKEN_STORAGE_KEY = 'kcc_admin_github_token';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
const GITHUB_REPO_URL = 'https://github.com/Sivodayan/KCC-Website';

/**
 * Validates whether a user is authenticated by Firebase.
 * User account provisioning and access control are managed directly in Firebase Console.
 */
export function isAuthorizedAdmin(user) {
  return Boolean(user && (user.uid || user.email));
}

/**
 * AdminPage Component
 *
 * Hidden management console for J/Kopay Christian College.
 * Contains only the actual customizable sections from the real website:
 * 1. Hero Section
 * 2. Motto, Vision & Mission
 * 3. Key Numbers & Performance
 * 4. Photo Gallery (PC file upload & URL management)
 * 5. School Events (Facebook iframe embeds)
 * 6. Contact Information
 * 7. Settings & Repository Backup
 */
export default function AdminPage() {
  const navigate = useNavigate();
  const {
    content,
    hasLocalOverrides,
    hasUncommittedChanges,
    markAsCommitted,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    undo,
    redo,
    commitContinuous,
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
  } = useSiteContent();

  // Firebase Authentication States
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      if (user && isAuthorizedAdmin(user)) {
        setFirebaseUser(user);
        setAuthError('');
        sessionStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      } else {
        setFirebaseUser(null);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const isAuthenticated = Boolean(firebaseUser);

  const [activeTab, setActiveTab] = useState('hero');
  const tabsContainerRef = useRef(null);

  // Auto-scroll active tab into view horizontally on mobile / touch viewports
  useEffect(() => {
    if (!isAuthenticated) return;
    const tabEl = document.getElementById(`admin-tab-${activeTab}`);
    if (tabEl && tabsContainerRef.current) {
      tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab, isAuthenticated]);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const success = undo();
    if (success) {
      showToast('Action undone (Ctrl+Z)', 'info');
    }
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const success = redo();
    if (success) {
      showToast('Action redone (Ctrl+Y)', 'info');
    }
  }, [canRedo, redo]);

  const [isAddGalleryOpen, setIsAddGalleryOpen] = useState(false);
  const [newGallerySrc, setNewGallerySrc] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [compressOption, setCompressOption] = useState(true);
  const [photoStats, setPhotoStats] = useState(null);
  const [modalFile, setModalFile] = useState(null);
  const [replaceCardIndex, setReplaceCardIndex] = useState(null);

  const multiFileInputRef = useRef(null);
  const modalFileInputRef = useRef(null);
  const cardFileInputRef = useRef(null);

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventInput, setNewEventInput] = useState('');
  const [newEventHeight, setNewEventHeight] = useState(645);
  const parsedNewEvent = parseFacebookInput(newEventInput);
  const [isResolvingFbUrl, setIsResolvingFbUrl] = useState(false);
  const [fbResolveNotice, setFbResolveNotice] = useState({ text: '', type: 'info' });

  const handleAutoResolveFbUrl = useCallback(async (urlToResolve) => {
    const url = (urlToResolve || newEventInput || '').trim();
    if (!url || !url.includes('/share/')) return;
    setIsResolvingFbUrl(true);
    setFbResolveNotice({ text: 'Resolving mobile share link to permanent Facebook post URL...', type: 'info' });
    try {
      const canonical = await resolveFacebookShareUrl(url);
      if (canonical && canonical !== url) {
        setNewEventInput(canonical);
        setFbResolveNotice({
          text: '✓ Converted to permanent post URL! The iframe preview will now load correctly.',
          type: 'success'
        });
        showToast('Converted to permanent Facebook post URL!', 'success');
      } else {
        setFbResolveNotice({
          text: 'Could not auto-resolve this share link. Please see the tip below to copy the permanent URL from Facebook.',
          type: 'warning'
        });
      }
    } catch {
      setFbResolveNotice({
        text: 'Unable to resolve link. Please copy the permanent URL by clicking the post timestamp on Facebook.',
        type: 'error'
      });
    } finally {
      setIsResolvingFbUrl(false);
    }
  }, [newEventInput]);

  useEffect(() => {
    if (!newEventInput || !newEventInput.includes('/share/')) {
      if (fbResolveNotice.text && fbResolveNotice.type !== 'success') {
        setFbResolveNotice({ text: '', type: 'info' });
      }
      return;
    }

    const timer = setTimeout(() => {
      handleAutoResolveFbUrl(newEventInput);
    }, 450);

    return () => clearTimeout(timer);
  }, [newEventInput, handleAutoResolveFbUrl, fbResolveNotice.text, fbResolveNotice.type]);

  // Manual Events State & Image Processor
  const [eventModalTab, setEventModalTab] = useState('manual'); // 'manual' | 'facebook'
  const [manualEventTitle, setManualEventTitle] = useState('');
  const [manualEventTitleTa, setManualEventTitleTa] = useState('');
  const [manualEventDate, setManualEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualEventCategory, setManualEventCategory] = useState('School Event');
  const [manualEventLocation, setManualEventLocation] = useState('');
  const [manualEventDescription, setManualEventDescription] = useState('');
  const [manualEventDescriptionTa, setManualEventDescriptionTa] = useState('');
  const [manualEventImage, setManualEventImage] = useState('');
  const [isProcessingEventPhoto, setIsProcessingEventPhoto] = useState(false);
  const [eventPhotoError, setEventPhotoError] = useState('');
  const [eventPhotoCompress, setEventPhotoCompress] = useState(true);
  const [eventPhotoStats, setEventPhotoStats] = useState(null);
  const eventPhotoInputRef = useRef(null);

  const handleEventPhotoFile = async (file) => {
    if (!file) return;
    try {
      setIsProcessingEventPhoto(true);
      setEventPhotoError('');
      const res = await processImageFile(file, { compress: eventPhotoCompress });
      setManualEventImage(res.dataUrl);
      setEventPhotoStats({
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        reductionPercent: res.reductionPercent
      });
      showToast(`Photo optimized (${formatBytes(res.compressedSize)})!`, 'success');
    } catch (err) {
      setEventPhotoError(err.message || 'Failed to process image');
      showToast(err.message || 'Image processing error', 'error');
    } finally {
      setIsProcessingEventPhoto(false);
    }
  };

  const handleAddManualEvent = (e) => {
    if (e) e.preventDefault();
    if (!manualEventTitle.trim() && !manualEventTitleTa.trim() && !manualEventImage) {
      showToast('Please provide an event title or photo', 'error');
      return;
    }
    addEvent({
      type: 'manual',
      title: manualEventTitle.trim(),
      titleTa: manualEventTitleTa.trim(),
      date: manualEventDate || new Date().toISOString().slice(0, 10),
      category: manualEventCategory.trim() || 'School Event',
      location: manualEventLocation.trim(),
      description: manualEventDescription.trim(),
      descriptionTa: manualEventDescriptionTa.trim(),
      image: manualEventImage
    });
    showToast('Event created successfully', 'success');
    setManualEventTitle('');
    setManualEventTitleTa('');
    setManualEventDate(new Date().toISOString().slice(0, 10));
    setManualEventCategory('School Event');
    setManualEventLocation('');
    setManualEventDescription('');
    setManualEventDescriptionTa('');
    setManualEventImage('');
    setEventPhotoStats(null);
    setEventPhotoError('');
    setIsAddEventOpen(false);
  };

  // Edit Manual Event State
  const [editingEvent, setEditingEvent] = useState(null);
  const [isProcessingEditPhoto, setIsProcessingEditPhoto] = useState(false);
  const [editPhotoError, setEditPhotoError] = useState('');
  const [editPhotoCompress, setEditPhotoCompress] = useState(true);
  const [editPhotoStats, setEditPhotoStats] = useState(null);
  const editEventPhotoInputRef = useRef(null);

  const handleOpenEditEvent = (post) => {
    setEditingEvent({
      id: post.id,
      title: post.title || '',
      titleTa: post.titleTa || '',
      date: post.date || new Date().toISOString().slice(0, 10),
      category: post.category || 'School Event',
      location: post.location || '',
      description: post.description || '',
      descriptionTa: post.descriptionTa || '',
      image: post.image || '',
    });
    setEditPhotoStats(null);
    setEditPhotoError('');
  };

  const handleEditEventPhotoFile = async (file) => {
    if (!file) return;
    try {
      setIsProcessingEditPhoto(true);
      setEditPhotoError('');
      const res = await processImageFile(file, { compress: editPhotoCompress });
      setEditingEvent(prev => prev ? { ...prev, image: res.dataUrl } : null);
      setEditPhotoStats({
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        reductionPercent: res.reductionPercent
      });
      showToast(`Photo updated (${formatBytes(res.compressedSize)})!`, 'success');
    } catch (err) {
      setEditPhotoError(err.message || 'Failed to process image');
      showToast(err.message || 'Image processing error', 'error');
    } finally {
      setIsProcessingEditPhoto(false);
    }
  };

  const handleSaveEditEvent = (e) => {
    if (e) e.preventDefault();
    if (!editingEvent) return;
    if (!editingEvent.title.trim() && !editingEvent.titleTa.trim() && !editingEvent.image) {
      showToast('Please provide an event title or photo', 'error');
      return;
    }
    updateEvent(editingEvent.id, {
      title: editingEvent.title.trim(),
      titleTa: editingEvent.titleTa.trim(),
      date: editingEvent.date,
      category: editingEvent.category.trim() || 'School Event',
      location: editingEvent.location.trim(),
      description: editingEvent.description.trim(),
      descriptionTa: editingEvent.descriptionTa.trim(),
      image: editingEvent.image
    });
    showToast('Event updated successfully', 'success');
    setEditingEvent(null);
  };


  // History Section States
  const [historySubTab, setHistorySubTab] = useState('milestones'); // 'milestones' | 'overview' | 'leadership'
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    year: '',
    yearTa: '',
    titleEn: '',
    titleTa: '',
    descEn: '',
    descTa: '',
    quoteEn: '',
    quoteTa: '',
    image: '',
    imageAlt: ''
  });
  const [newHeadmaster, setNewHeadmaster] = useState({ period: '', name: '' });
  const [newManager, setNewManager] = useState({ period: '', name: '' });
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const milestoneFileInputRef = useRef(null);
  const milestoneCardFileInputRef = useRef(null);
  const [replaceMilestoneIdx, setReplaceMilestoneIdx] = useState(null);
  const [isProcessingMilestonePhoto, setIsProcessingMilestonePhoto] = useState(false);
  const [milestonePhotoStats, setMilestonePhotoStats] = useState(null);
  const [milestonePhotoError, setMilestonePhotoError] = useState('');

  // GitHub Direct Commit State
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [commitError, setCommitError] = useState('');
  const [isServerProxyReady, setIsServerProxyReady] = useState(true);
  const [proxyDetails, setProxyDetails] = useState({ ready: true, isChecking: true, isProxyActive: false, configured: false, reason: '' });
  const [sessionTokenInput, setSessionTokenInput] = useState('');
  const [showSessionTokenFallback, setShowSessionTokenFallback] = useState(false);
  const [sessionTokenSaved, setSessionTokenSaved] = useState(
    typeof window !== 'undefined' ? Boolean(sessionStorage.getItem(GITHUB_TOKEN_STORAGE_KEY)) : false
  );

  const checkProxy = useCallback(async () => {
    setProxyDetails((prev) => ({ ...prev, isChecking: true }));
    try {
      const res = await checkGitHubProxyStatus();
      const ready = typeof res === 'boolean' ? res : Boolean(res?.ready);
      setIsServerProxyReady(ready);
      setProxyDetails({
        ready,
        isChecking: false,
        isProxyActive: Boolean(res?.isProxyActive),
        configured: Boolean(res?.configured),
        reason: res?.reason || ''
      });
      return ready;
    } catch (e) {
      setIsServerProxyReady(false);
      setProxyDetails({ ready: false, isChecking: false, isProxyActive: false, configured: false, reason: e.message || 'Check failed' });
      return false;
    }
  }, []);

  useEffect(() => {
    checkProxy();
  }, [checkProxy]);

  const handleSaveSessionToken = (e) => {
    if (e) e.preventDefault();
    const token = sessionTokenInput.trim();
    if (!token) return;
    sessionStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token);
    setSessionTokenSaved(true);
    setSessionTokenInput('');
    showToast('Temporary session token saved for this tab!', 'success');
  };

  const handleClearSessionToken = () => {
    sessionStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
    setSessionTokenSaved(false);
    showToast('Temporary session token removed.', 'info');
  };

  const getEffectiveGitHubToken = useCallback(() => {
    return (
      sessionStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) ||
      localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) ||
      ''
    ).trim();
  }, [sessionTokenSaved]);

  // Leave page confirmation when uncommitted changes exist
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  const handleReturnHome = () => {
    if (hasUncommittedChanges) {
      setIsLeaveConfirmOpen(true);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUncommittedChanges) {
        e.preventDefault();
        e.returnValue = 'You have uncommitted changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUncommittedChanges]);

  const handleOpenCommitModal = () => {
    commitContinuous();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    setCommitMessage(`Update website content via KCC Admin Panel [${dateStr}]`);
    setCommitResult(null);
    setCommitError('');
    setIsCommitModalOpen(true);
    checkProxy();
  };

  const handleCommitToGitHub = async (e) => {
    if (e) e.preventDefault();
    let token = getEffectiveGitHubToken();
    if (!token && sessionTokenInput.trim()) {
      token = sessionTokenInput.trim();
      sessionStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token);
      setSessionTokenSaved(true);
    }
    if (!token && !isServerProxyReady) {
      setCommitError('GitHub publishing requires a token. Please enter your GitHub Personal Access Token below or configure GITHUB_TOKEN in Cloudflare.');
      return;
    }

    setIsCommitting(true);
    setCommitError('');
    setCommitResult(null);

    try {
      const contentString = JSON.stringify(content, null, 2);
      const result = await commitFileToGitHub({
        owner: 'Sivodayan',
        repo: 'KCC-Website',
        path: 'src/data/siteContent.json',
        branch: 'main',
        token,
        contentString,
        commitMessage: commitMessage.trim() || undefined
      });

      setCommitResult(result);
      markAsCommitted(content);
      showToast(`Committed to GitHub! (${result.commitSha})`, 'success');
    } catch (err) {
      console.error('GitHub Commit Error:', err);
      setCommitError(err.message || 'Failed to commit changes to GitHub.');
      showToast(err.message || 'Commit failed', 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  // Global Keyboard shortcuts:
  // - Commit changes: Ctrl+S / Cmd+S (opens modal or commits) & Ctrl+Enter / Cmd+Enter
  // - Undo: Ctrl+Z / Cmd+Z
  // - Redo: Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z
  // - Escape: Dismiss active modal
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e) => {
      // Escape closes open modals
      if (e.key === 'Escape') {
        if (isCommitModalOpen && !isCommitting) {
          setIsCommitModalOpen(false);
          setCommitResult(null);
          setCommitError('');
        }
        if (isAddGalleryOpen) setIsAddGalleryOpen(false);
        if (isAddEventOpen) setIsAddEventOpen(false);
        if (isLeaveConfirmOpen) setIsLeaveConfirmOpen(false);
        return;
      }

      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (!cmdOrCtrl) return;

      const key = e.key.toLowerCase();

      // Commit changes: Ctrl+S / Cmd+S or Ctrl+Enter / Cmd+Enter
      if (key === 's' || e.key === 'Enter') {
        e.preventDefault();
        if (isCommitModalOpen) {
          // If modal is open, trigger commit submit
          if (!isCommitting && (isServerProxyReady || getEffectiveGitHubToken())) {
            handleCommitToGitHub();
          }
        } else {
          // Open commit modal
          handleOpenCommitModal();
        }
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z (without shift)
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAuthenticated,
    isCommitModalOpen,
    isCommitting,
    getEffectiveGitHubToken,
    isAddGalleryOpen,
    isAddEventOpen,
    isLeaveConfirmOpen,
    handleUndo,
    handleRedo,
    handleOpenCommitModal,
    handleCommitToGitHub
  ]);

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError('');
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      if (user && isAuthorizedAdmin(user)) {
        setFirebaseUser(user);
        sessionStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
        showToast(`Welcome, ${user.displayName || user.email}!`, 'success');
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup closed before completion.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site or use email sign-in.');
      } else if (err.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setAuthError(`This domain ("${host}") is not authorized in Firebase Console (Authentication > Settings > Authorized domains).`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In is not enabled in Firebase Console (Authentication > Sign-in method).');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError('');
    try {
      const result = await signInWithEmail(emailInput.trim(), passwordInput);
      const user = result.user;
      if (user && isAuthorizedAdmin(user)) {
        setFirebaseUser(user);
        sessionStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
        showToast(`Welcome, ${user.displayName || user.email}!`, 'success');
      }
    } catch (err) {
      console.error('Email Sign-In Error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('Invalid email or password.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password provider is not enabled in Firebase Console (Authentication > Sign-in method).');
      } else {
        setAuthError(err.message || 'Failed to sign in with email.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const targetEmail = (resetEmail || emailInput).trim();
    if (!targetEmail) {
      setResetError('Please enter your administrator email address.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetSuccess(false);
    try {
      await sendPasswordReset(targetEmail);
      setResetSuccess(true);
      showToast('Password reset link sent! Check your email inbox.', 'success');
    } catch (err) {
      console.error('Password Reset Error:', err);
      if (err.code === 'auth/user-not-found') {
        setResetError('No administrator account found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setResetError('Too many reset requests. Please wait a moment before trying again.');
      } else {
        setResetError(err.message || 'Failed to send password reset email.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async (reason = '') => {
    try {
      await logOutFirebase();
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    setFirebaseUser(null);
    sessionStorage.removeItem(LAST_ACTIVE_KEY);
    setEmailInput('');
    setPasswordInput('');
    if (reason) {
      setAuthError(reason);
    }
    showToast('Logged out of Admin Panel', 'info');
  };

  // Inactivity auto-logout watcher (15 minutes idle timeout)
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId = null;
    let warningTimeoutId = null;

    const resetInactivityTimer = () => {
      sessionStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));

      if (timeoutId) clearTimeout(timeoutId);
      if (warningTimeoutId) clearTimeout(warningTimeoutId);

      // Warning 1 minute before timeout
      const warningDelay = Math.max(INACTIVITY_TIMEOUT_MS - 60 * 1000, 1000);
      warningTimeoutId = setTimeout(() => {
        showToast('Session warning: Inactive for 14 minutes. Auto-lock will occur in 1 minute.', 'error');
      }, warningDelay);

      // Automatic logout on full timeout
      timeoutId = setTimeout(() => {
        handleLogout('Session expired due to 15 minutes of inactivity.');
        showToast('Logged out due to inactivity', 'error');
      }, INACTIVITY_TIMEOUT_MS);
    };

    let lastRecorded = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity recording to at most once every 2 seconds
      if (now - lastRecorded > 2000) {
        lastRecorded = now;
        resetInactivityTimer();
      }
    };

    const handleVisibilityOrFocus = () => {
      const lastActive = Number(sessionStorage.getItem(LAST_ACTIVE_KEY) || '0');
      if (lastActive && Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
        handleLogout('Session expired due to inactivity while away.');
        showToast('Logged out due to inactivity', 'error');
      } else {
        resetInactivityTimer();
      }
    };

    // Initialize timer on mount
    resetInactivityTimer();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (warningTimeoutId) clearTimeout(warningTimeoutId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isAuthenticated]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const res = importJson(text);
        if (res.success) {
          showToast('Configuration imported successfully!', 'success');
        } else {
          showToast('Import failed: ' + res.error, 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const processAndSetModalPhoto = async (file, shouldCompress) => {
    try {
      setIsProcessingPhoto(true);
      setPhotoUploadError('');
      const result = await processImageFile(file, { compress: shouldCompress });
      setNewGallerySrc(result.dataUrl);
      setPhotoStats(result);
      if (shouldCompress) {
        showToast(`Photo converted to WebP (${formatBytes(result.compressedSize)})!`, 'success');
      } else {
        showToast(`Photo loaded original format (${formatBytes(result.originalSize)})!`, 'success');
      }
    } catch (err) {
      setPhotoUploadError(err.message || 'Failed to process image');
      showToast(err.message, 'error');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleModalFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalFile(file);
    await processAndSetModalPhoto(file, compressOption);
    e.target.value = '';
  };

  const handleModalDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setModalFile(file);
    await processAndSetModalPhoto(file, compressOption);
  };

  const handleToggleCompressOption = async (newValue) => {
    setCompressOption(newValue);
    if (modalFile) {
      await processAndSetModalPhoto(modalFile, newValue);
    }
  };

  const handleDirectMultiUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setIsProcessingPhoto(true);
      const urls = [];
      const skipped = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          skipped.push(file.name);
          continue;
        }
        try {
          const result = await processImageFile(file, { compress: true });
          urls.push(result.dataUrl);
        } catch {
          skipped.push(file.name);
        }
      }
      if (urls.length > 0) {
        addGalleryImage(urls);
        showToast(`${urls.length} WebP photo(s) added to gallery!`, 'success');
      }
      if (skipped.length > 0) {
        showToast(`${skipped.length} file(s) exceeded 5MB limit and were skipped.`, 'error');
      }
    } catch (err) {
      showToast('Upload error: ' + err.message, 'error');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  const handleReplaceCardFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || replaceCardIndex === null) return;
    try {
      setIsProcessingPhoto(true);
      const result = await processImageFile(file, { compress: true });
      updateGalleryImage(replaceCardIndex, result.dataUrl);
      showToast(`Photo updated to WebP (${formatBytes(result.compressedSize)})!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessingPhoto(false);
      setReplaceCardIndex(null);
      e.target.value = '';
    }
  };

  const handleMilestoneFileSelect = async (file) => {
    if (!file) return;
    try {
      setIsProcessingMilestonePhoto(true);
      setMilestonePhotoError('');
      const result = await processImageFile(file, { compress: true, maxWidth: 1600, maxHeight: 1200 });
      setNewMilestone(prev => ({
        ...prev,
        image: result.dataUrl
      }));
      setMilestonePhotoStats(result);
      showToast(`Archival photo processed (${formatBytes(result.compressedSize)})!`, 'success');
    } catch (err) {
      setMilestonePhotoError(err.message || 'Failed to process image');
      showToast(err.message || 'Image processing failed', 'error');
    } finally {
      setIsProcessingMilestonePhoto(false);
    }
  };

  const handleMilestoneCardPhotoUpload = async (idx, file) => {
    if (!file) return;
    try {
      showToast('Processing photo...', 'info');
      const result = await processImageFile(file, { compress: true, maxWidth: 1600, maxHeight: 1200 });
      updateHistoryMilestone(idx, { image: result.dataUrl });
      showToast(`Archival photo updated (${formatBytes(result.compressedSize)})!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to process image', 'error');
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-brand-light/40 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-sm bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-xl bg-brand-light dark:bg-white border border-brand-pale dark:border-slate-200 flex items-center justify-center p-2.5 shadow-xs animate-pulse">
            <img src="/assets/logo.png" alt="KCC" className="w-full h-full object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 text-brand-forest text-xs font-bold mb-1">
            <svg className="w-4 h-4 animate-spin text-brand-forest" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Verifying Credentials...</span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Connecting to Firebase Authentication</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-light/40 flex items-center justify-center p-3 sm:p-4 selection:bg-brand-pale selection:text-brand-forest">
        <div className="w-full max-w-md bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl text-slate-800">
          <div className="text-center mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-xl bg-brand-light dark:bg-white border border-brand-pale dark:border-slate-200 flex items-center justify-center p-2.5 shadow-2xs">
              <img src="/assets/logo.png" alt="KCC" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-brand-forest">
              J/Kopay Christian College
            </h1>
            <p className="text-xs text-slate-500 font-tamil mt-1">
              யா/ கோப்பாய் கிறிஸ்தவ கல்லூரி
            </p>

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-block px-3 py-1 rounded-full bg-brand-light dark:bg-emerald-950/60 border border-brand-pale dark:border-emerald-800/40 text-[11px] font-bold text-brand-forest dark:text-emerald-400">
                Admin Console
              </span>
            
             
            </div>
          </div>

          {/* FIREBASE AUTHENTICATION (GOOGLE + EMAIL & PASSWORD + FORGOT PASSWORD) */}
          <div className="space-y-4">
            {isForgotPassword ? (
              /* Forgot / Reset Password View */
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-brand-light dark:bg-emerald-950/50 border border-brand-pale dark:border-emerald-800/40 text-xs">
                  <div className="font-bold text-brand-forest dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Reset Admin Password</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Enter your registered administrator email address and we'll send you a secure link to reset your password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@jkcc.edu.lk"
                    required
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white dark:bg-[#0e160f] border border-brand-pale dark:border-emerald-800/40 text-slate-800 dark:text-slate-100 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                {resetSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-medium space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Password reset email sent!</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Check your inbox at <span className="font-semibold underline">{resetEmail}</span> for instructions to reset your password.
                    </p>
                  </div>
                )}

                {resetError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-brand-forest hover:bg-brand-forestHover text-white font-bold text-xs sm:text-sm shadow-2xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {resetLoading ? (
                    <span>Sending Reset Link...</span>
                  ) : (
                    <>
                      <span>Send Password Reset Email</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetError('');
                      setResetSuccess(false);
                    }}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-forest dark:hover:text-emerald-400 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Normal Sign-In Form */
              <>
                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-brand-pale bg-white hover:bg-brand-light/70 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-brand-pale w-full" />
                  <span className="bg-brand-white px-2.5 text-[11px] text-slate-400 font-medium uppercase tracking-wider shrink-0">
                    or sign in with email
                  </span>
                  <div className="border-t border-brand-pale w-full" />
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="admin@jkcc.edu.lk"
                      required
                      className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setResetEmail(emailInput.trim());
                          setResetError('');
                          setResetSuccess(false);
                        }}
                        className="text-[11px] font-bold text-brand-forest dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter account password"
                        required
                        className="w-full px-3.5 py-2.5 sm:py-2 pr-11 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 cursor-pointer touch-manipulation"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-brand-forest hover:bg-brand-forestHover text-white font-bold text-xs sm:text-sm shadow-2xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAuthLoading ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <span>Sign In with Email</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="pt-3 border-t border-brand-pale/70 text-center">
              <p className="text-[11px] text-slate-400">
                Authorized Personnel Only 
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light/30 text-slate-800 flex flex-col font-sans selection:bg-brand-pale selection:text-brand-forest">
      {toast.show && (
        <div
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold transition-all transform animate-bounce duration-300 max-w-sm sm:max-w-md mx-auto sm:mx-0 ${toast.type === 'error'
              ? 'bg-rose-50 border border-rose-300 text-rose-800'
              : toast.type === 'info'
              ? 'bg-slate-900 border border-slate-700 text-white shadow-2xl'
              : 'bg-brand-light border border-brand-pale text-brand-forest'
            }`}
        >
          {toast.type === 'error' ? (
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : toast.type === 'info' ? (
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 10h10a5 5 0 0 1 5 5v2m0 0l-4-4m4 4l4-4M3 10l4-4m-4 4l4 4" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-brand-forest shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="truncate">{toast.message}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-brand-white border-b border-brand-pale shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={handleReturnHome}
                className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer focus:outline-none rounded-xl p-1 -m-1 transition hover:bg-brand-light/60 active:scale-[0.98] min-w-0"
                title="Return to Website Home Page"
                aria-label="Return to Home Page"
              >
                <div
                  className="school-crest-badge relative shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl p-1 shadow-xs dark:shadow-[0_0_10px_rgba(74,222,128,0.35)] flex items-center justify-center"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain transition group-hover:scale-105" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-brand-forest text-xs sm:text-base tracking-tight group-hover:text-brand-forestHover truncate">
                      <span className="hidden sm:inline">J/Kopay Christian College</span>
                      <span className="sm:hidden">KCC Admin</span>
                    </span>
                    <span className="sm:hidden px-1.5 py-0.2 rounded bg-brand-light text-brand-forest text-[9px] font-bold uppercase tracking-wider shrink-0">
                      Live
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-tamil truncate hidden xs:block">
                    <span>யா/ கோப்பாய் கிறிஸ்தவ கல்லூரி</span>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Undo / Redo History Controls */}
              <div className="inline-flex items-center rounded-full bg-brand-white border border-brand-pale p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title={canUndo ? `Undo last change (Ctrl+Z) • ${undoCount} step${undoCount > 1 ? 's' : ''} available` : 'Nothing to undo (Ctrl+Z)'}
                  aria-label="Undo last change"
                  className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none ${
                    canUndo
                      ? 'text-slate-700 hover:text-brand-forest hover:bg-brand-light active:scale-95'
                      : 'text-slate-300 cursor-not-allowed opacity-50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M3 10h10a5 5 0 0 1 5 5v2m0 0l-4-4m4 4l4-4M3 10l4-4m-4 4l4 4" />
                  </svg>
                  <span className="hidden sm:inline">Undo</span>
                  {undoCount > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-brand-pale/70 text-brand-forest">
                      {undoCount}
                    </span>
                  )}
                </button>

                <div className="w-[1px] h-4 bg-brand-pale" />

                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title={canRedo ? `Redo change (Ctrl+Y or Ctrl+Shift+Z) • ${redoCount} step${redoCount > 1 ? 's' : ''} available` : 'Nothing to redo (Ctrl+Y)'}
                  aria-label="Redo change"
                  className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none ${
                    canRedo
                      ? 'text-slate-700 hover:text-brand-forest hover:bg-brand-light active:scale-95'
                      : 'text-slate-300 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="hidden sm:inline">Redo</span>
                  {redoCount > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-brand-pale/70 text-brand-forest">
                      {redoCount}
                    </span>
                  )}
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M21 10H11a5 5 0 0 0-5 5v2m0 0l4-4m-4 4l-4-4m20-3l-4-4m4 4l-4 4" />
                  </svg>
                </button>
              </div>

              {/* Commit to GitHub Button */}
              <button
                type="button"
                onClick={handleOpenCommitModal}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs shrink-0 ${
                  hasUncommittedChanges
                    ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-400/40 shadow-amber-900/20'
                    : 'bg-brand-forest hover:bg-brand-forestHover'
                }`}
                title={hasUncommittedChanges ? "You have uncommitted changes. Click to commit to GitHub (Ctrl+S)" : "All changes committed to GitHub (Ctrl+S)"}
              >
                {hasUncommittedChanges ? (
                  <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse shrink-0" />
                ) : (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                )}
                <span>{hasUncommittedChanges ? 'Save Changes *' : 'Save Changes'}</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.2 rounded bg-white/20 text-[10px] font-mono font-medium text-white/90">
                  Ctrl+S
                </kbd>
              </button>

              {/* Authenticated Firebase User Badge */}
              <div
                className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-white border border-brand-pale text-xs shadow-2xs"
                title={`Signed in as ${firebaseUser?.email || 'Admin'}`}
              >
                {firebaseUser?.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                )}
                <span className='flex items-center gap-2'>
                  {firebaseUser?.displayName || firebaseUser?.email || 'Admin'}
                </span>
              </div>

              {/* Appearance Theme Switcher */}
              <ThemeToggle variant="compact" />

              {/* Logout button */}
              <button
                type="button"
                onClick={() => handleLogout()}
                className="p-1.5 sm:p-2 rounded-full bg-brand-white border border-brand-pale text-slate-500 hover:text-rose-600 hover:bg-brand-light transition cursor-pointer shadow-2xs shrink-0"
                title={firebaseUser?.email ? `Sign out (${firebaseUser.email})` : 'Sign out of Admin Panel'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Touch-Friendly Horizontal Scrolling Navigation Tabs */}
          <div
            ref={tabsContainerRef}
            className="admin-tabs-scroll flex items-center gap-1.5 py-2 border-t border-brand-pale/70 text-xs px-0.5"
          >
            {[
              {
                id: 'hero',
                label: 'Hero',
                fullLabel: 'Hero Section',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                id: 'principles',
                label: 'Motto & Vision',
                fullLabel: 'Motto, Vision & Mission',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )
              },
              {
                id: 'performance',
                label: 'Key Numbers',
                fullLabel: 'Performance',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                id: 'history',
                label: 'History',
                fullLabel: 'History & Heritage',
                badge: (content.history?.milestones?.length || 12),
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )
              },
              {
                id: 'gallery',
                label: 'Gallery',
                fullLabel: 'Photo Gallery',
                badge: content.gallery?.length,
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              },
              {
                id: 'events',
                label: 'Events',
                fullLabel: 'School Events',
                badge: content.events?.length,
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                id: 'contact',
                label: 'Contact',
                fullLabel: 'Contact Info',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                id: 'settings',
                label: 'Settings',
                fullLabel: 'Settings & Sync',
                icon: (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              }
            ].map(tab => (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                onClick={() => {
                  commitContinuous();
                  setActiveTab(tab.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-semibold text-xs shrink-0 select-none ${
                  activeTab === tab.id
                    ? 'bg-brand-forest text-white shadow-2xs'
                    : 'text-slate-600 hover:text-brand-forest hover:bg-brand-pale/60 bg-brand-white border border-brand-pale/70'
                }`}
              >
                {tab.icon}
                <span>
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                </span>
                {typeof tab.badge === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-forest'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* HERO SECTION */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <h2 className="text-base sm:text-lg font-bold text-brand-forest mb-4 sm:mb-5">Hero Section</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">School Name (English)</label>
                  <input
                    type="text"
                    value={content.hero?.title || ''}
                    onChange={(e) => updateHero({ title: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">School Name (Tamil)</label>
                  <input
                    type="text"
                    value={content.hero?.tamilTitle || ''}
                    onChange={(e) => updateHero({ tamilTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-sm font-tamil focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hero Subtitle</label>
                  <textarea
                    rows={3}
                    value={content.hero?.subtitle || ''}
                    onChange={(e) => updateHero({ subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Background Image Path</label>
                  <input
                    type="text"
                    value={content.hero?.image || ''}
                    onChange={(e) => updateHero({ image: e.target.value })}
                    placeholder="/assets/hero.jpg"
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Button Text</label>
                  <input
                    type="text"
                    value={content.hero?.buttonText || ''}
                    onChange={(e) => updateHero({ buttonText: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-brand-pale">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 sm:mb-3">Live Card Preview</span>
                <div className="relative rounded-2xl overflow-hidden bg-brand-forest border border-brand-soft/40 p-5 sm:p-8 text-white min-h-[160px] flex items-center shadow-md">
                  <div className="relative z-10 max-w-xl">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">{content.hero?.title}</h3>
                    <h4 className="text-base sm:text-lg font-bold text-brand-pale font-tamil mt-1">{content.hero?.tamilTitle}</h4>
                    <p className="text-xs sm:text-sm text-brand-light/90 mt-2 leading-relaxed">{content.hero?.subtitle}</p>
                    <div className="mt-4">
                      <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white text-brand-forest font-bold text-xs shadow-2xs">
                        {content.hero?.buttonText} →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MOTTO, VISION & MISSION */}
        {activeTab === 'principles' && (
          <div className="space-y-6">
            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <h2 className="text-base sm:text-lg font-bold text-brand-forest mb-1.5 sm:mb-2">Motto, Vision &amp; Mission</h2>
              <p className="text-xs text-slate-600 mb-4 sm:mb-6">
                Customize the three core institutional pillars displayed in the interactive flip cards on the home page.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Motto */}
                <div className="bg-brand-light/40 border border-brand-pale rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="text-xs font-bold text-brand-forest uppercase tracking-wider">Motto (மகுடவாசகம்)</div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">English</label>
                    <input
                      type="text"
                      value={content.principles?.motto?.english || ''}
                      onChange={(e) => updatePrinciples({ motto: { ...content.principles?.motto, english: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-bold focus:outline-none focus:border-brand-forest"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tamil</label>
                    <input
                      type="text"
                      value={content.principles?.motto?.tamil || ''}
                      onChange={(e) => updatePrinciples({ motto: { ...content.principles?.motto, tamil: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-bold font-tamil focus:outline-none focus:border-brand-forest"
                    />
                  </div>
                </div>

                {/* Vision */}
                <div className="bg-brand-light/40 border border-brand-pale rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="text-xs font-bold text-brand-forest uppercase tracking-wider">Vision (தூரநோக்கு)</div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">English</label>
                    <textarea
                      rows={3}
                      value={content.principles?.vision?.english || ''}
                      onChange={(e) => updatePrinciples({ vision: { ...content.principles?.vision, english: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs focus:outline-none focus:border-brand-forest leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tamil</label>
                    <textarea
                      rows={3}
                      value={content.principles?.vision?.tamil || ''}
                      onChange={(e) => updatePrinciples({ vision: { ...content.principles?.vision, tamil: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-tamil focus:outline-none focus:border-brand-forest leading-relaxed"
                    />
                  </div>
                </div>

                {/* Mission */}
                <div className="bg-brand-light/40 border border-brand-pale rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="text-xs font-bold text-brand-forest uppercase tracking-wider">Mission (நோக்கக்கூற்று)</div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">English</label>
                    <textarea
                      rows={4}
                      value={content.principles?.mission?.english || ''}
                      onChange={(e) => updatePrinciples({ mission: { ...content.principles?.mission, english: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs focus:outline-none focus:border-brand-forest leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tamil</label>
                    <textarea
                      rows={4}
                      value={content.principles?.mission?.tamil || ''}
                      onChange={(e) => updatePrinciples({ mission: { ...content.principles?.mission, tamil: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-tamil focus:outline-none focus:border-brand-forest leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* 1. SECTION HEADINGS & SUBTITLE */}
            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-brand-pale/60 flex-wrap gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-brand-forest">
                    Performance Section Headings &amp; Intro
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Edit the main title and descriptive text shown above the key statistics grid.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Section Header
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section Heading / Title
                  </label>
                  <input
                    type="text"
                    value={content.performance?.title ?? 'Key Numbers & Performance'}
                    onChange={(e) => updatePerformance({ title: e.target.value })}
                    placeholder="Key Numbers & Performance"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section Subtitle / Description Text
                  </label>
                  <textarea
                    rows={2}
                    value={content.performance?.subtitle ?? 'Measurable records reflecting academic commitment, teacher mentorship, and co-curricular vibrancy.'}
                    onChange={(e) => updatePerformance({ subtitle: e.target.value })}
                    placeholder="Measurable records reflecting academic commitment, teacher mentorship, and co-curricular vibrancy."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 2. ALL 8 STATISTIC METRIC TILES */}
            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-6 border-b border-brand-pale/60 flex-wrap gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-brand-forest">
                    Key Performance Metrics ({8} Tiles)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Edit every tile's numeric value, heading/title, subtitle descriptor, and optional suffix.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-brand-light text-brand-forest font-semibold text-[11px] border border-brand-pale">
                  Live Synced
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                {[
                  {
                    id: 'founded',
                    defaultHeading: 'Founded Year',
                    defaultSub: 'Peninsula Heritage',
                    defaultVal: 1852,
                    defaultSuffix: '',
                    isText: false,
                    valueKey: 'founded',
                    labelKey: 'foundedLabel',
                    subKey: 'foundedSub',
                    suffixKey: 'foundedSuffix',
                  },
                  {
                    id: 'students',
                    defaultHeading: 'Enrolled Students',
                    defaultSub: 'Secondary to Collegiate',
                    defaultVal: 386,
                    defaultSuffix: '+',
                    isText: false,
                    valueKey: 'students',
                    labelKey: 'studentsLabel',
                    subKey: 'studentsSub',
                    suffixKey: 'studentsSuffix',
                  },
                  {
                    id: 'staff',
                    defaultHeading: 'Teaching Staff',
                    defaultSub: 'Dedicated Faculty',
                    defaultVal: 46,
                    defaultSuffix: '',
                    isText: false,
                    valueKey: 'staff',
                    labelKey: 'staffLabel',
                    subKey: 'staffSub',
                    suffixKey: 'staffSuffix',
                  },
                  {
                    id: 'olPass',
                    defaultHeading: 'G.C.E. O/L Pass Rate',
                    defaultSub: 'National Examination',
                    defaultVal: 94.2,
                    defaultSuffix: '%',
                    isText: false,
                    step: 'any',
                    valueKey: 'olPass',
                    labelKey: 'olPassLabel',
                    subKey: 'olPassSub',
                    suffixKey: 'olPassSuffix',
                  },
                  {
                    id: 'grades',
                    defaultHeading: 'School Grades',
                    defaultSub: 'Grades from 6 to 13',
                    defaultVal: '6 – 13',
                    defaultSuffix: '',
                    isText: true,
                    valueKey: 'grades',
                    labelKey: 'gradesLabel',
                    subKey: 'gradesSub',
                    suffixKey: 'gradesSuffix',
                  },
                  {
                    id: 'alQual',
                    defaultHeading: 'University Qualifying',
                    defaultSub: 'G.C.E. A/L Streams',
                    defaultVal: 78,
                    defaultSuffix: '%',
                    isText: false,
                    valueKey: 'alQual',
                    labelKey: 'alQualLabel',
                    subKey: 'alQualSub',
                    suffixKey: 'alQualSuffix',
                  },
                  {
                    id: 'clubs',
                    defaultHeading: 'Clubs & Societies',
                    defaultSub: 'Co-Curricular Groups',
                    defaultVal: 18,
                    defaultSuffix: '',
                    isText: false,
                    valueKey: 'clubs',
                    labelKey: 'clubsLabel',
                    subKey: 'clubsSub',
                    suffixKey: 'clubsSuffix',
                  },
                  {
                    id: 'houses',
                    defaultHeading: 'Competitive Houses',
                    defaultSub: 'Annual Sports Division',
                    defaultVal: 4,
                    defaultSuffix: '',
                    isText: false,
                    valueKey: 'houses',
                    labelKey: 'housesLabel',
                    subKey: 'housesSub',
                    suffixKey: 'housesSuffix',
                  },
                ].map((stat, sIdx) => {
                  const currentVal = content.performance?.[stat.valueKey] ?? stat.defaultVal;
                  const currentLabel = content.performance?.[stat.labelKey] ?? stat.defaultHeading;
                  const currentSub = content.performance?.[stat.subKey] ?? stat.defaultSub;
                  const currentSuffix = content.performance?.[stat.suffixKey] ?? stat.defaultSuffix;

                  return (
                    <div
                      key={stat.id}
                      className="rounded-2xl border border-brand-pale bg-brand-light/20 p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-brand-forest/40 transition-all space-y-4"
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between gap-2 border-b border-brand-pale/60 pb-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-brand-forest text-white text-[10px] font-bold">
                          #{sIdx + 1}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Metric Tile
                        </span>
                      </div>

                      {/* Live Mini Preview Box */}
                      <div className="p-3.5 rounded-xl bg-white border border-brand-pale shadow-2xs text-center">
                        <p className="text-2xl sm:text-3xl font-extrabold text-brand-forest font-sans">
                          {currentVal}{currentSuffix}
                        </p>
                        <p className="text-[11px] uppercase font-bold text-emerald-800 mt-1 line-clamp-1">
                          {currentLabel}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {currentSub}
                        </p>
                      </div>

                      {/* Inputs for Value, Heading, Subtitle, Suffix */}
                      <div className="space-y-3 pt-1">
                        {/* Value and Suffix */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Value / Number *
                            </label>
                            <input
                              type={stat.isText ? "text" : "number"}
                              step={stat.step || (stat.isText ? undefined : "any")}
                              value={currentVal}
                              onChange={(e) => updatePerformance({
                                [stat.valueKey]: stat.isText ? e.target.value : (e.target.value === '' ? '' : Number(e.target.value))
                              })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-brand-pale text-brand-forest font-mono font-bold text-sm focus:outline-none focus:border-brand-forest"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Suffix
                            </label>
                            <input
                              type="text"
                              value={currentSuffix}
                              onChange={(e) => updatePerformance({ [stat.suffixKey]: e.target.value })}
                              placeholder="+, %"
                              className="w-full px-2 py-1.5 rounded-lg bg-white border border-brand-pale text-slate-800 text-xs font-mono font-bold text-center focus:outline-none focus:border-brand-forest"
                            />
                          </div>
                        </div>

                        {/* Heading / Label */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Card Heading / Title *
                          </label>
                          <input
                            type="text"
                            value={currentLabel}
                            onChange={(e) => updatePerformance({ [stat.labelKey]: e.target.value })}
                            placeholder={stat.defaultHeading}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-brand-pale text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand-forest"
                          />
                        </div>

                        {/* Subtitle / Description */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Card Subtitle / Description
                          </label>
                          <input
                            type="text"
                            value={currentSub}
                            onChange={(e) => updatePerformance({ [stat.subKey]: e.target.value })}
                            placeholder={stat.defaultSub}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-brand-pale text-slate-700 text-xs focus:outline-none focus:border-brand-forest"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* HISTORY & HERITAGE */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-brand-forest">
                      History &amp; Archival Heritage
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-light text-brand-forest border border-brand-pale">
                      {(content.history?.milestones?.length || 0)} Milestones
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Manage historical treatises, chronological milestones, archival photographs (1849–present), and leadership lineages for the <span className="font-mono text-brand-forest font-semibold">/history</span> portal.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <a
                    href="/history"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-light border border-brand-pale hover:bg-brand-pale/70 text-brand-forest text-xs font-bold transition shadow-2xs"
                  >
                    <span>View /history Page</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  {historySubTab === 'milestones' && (
                    <button
                      type="button"
                      onClick={() => setIsAddMilestoneOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Milestone</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-brand-pale pb-3 pt-1">
                <button
                  type="button"
                  onClick={() => setHistorySubTab('milestones')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    historySubTab === 'milestones'
                      ? 'bg-brand-forest text-white shadow-2xs'
                      : 'bg-brand-light text-slate-600 hover:text-brand-forest hover:bg-brand-pale/60'
                  }`}
                >
                  Chronological Milestones ({(content.history?.milestones?.length || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setHistorySubTab('overview')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    historySubTab === 'overview'
                      ? 'bg-brand-forest text-white shadow-2xs'
                      : 'bg-brand-light text-slate-600 hover:text-brand-forest hover:bg-brand-pale/60'
                  }`}
                >
                  Treatise Overview &amp; Authors
                </button>
                <button
                  type="button"
                  onClick={() => setHistorySubTab('leadership')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    historySubTab === 'leadership'
                      ? 'bg-brand-forest text-white shadow-2xs'
                      : 'bg-brand-light text-slate-600 hover:text-brand-forest hover:bg-brand-pale/60'
                  }`}
                >
                  Leadership Directory ({((content.history?.headmasters?.length || 0) + (content.history?.managers?.length || 0))})
                </button>
              </div>

              {/* SUBTAB 1: CHRONOLOGICAL MILESTONES */}
              {historySubTab === 'milestones' && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>
                      Showing {content.history?.milestones?.length || 0} chronological milestones. You can reorder, edit bilingual narratives, quotes, and archival photos.
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddMilestoneOpen(true)}
                      className="text-brand-forest hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ New Milestone</span>
                    </button>
                  </div>

                  {(!content.history?.milestones || content.history.milestones.length === 0) ? (
                    <div className="p-8 text-center bg-brand-light/20 border border-brand-pale rounded-2xl">
                      <p className="text-sm font-semibold text-slate-600">No milestones currently recorded.</p>
                      <button
                        type="button"
                        onClick={() => setIsAddMilestoneOpen(true)}
                        className="mt-3 px-4 py-2 rounded-full bg-brand-forest text-white text-xs font-bold cursor-pointer"
                      >
                        Add First Milestone
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="file"
                        ref={milestoneCardFileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && replaceMilestoneIdx !== null) {
                            handleMilestoneCardPhotoUpload(replaceMilestoneIdx, file);
                          }
                          e.target.value = '';
                          setReplaceMilestoneIdx(null);
                        }}
                      />
                      {content.history.milestones.map((m, idx) => {
                        const isExpanded = expandedMilestones[m.id || idx] !== false;
                        return (
                          <div
                            key={m.id || idx}
                            className="bg-brand-white border border-brand-pale hover:border-brand-soft/70 rounded-2xl p-4 sm:p-5 transition shadow-2xs space-y-4"
                          >
                            {/* Card Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-pale/60">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-brand-forest text-white text-xs font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-brand-light border border-brand-pale text-brand-forest font-bold text-xs font-mono">
                                  {m.year || m.yearTa || 'Era'}
                                </span>
                                <h3 className="font-bold text-sm text-slate-900 truncate">
                                  {m.titleEn || m.titleTa || 'Untitled Milestone'}
                                </h3>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveHistoryMilestone(idx, -1)}
                                  className={`p-1.5 rounded-lg border text-slate-600 hover:text-brand-forest transition ${
                                    idx === 0 ? 'opacity-30 cursor-not-allowed border-slate-200' : 'cursor-pointer hover:bg-brand-light border-brand-pale'
                                  }`}
                                  title="Move Earlier in Timeline"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === (content.history.milestones.length - 1)}
                                  onClick={() => moveHistoryMilestone(idx, 1)}
                                  className={`p-1.5 rounded-lg border text-slate-600 hover:text-brand-forest transition ${
                                    idx === (content.history.milestones.length - 1) ? 'opacity-30 cursor-not-allowed border-slate-200' : 'cursor-pointer hover:bg-brand-light border-brand-pale'
                                  }`}
                                  title="Move Later in Timeline"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedMilestones(prev => ({
                                      ...prev,
                                      [m.id || idx]: !isExpanded
                                    }));
                                  }}
                                  className="p-1.5 rounded-lg border border-brand-pale hover:bg-brand-light text-slate-600 text-xs font-semibold cursor-pointer"
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete milestone "${m.titleEn || m.titleTa}"?`)) {
                                      deleteHistoryMilestone(idx);
                                      showToast('Milestone removed', 'info');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                                  title="Delete Milestone"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Collapsible Content */}
                            {isExpanded && (
                              <div className="space-y-4 pt-1">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                  {/* Left: Archival Photo & Path */}
                                  <div className="md:col-span-4 space-y-3 bg-brand-light/30 border border-brand-pale rounded-xl p-3">
                                    <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Archival Photograph</span>
                                    {m.image ? (
                                      <div className="relative rounded-lg overflow-hidden bg-brand-pale/40 border border-brand-pale aspect-video flex items-center justify-center">
                                        <GlassImage
                                          src={m.image}
                                          alt={m.imageAlt || m.titleEn}
                                          containerClassName="w-full h-full flex items-center justify-center"
                                          className="w-full h-full object-contain mx-auto"
                                        />
                                      </div>
                                    ) : (
                                      <div className="rounded-lg bg-slate-100 text-slate-400 aspect-video flex items-center justify-center text-xs">
                                        No Image Assigned
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplaceMilestoneIdx(idx);
                                        milestoneCardFileInputRef.current?.click();
                                      }}
                                      className="w-full py-1.5 px-3 rounded-lg bg-brand-white hover:bg-brand-light border border-brand-pale text-brand-forest font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                      </svg>
                                      <span>Upload Image Directly</span>
                                    </button>

                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Image Path / URL</label>
                                      <input
                                        type="text"
                                        value={m.image || ''}
                                        onChange={(e) => updateHistoryMilestone(idx, { image: e.target.value })}
                                        placeholder="/assets/his1.jpg"
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-xs font-mono focus:outline-none focus:border-brand-forest"
                                      />
                                    </div>

                                    <div>
                                      <span className="block text-[10px] font-semibold text-slate-500 mb-1.5">Quick Archival Presets:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                          <button
                                            key={n}
                                            type="button"
                                            onClick={() => updateHistoryMilestone(idx, { image: `/assets/his${n}.jpg` })}
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
                                              m.image === `/assets/his${n}.jpg`
                                                ? 'bg-brand-forest text-white'
                                                : 'bg-white border border-brand-pale text-slate-600 hover:bg-brand-light'
                                            }`}
                                          >
                                            his{n}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Bilingual Year, Titles, Narratives & Quotes */}
                                  <div className="md:col-span-8 space-y-3.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Era / Year (English)</label>
                                        <input
                                          type="text"
                                          value={m.year || ''}
                                          onChange={(e) => updateHistoryMilestone(idx, { year: e.target.value })}
                                          placeholder="e.g. 1849–1850"
                                          className="w-full px-3 py-1.5 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-xs font-bold focus:outline-none focus:border-brand-forest"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">காலம் / ஆண்டு (Tamil)</label>
                                        <input
                                          type="text"
                                          value={m.yearTa || ''}
                                          onChange={(e) => updateHistoryMilestone(idx, { yearTa: e.target.value })}
                                          placeholder="எ.கா. 1849–1850"
                                          className="w-full px-3 py-1.5 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-xs font-bold font-tamil focus:outline-none focus:border-brand-forest"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Title (English)</label>
                                        <input
                                          type="text"
                                          value={m.titleEn || ''}
                                          onChange={(e) => updateHistoryMilestone(idx, { titleEn: e.target.value })}
                                          placeholder="Milestone title in English"
                                          className="w-full px-3 py-1.5 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-xs font-bold focus:outline-none focus:border-brand-forest"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">தலைப்பு (Tamil)</label>
                                        <input
                                          type="text"
                                          value={m.titleTa || ''}
                                          onChange={(e) => updateHistoryMilestone(idx, { titleTa: e.target.value })}
                                          placeholder="மைல்கல் தலைப்பு (தமிழ்)"
                                          className="w-full px-3 py-1.5 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-xs font-bold font-tamil focus:outline-none focus:border-brand-forest"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Narrative Description (English)</label>
                                        <textarea
                                          rows={4}
                                          value={m.descEn || ''}
                                          onChange={(e) => updateHistoryMilestone(idx, { descEn: e.target.value })}
                                          placeholder="Historical account in English..."
                                          className="w-full px-3 py-2 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-xs leading-relaxed focus:outline-none focus:border-brand-forest"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">வரலாற்றுக் குறிப்பு (Tamil)</label>
                                        <textarea
                                          rows={4}
                                          value={m.descTa || ''}
                                          onChange={(e) => updateHistoryMilestone(idx, { descTa: e.target.value })}
                                          placeholder="வரலாற்றுக் குறிப்பு (தமிழ்)..."
                                          className="w-full px-3 py-2 rounded-lg bg-brand-white border border-brand-pale text-slate-800 text-xs font-tamil leading-relaxed focus:outline-none focus:border-brand-forest"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Archival Quote / Excerpt (English - Optional)</label>
                                        <textarea
                                          rows={2}
                                          value={m.quoteEn || ''}
                                          onChange={(e) => updateHistoryMilestone(idx, { quoteEn: e.target.value })}
                                          placeholder="“Historical blockquote quote...”"
                                          className="w-full px-3 py-1.5 rounded-lg bg-brand-light/30 border border-brand-pale text-slate-800 text-xs italic focus:outline-none focus:border-brand-forest"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">ஆவண மேற்கோள் (Tamil - விருப்பத்தேர்வு)</label>
                                        <textarea
                                          rows={2}
                                          value={m.quoteTa || ''}
                                          onChange={(e) => updateHistoryMilestone(idx, { quoteTa: e.target.value })}
                                          placeholder="“வரலாற்று ஆவண மேற்கோள்...”"
                                          className="w-full px-3 py-1.5 rounded-lg bg-brand-light/30 border border-brand-pale text-slate-800 text-xs font-tamil italic focus:outline-none focus:border-brand-forest"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: TREATISE OVERVIEW & AUTHORS */}
              {historySubTab === 'overview' && (
                <div className="mt-6 space-y-6 max-w-4xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatise Title (English)</label>
                      <input
                        type="text"
                        value={content.history?.overview?.titleEn || ''}
                        onChange={(e) => updateHistory({ overview: { ...content.history?.overview, titleEn: e.target.value } })}
                        placeholder="CMS English School & Today’s Christian College"
                        className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-sm focus:outline-none focus:border-brand-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatise Title (Tamil)</label>
                      <input
                        type="text"
                        value={content.history?.overview?.titleTa || ''}
                        onChange={(e) => updateHistory({ overview: { ...content.history?.overview, titleTa: e.target.value } })}
                        placeholder="CMS ஆங்கிலப் பாடசாலையும் இன்றைய கிறிஸ்தவ கல்லூரியும்"
                        className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-sm font-tamil focus:outline-none focus:border-brand-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Compiled By / Authors (English)</label>
                      <input
                        type="text"
                        value={content.history?.overview?.authorsEn || ''}
                        onChange={(e) => updateHistory({ overview: { ...content.history?.overview, authorsEn: e.target.value } })}
                        placeholder="Rev. J. S. Ratnathikkam & Rev. A. M. Nathaniel"
                        className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-sm focus:outline-none focus:border-brand-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">ஆசிரியர்கள் / தொகுப்பாளர்கள் (Tamil)</label>
                      <input
                        type="text"
                        value={content.history?.overview?.authorsTa || ''}
                        onChange={(e) => updateHistory({ overview: { ...content.history?.overview, authorsTa: e.target.value } })}
                        placeholder="வண. J. S. இரட்ணாதிக்கம் & வண. A. M. நத்தானியல்"
                        className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-sm font-tamil focus:outline-none focus:border-brand-forest"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lead / Brief Summary (English)</label>
                      <textarea
                        rows={2}
                        value={content.history?.overview?.leadEn || ''}
                        onChange={(e) => updateHistory({ overview: { ...content.history?.overview, leadEn: e.target.value } })}
                        placeholder="An archival chronology tracing foundational origins..."
                        className="w-full px-3.5 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs leading-relaxed focus:outline-none focus:border-brand-forest"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">அறிமுக உரை (Tamil)</label>
                      <textarea
                        rows={2}
                        value={content.history?.overview?.leadTa || ''}
                        onChange={(e) => updateHistory({ overview: { ...content.history?.overview, leadTa: e.target.value } })}
                        placeholder="1849 முதல் இன்றைய கல்லூரி வரையிலான வரலாற்றுத் தடங்களின் ஆவணத் தொகுப்பு..."
                        className="w-full px-3.5 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs font-tamil leading-relaxed focus:outline-none focus:border-brand-forest"
                      />
                    </div>
                  </div>

                  {/* Header Banner Preview */}
                  <div className="pt-4 border-t border-brand-pale">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Portal Header Preview</span>
                    <div className="bg-brand-light/50 border border-brand-pale rounded-2xl p-6 text-center space-y-2">
                      <h4 className="text-xl font-bold text-brand-forest">{content.history?.overview?.titleEn || 'CMS English School'}</h4>
                      <h5 className="text-base font-bold text-brand-forest font-tamil">{content.history?.overview?.titleTa || 'CMS ஆங்கிலப் பாடசாலை'}</h5>
                      <p className="text-xs text-slate-600 font-medium">
                        Compiled by: <span className="font-bold text-slate-800">{content.history?.overview?.authorsEn}</span>
                      </p>
                      {content.history?.overview?.leadEn && (
                        <p className="text-xs text-slate-600 max-w-xl mx-auto italic pt-1">{content.history.overview.leadEn}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: LEADERSHIP DIRECTORY */}
              {historySubTab === 'leadership' && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Headmasters Card */}
                  <div className="bg-brand-light/40 border border-brand-pale rounded-2xl p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-pale">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-brand-forest text-white text-xs font-bold flex items-center justify-center">
                          HM
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-brand-forest">Headmasters (தலைமையாசிரியர்கள்)</h3>
                          <span className="text-[11px] text-slate-500">{(content.history?.headmasters?.length || 0)} Recorded</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Headmaster Row */}
                    <div className="p-3 bg-brand-white border border-brand-pale rounded-xl space-y-2">
                      <span className="block text-[11px] font-bold text-slate-700">Add New Headmaster</span>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <input
                          type="text"
                          value={newHeadmaster.period}
                          onChange={(e) => setNewHeadmaster(prev => ({ ...prev, period: e.target.value }))}
                          placeholder="Period (e.g. 1944–1948)"
                          className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-brand-pale text-xs"
                        />
                        <input
                          type="text"
                          value={newHeadmaster.name}
                          onChange={(e) => setNewHeadmaster(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Full Name"
                          className="sm:col-span-3 px-2.5 py-1.5 rounded-lg border border-brand-pale text-xs font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!newHeadmaster.period.trim() || !newHeadmaster.name.trim()}
                        onClick={() => {
                          if (newHeadmaster.period.trim() && newHeadmaster.name.trim()) {
                            const updated = [
                              ...(content.history?.headmasters || []),
                              { id: `hm-${Date.now()}`, period: newHeadmaster.period.trim(), name: newHeadmaster.name.trim() }
                            ];
                            updateLeadershipList('headmasters', updated);
                            setNewHeadmaster({ period: '', name: '' });
                            showToast('Headmaster added', 'success');
                          }
                        }}
                        className="w-full py-1.5 rounded-lg bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer text-center"
                      >
                        + Add Headmaster
                      </button>
                    </div>

                    {/* Headmasters List */}
                    <div className="divide-y divide-brand-pale/70 max-h-[380px] overflow-y-auto pr-1">
                      {(content.history?.headmasters || []).map((hm, idx) => (
                        <div key={hm.id || idx} className="py-2.5 flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={hm.period}
                            onChange={(e) => {
                              const updated = [...(content.history?.headmasters || [])];
                              updated[idx] = { ...updated[idx], period: e.target.value };
                              updateLeadershipList('headmasters', updated);
                            }}
                            className="w-24 sm:w-28 px-2 py-1 rounded bg-brand-white border border-brand-pale text-xs font-bold text-brand-forest shrink-0"
                          />
                          <input
                            type="text"
                            value={hm.name}
                            onChange={(e) => {
                              const updated = [...(content.history?.headmasters || [])];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              updateLeadershipList('headmasters', updated);
                            }}
                            className="flex-1 px-2 py-1 rounded bg-brand-white border border-brand-pale text-xs font-medium text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (content.history?.headmasters || []).filter((_, i) => i !== idx);
                              updateLeadershipList('headmasters', updated);
                              showToast('Record removed', 'info');
                            }}
                            className="p-1 rounded text-rose-500 hover:bg-rose-100 transition cursor-pointer shrink-0"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Managers Card */}
                  <div className="bg-brand-light/40 border border-brand-pale rounded-2xl p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-pale">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-brand-forest text-white text-xs font-bold flex items-center justify-center">
                          M
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-brand-forest">Managers (முகாமையாளர்கள்)</h3>
                          <span className="text-[11px] text-slate-500">{(content.history?.managers?.length || 0)} Recorded</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Manager Row */}
                    <div className="p-3 bg-brand-white border border-brand-pale rounded-xl space-y-2">
                      <span className="block text-[11px] font-bold text-slate-700">Add New Manager</span>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <input
                          type="text"
                          value={newManager.period}
                          onChange={(e) => setNewManager(prev => ({ ...prev, period: e.target.value }))}
                          placeholder="Period (e.g. 1960–1965)"
                          className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-brand-pale text-xs"
                        />
                        <input
                          type="text"
                          value={newManager.name}
                          onChange={(e) => setNewManager(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Full Name"
                          className="sm:col-span-3 px-2.5 py-1.5 rounded-lg border border-brand-pale text-xs font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!newManager.period.trim() || !newManager.name.trim()}
                        onClick={() => {
                          if (newManager.period.trim() && newManager.name.trim()) {
                            const updated = [
                              ...(content.history?.managers || []),
                              { id: `m-${Date.now()}`, period: newManager.period.trim(), name: newManager.name.trim() }
                            ];
                            updateLeadershipList('managers', updated);
                            setNewManager({ period: '', name: '' });
                            showToast('Manager added', 'success');
                          }
                        }}
                        className="w-full py-1.5 rounded-lg bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer text-center"
                      >
                        + Add Manager
                      </button>
                    </div>

                    {/* Managers List */}
                    <div className="divide-y divide-brand-pale/70 max-h-[380px] overflow-y-auto pr-1">
                      {(content.history?.managers || []).map((mgr, idx) => (
                        <div key={mgr.id || idx} className="py-2.5 flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={mgr.period}
                            onChange={(e) => {
                              const updated = [...(content.history?.managers || [])];
                              updated[idx] = { ...updated[idx], period: e.target.value };
                              updateLeadershipList('managers', updated);
                            }}
                            className="w-24 sm:w-28 px-2 py-1 rounded bg-brand-white border border-brand-pale text-xs font-bold text-brand-forest shrink-0"
                          />
                          <input
                            type="text"
                            value={mgr.name}
                            onChange={(e) => {
                              const updated = [...(content.history?.managers || [])];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              updateLeadershipList('managers', updated);
                            }}
                            className="flex-1 px-2 py-1 rounded bg-brand-white border border-brand-pale text-xs font-medium text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (content.history?.managers || []).filter((_, i) => i !== idx);
                              updateLeadershipList('managers', updated);
                              showToast('Record removed', 'info');
                            }}
                            className="p-1 rounded text-rose-500 hover:bg-rose-100 transition cursor-pointer shrink-0"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ADD MILESTONE MODAL */}
            {isAddMilestoneOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto animate-modal-content">
                  <div className="shrink-0 bg-brand-forest px-4 sm:px-6 py-3 sm:py-4 text-white flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white">Add Historical Milestone</h3>
                      <p className="text-[11px] text-brand-light/90">Add a new chronological era to the college history archive</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddMilestoneOpen(false)}
                      className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newMilestone.titleEn.trim() && !newMilestone.titleTa.trim()) {
                        showToast('Please enter a milestone title', 'error');
                        return;
                      }
                      addHistoryMilestone(newMilestone);
                      setIsAddMilestoneOpen(false);
                      setNewMilestone({
                        year: '',
                        yearTa: '',
                        titleEn: '',
                        titleTa: '',
                        descEn: '',
                        descTa: '',
                        quoteEn: '',
                        quoteTa: '',
                        image: '',
                        imageAlt: ''
                      });
                      setMilestonePhotoStats(null);
                      setMilestonePhotoError('');
                      showToast('Historical milestone added!', 'success');
                    }}
                    className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Era / Year (English)</label>
                        <input
                          type="text"
                          value={newMilestone.year}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, year: e.target.value }))}
                          placeholder="e.g. 1950–1960"
                          className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">காலம் / ஆண்டு (Tamil)</label>
                        <input
                          type="text"
                          value={newMilestone.yearTa}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, yearTa: e.target.value }))}
                          placeholder="எ.கா. 1950–1960"
                          className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-xs font-bold font-tamil"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Title (English) *</label>
                        <input
                          type="text"
                          required
                          value={newMilestone.titleEn}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, titleEn: e.target.value }))}
                          placeholder="e.g. Science Laboratory Expansion"
                          className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">தலைப்பு (Tamil)</label>
                        <input
                          type="text"
                          value={newMilestone.titleTa}
                          onChange={(e) => setNewMilestone(prev => ({ ...prev, titleTa: e.target.value }))}
                          placeholder="எ.கா. விஞ்ஞானகூட விஸ்தரிப்பு"
                          className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-xs font-bold font-tamil"
                        />
                      </div>
                    </div>

                    {/* Direct Image Upload */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Archival Photograph
                        </label>
                        {newMilestone.image && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewMilestone(prev => ({ ...prev, image: '' }));
                              setMilestonePhotoStats(null);
                            }}
                            className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      {/* Hidden File Input for Milestone Upload */}
                      <input
                        type="file"
                        ref={milestoneFileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMilestoneFileSelect(file);
                          e.target.value = '';
                        }}
                      />

                      {/* Dropzone Box */}
                      <div
                        onClick={() => milestoneFileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer?.files?.[0];
                          if (file) handleMilestoneFileSelect(file);
                        }}
                        className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                          isProcessingMilestonePhoto
                            ? 'border-brand-forest bg-brand-light/50 animate-pulse'
                            : newMilestone.image
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-brand-pale hover:border-brand-forest/70 hover:bg-brand-light/30 bg-brand-light/10'
                        }`}
                      >
                        {isProcessingMilestonePhoto ? (
                          <div className="py-2 space-y-2">
                            <div className="w-8 h-8 mx-auto text-brand-forest animate-spin">
                              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            </div>
                            <p className="text-xs font-semibold text-brand-forest">Optimizing image to WebP format...</p>
                          </div>
                        ) : newMilestone.image ? (
                          <div className="space-y-3">
                            <div className="h-36 w-full rounded-lg overflow-hidden bg-slate-900/5 border border-emerald-200 relative flex items-center justify-center">
                              <GlassImage
                                src={newMilestone.image}
                                alt="Milestone preview"
                                containerClassName="w-full h-full flex items-center justify-center"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                Image Ready
                              </span>
                              <span className="text-brand-forest hover:underline font-bold text-[11px]">
                                Click to replace image
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 space-y-2">
                            <div className="w-11 h-11 mx-auto rounded-full bg-brand-light border border-brand-pale flex items-center justify-center text-brand-forest shadow-2xs">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                Click to upload photo from your device or drag &amp; drop
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                JPG, PNG, WEBP, GIF up to 5MB (automatically converted to high-quality WebP)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {milestonePhotoError && (
                        <p className="text-xs text-rose-600 font-medium">{milestonePhotoError}</p>
                      )}

                      {/* Optional Presets / Link Accordion */}
                      <details className="text-xs text-slate-500 group pt-1">
                        <summary className="cursor-pointer hover:text-brand-forest font-semibold flex items-center gap-1 select-none">
                          <span>Or select from historic archive presets (his1–his12)</span>
                          <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="mt-2 space-y-2 p-3 bg-brand-light/30 border border-brand-pale rounded-xl">
                          <input
                            type="text"
                            value={newMilestone.image}
                            onChange={(e) => setNewMilestone(prev => ({ ...prev, image: e.target.value }))}
                            placeholder="/assets/his1.jpg or image URL"
                            className="w-full px-3 py-1.5 rounded-lg bg-brand-white border border-brand-pale text-xs font-mono"
                          />
                          <div className="flex flex-wrap gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setNewMilestone(prev => ({ ...prev, image: `/assets/his${n}.jpg` }))}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
                                  newMilestone.image === `/assets/his${n}.jpg`
                                    ? 'bg-brand-forest text-white'
                                    : 'bg-brand-white border border-brand-pale text-slate-600 hover:bg-brand-light'
                                }`}
                              >
                                his{n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Narrative (English)</label>
                      <textarea
                        rows={3}
                        value={newMilestone.descEn}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, descEn: e.target.value }))}
                        placeholder="Historical text in English..."
                        className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">வரலாற்றுக் குறிப்பு (Tamil)</label>
                      <textarea
                        rows={3}
                        value={newMilestone.descTa}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, descTa: e.target.value }))}
                        placeholder="வரலாற்றுக் குறிப்பு (தமிழ்)..."
                        className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-xs font-tamil leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-pale">
                      <button
                        type="button"
                        onClick={() => setIsAddMilestoneOpen(false)}
                        className="px-4 py-2 rounded-full border border-brand-pale text-xs font-semibold text-slate-700 hover:bg-brand-light cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Add Milestone
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHOTO GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Hidden file pickers for PC image uploads */}
            <input
              type="file"
              ref={multiFileInputRef}
              multiple
              accept="image/*"
              onChange={handleDirectMultiUpload}
              className="hidden"
            />
            <input
              type="file"
              ref={cardFileInputRef}
              accept="image/*"
              onChange={handleReplaceCardFileChange}
              className="hidden"
            />

            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-brand-forest">Photo Gallery</h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Manage the 3D gallery images displayed in the interactive carousel. Upload photos directly from your phone/PC or enter image links.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isProcessingPhoto}
                    onClick={() => multiFileInputRef.current?.click()}
                    className="w-full sm:w-auto justify-center px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-full bg-brand-light border border-brand-pale hover:border-brand-soft text-brand-forest text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    title="Choose pictures from your device"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="truncate">{isProcessingPhoto ? 'Processing...' : 'Upload Photos'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewGallerySrc('');
                      setPhotoUploadError('');
                      setPhotoStats(null);
                      setModalFile(null);
                      setIsAddGalleryOpen(true);
                    }}
                    className="w-full sm:w-auto justify-center px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Photo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
                {(content.gallery || []).map((img, idx) => (
                  <div key={idx} className="bg-brand-light/20 border border-brand-pale rounded-xl sm:rounded-2xl overflow-hidden group shadow-2xs flex flex-col">
                    <div className="h-28 sm:h-32 w-full overflow-hidden bg-slate-100 relative">
                      <GlassImage
                        src={img.src}
                        alt={`Photo ${idx + 1}`}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        fallbackSrc="/assets/hero.jpg"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-brand-forest/90 text-white text-[10px] font-bold">
                        #{idx + 1}
                      </span>

                      {/* Replace from PC/Phone button on hover / touch */}
                      <button
                        type="button"
                        onClick={() => {
                          setReplaceCardIndex(idx);
                          cardFileInputRef.current?.click();
                        }}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition shadow-sm cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100"
                        title="Upload new picture to replace this photo"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-2 sm:p-2.5 bg-brand-white flex-1 flex flex-col justify-between">
                      <input
                        type="text"
                        value={img.src}
                        onChange={(e) => updateGalleryImage(idx, e.target.value)}
                        placeholder="/assets/photo.jpg"
                        className="w-full px-2 py-1 rounded bg-brand-white border border-brand-pale text-slate-700 text-[10px] sm:text-[11px] font-mono focus:outline-none focus:border-brand-forest"
                        title={img.src}
                      />
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-brand-pale/60 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceCardIndex(idx);
                            cardFileInputRef.current?.click();
                          }}
                          className="text-[11px] text-brand-forest hover:underline font-medium cursor-pointer flex items-center gap-1 p-1 -m-1"
                          title="Choose photo to replace"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGalleryImage(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 -m-1 rounded hover:bg-rose-50 transition cursor-pointer text-xs flex items-center gap-1"
                          title="Remove image"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADD PHOTO MODAL WITH FILE UPLOAD & AUTO URL RETRIEVAL */}
            {isAddGalleryOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col animate-modal-content">
                  {/* Hidden file input for modal */}
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    accept="image/*"
                    onChange={handleModalFileChange}
                    className="hidden"
                  />

                  <div className="bg-brand-forest p-3.5 sm:p-5 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold">Add Photo to Gallery</h3>
                        <p className="text-[10px] sm:text-[11px] text-brand-pale">Max 5MB • WebP Quality Optimization</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddGalleryOpen(false);
                        setNewGallerySrc('');
                        setPhotoUploadError('');
                        setPhotoStats(null);
                        setModalFile(null);
                      }}
                      className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Compression Options Toggle Card */}
                    <div className="bg-brand-light/30 border border-brand-pale rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">Convert to WebP &amp; Optimize</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Converts to modern WebP format while preserving ultra-high sharpness with rapid mobile loading.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={compressOption}
                        onClick={() => handleToggleCompressOption(!compressOption)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          compressOption ? 'bg-brand-forest' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            compressOption ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* File Upload Dropzone */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          1. Select Picture
                        </label>
                        <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Max size: 5 MB
                        </span>
                      </div>
                      <div
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleModalDrop}
                        onClick={() => modalFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all ${
                          isProcessingPhoto
                            ? 'border-brand-forest bg-brand-light/50 animate-pulse'
                            : newGallerySrc
                              ? 'border-emerald-400 bg-emerald-50/50'
                              : 'border-brand-pale hover:border-brand-forest/70 hover:bg-brand-light/30 bg-brand-light/10'
                        }`}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-brand-light border border-brand-pale flex items-center justify-center text-brand-forest mb-2.5 sm:mb-3 shadow-2xs">
                          {isProcessingPhoto ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">
                            {isProcessingPhoto
                              ? 'Optimizing to WebP & Preserving Quality...'
                              : 'Tap to choose photo or drag & drop'}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-500">
                            Supports JPG, PNG, WEBP, GIF. Strict 5MB limit.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Error Banner */}
                    {photoUploadError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{photoUploadError}</span>
                      </div>
                    )}

                    {/* Live Preview & Compression Analytics */}
                    {newGallerySrc && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 sm:p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Image Ready</span>
                            </span>
                            {photoStats?.format && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-mono uppercase">
                                {photoStats.format.replace('image/', '')}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => modalFileInputRef.current?.click()}
                            className="text-[11px] text-brand-forest hover:underline font-semibold cursor-pointer"
                          >
                            Choose Different Image
                          </button>
                        </div>

                        <div className="h-36 sm:h-44 w-full rounded-lg overflow-hidden bg-slate-900/5 border border-emerald-200 relative flex items-center justify-center">
                          <GlassImage
                            src={newGallerySrc}
                            alt="Uploaded preview"
                            containerClassName="w-full h-full flex items-center justify-center"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Live Compression Metrics */}
                        {photoStats && (
                          <div className="bg-brand-white border border-emerald-200/80 rounded-xl p-2.5 sm:p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="p-1.5 bg-slate-50 rounded-lg">
                              <span className="block text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">Original</span>
                              <span className="font-bold text-slate-700 text-xs sm:text-sm">{formatBytes(photoStats.originalSize)}</span>
                            </div>
                            <div className="p-1.5 bg-emerald-50 rounded-lg">
                              <span className="block text-[9px] sm:text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">
                                {compressOption ? 'Optimized' : 'Size'}
                              </span>
                              <span className="font-bold text-emerald-700 text-xs sm:text-sm">{formatBytes(photoStats.compressedSize)}</span>
                            </div>
                            <div className="p-1.5 bg-emerald-50 rounded-lg">
                              <span className="block text-[9px] sm:text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">Saved</span>
                              <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                                {photoStats.savedPercent > 0 ? `-${photoStats.savedPercent}%` : 'Original'}
                              </span>
                            </div>
                            <div className="p-1.5 bg-slate-50 rounded-lg">
                              <span className="block text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">Dimensions</span>
                              <span className="font-bold text-slate-700 text-xs sm:text-sm">{photoStats.width}×{photoStats.height}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-emerald-800 text-center font-medium">
                          ✓ High-quality rendering guaranteed • Zero pixelation • Smooth web performance
                        </p>
                      </div>
                    )}

                    {/* Fetched URL Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        2. Fetched Image URL / Data URL
                      </label>
                      <input
                        type="text"
                        value={newGallerySrc}
                        onChange={(e) => {
                          setNewGallerySrc(e.target.value);
                          setPhotoStats(null);
                        }}
                        placeholder="Automatically populated upon upload"
                        className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        When you select a picture from your device, the optimized WebP Data URL is automatically placed here.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-brand-light/30 border-t border-brand-pale flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddGalleryOpen(false);
                        setNewGallerySrc('');
                        setPhotoUploadError('');
                        setPhotoStats(null);
                        setModalFile(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-brand-white border border-brand-pale text-slate-700 text-xs font-semibold hover:bg-brand-light cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!newGallerySrc.trim()}
                      onClick={() => {
                        if (!newGallerySrc.trim()) return;
                        addGalleryImage(newGallerySrc.trim());
                        setNewGallerySrc('');
                        setPhotoUploadError('');
                        setPhotoStats(null);
                        setModalFile(null);
                        setIsAddGalleryOpen(false);
                        showToast('Photo added to gallery!', 'success');
                      }}
                      className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-full text-xs font-bold transition cursor-pointer shadow-2xs text-center ${
                        newGallerySrc.trim()
                          ? 'bg-brand-forest hover:bg-brand-forestHover text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Add Photo to Gallery
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCHOOL EVENTS (FACEBOOK IFRAME EMBEDS) */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-brand-forest">School Events &amp; Facebook Updates</h2>
                    
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Manage the official community Facebook event posts displayed on the School Events page. Paste any Facebook post link or embed code to automatically retrieve and format it as an iframe.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEventModalTab('manual');
                      setIsAddEventOpen(true);
                    }}
                    className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 self-stretch sm:self-auto"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>+ Add Manual Event (Photo &amp; Text)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventModalTab('facebook');
                      setNewEventInput('');
                      setNewEventHeight(645);
                      setIsAddEventOpen(true);
                    }}
                    className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 self-stretch sm:self-auto"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>+ Embed FB Post</span>
                  </button>
                </div>
              </div>

              {/* Event Cards Grid */}
              {(() => {
                const eventsList = Array.isArray(content?.events) ? content.events : [];
                if (eventsList.length === 0) {
                  return (
                    <div className="text-center py-10 sm:py-12 px-4 rounded-2xl border-2 border-dashed border-brand-pale bg-brand-light/20">
                      <div className="w-12 h-12 mx-auto rounded-full bg-brand-light flex items-center justify-center text-brand-forest mb-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">No Events Configured Yet</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Add school event announcements with direct pictures and descriptions, or embed posts from the official Facebook page.
                      </p>
                      <div className="flex items-center justify-center gap-2.5 mt-4 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEventModalTab('manual');
                            setIsAddEventOpen(true);
                          }}
                          className="px-4 py-2 rounded-full bg-brand-forest text-white text-xs font-bold cursor-pointer shadow-2xs"
                        >
                          + Add Manual Event
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEventModalTab('facebook');
                            setNewEventInput('');
                            setNewEventHeight(645);
                            setIsAddEventOpen(true);
                          }}
                          className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold cursor-pointer shadow-2xs"
                        >
                          + Embed Facebook Post
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-brand-pale/60 flex-wrap gap-2">
                      <span>Active Events &amp; Updates ({eventsList.length})</span>
                      <a
                        href="https://www.facebook.com/profile.php?id=61575442051109"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-forest hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Official Facebook Page</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {eventsList.map((post, idx) => {
                        const isManual = post.type === 'manual' || (!post.iframeSrc && (post.image || post.title));

                        if (isManual) {
                          const hasImg = Boolean(post.image && post.image.trim());
                          return (
                            <div
                              key={post.id || idx}
                              className={`h-[480px] border rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between relative transition-all ${
                                hasImg
                                  ? 'bg-slate-900 border-slate-700/60'
                                  : 'bg-brand-light/20 border-brand-pale p-3.5 sm:p-4'
                              }`}
                            >
                              {hasImg ? (
                                <>
                                  {/* Full Cover Image */}
                                  <img
                                    src={post.image}
                                    alt={post.title || 'Event'}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 pointer-events-none" />

                                  {/* Top Bar Floating */}
                                  <div className="relative z-10 p-3 sm:p-3.5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2.5 py-0.5 rounded-full bg-brand-forest text-white text-[10px] font-bold shadow-xs">
                                        #{idx + 1}
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                                        {post.category || 'Manual Post'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditEvent(post)}
                                        className="text-white hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/85 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold border border-white/20 shadow-xs"
                                        title="Edit event text & details"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`Remove event "${post.title || 'Untitled'}"?`)) {
                                            deleteEvent(post.id);
                                            showToast('Event removed', 'success');
                                          }
                                        }}
                                        className="text-white/80 hover:text-rose-400 p-1.5 rounded-lg bg-black/60 hover:bg-rose-950/80 transition cursor-pointer border border-white/20 shadow-xs"
                                        title="Delete event"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Bottom Content Scrim */}
                                  <div className="relative z-10 mt-auto p-4 sm:p-5 space-y-1.5 text-white">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      {post.date ? (
                                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-semibold">
                                          📅 {post.date}
                                        </span>
                                      ) : <span />}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditEvent(post)}
                                        className="text-[11px] text-emerald-300 hover:text-white font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                      >
                                        <span>Edit text</span>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                      </button>
                                    </div>
                                    <h4 className="text-base font-bold text-white line-clamp-2 drop-shadow-sm leading-snug">{post.title || 'Untitled Event'}</h4>
                                    {post.titleTa && (
                                      <p className="text-xs font-tamil text-emerald-300 font-semibold line-clamp-1">{post.titleTa}</p>
                                    )}
                                    {post.location && (
                                      <p className="text-[11px] text-white/80 truncate flex items-center gap-1">
                                        <span>📍</span>
                                        <span>{post.location}</span>
                                      </p>
                                    )}
                                    {post.description && (
                                      <p className="text-xs text-white/85 line-clamp-3 leading-relaxed pt-0.5">{post.description}</p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div>
                                  {/* Top Bar */}
                                  <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2.5 py-0.5 rounded-full bg-brand-forest text-white text-[10px] font-bold">
                                        #{idx + 1}
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                        Manual Post
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditEvent(post)}
                                        className="text-brand-forest hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                        title="Edit event text & details"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`Remove event "${post.title || 'Untitled'}"?`)) {
                                            deleteEvent(post.id);
                                            showToast('Event removed', 'success');
                                          }
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1.5 -m-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                        title="Delete event"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="w-full h-44 rounded-xl overflow-hidden bg-brand-light/30 border border-brand-pale/80 shadow-2xs mb-3 flex items-center justify-center relative">
                                    <div className="text-center p-3 text-slate-400 text-xs flex flex-col items-center">
                                      <svg className="w-8 h-8 text-slate-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span>No Photo Attached</span>
                                    </div>
                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-semibold">
                                      {post.category || 'School Event'}
                                    </span>
                                    {post.date && (
                                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-semibold">
                                        {post.date}
                                      </span>
                                    )}
                                  </div>

                                  {/* Text Details */}
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{post.title || 'Untitled Event'}</h4>
                                    {post.titleTa && (
                                      <p className="text-xs font-tamil text-brand-forest font-semibold line-clamp-1">{post.titleTa}</p>
                                    )}
                                    {post.location && (
                                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                        <span>📍</span>
                                        <span>{post.location}</span>
                                      </p>
                                    )}
                                    {post.description && (
                                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mt-1">{post.description}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={post.id || idx}
                            className="h-[480px] bg-brand-light/20 border border-brand-pale rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between"
                          >
                            {/* Top Bar */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-0.5 rounded-full bg-brand-forest text-white text-[10px] font-bold">
                                  #{idx + 1}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                                  FB Embed
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={post.postUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline p-1 -m-1"
                                  title="View post on Facebook"
                                >
                                  <span>View Post</span>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('Remove this Facebook event card?')) {
                                      deleteEvent(post.id);
                                      showToast('Event removed', 'success');
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 -m-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                  title="Delete event"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Live Iframe Scaled Preview Container */}
                            <div className="flex-1 w-full min-h-0 overflow-hidden rounded-xl bg-white border border-brand-pale/80 shadow-2xs flex justify-center items-start pt-2 relative">
                              <div
                                className="admin-fb-wrapper shrink-0 flex justify-center origin-top pointer-events-auto"
                                style={{
                                  height: `${post.height || 645}px`,
                                  marginBottom: `-${(post.height || 645) * 0.42}px`,
                                }}
                              >
                                <iframe
                                  src={post.iframeSrc}
                                  width={post.width || 500}
                                  height={post.height || 645}
                                  style={{ border: 'none', overflow: 'hidden' }}
                                  scrolling="no"
                                  frameBorder="0"
                                  allowFullScreen={true}
                                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                  className="w-full h-full rounded-xl"
                                  title={`Facebook Event ${post.id}`}
                                />
                              </div>
                            </div>

                            {/* Card Info & Height Settings */}
                            <div className="mt-2.5 pt-2 border-t border-brand-pale/60 space-y-1.5 shrink-0">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-600">Iframe Height (px):</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={300}
                                    max={1200}
                                    step={10}
                                    value={post.height || 645}
                                    onChange={(e) => updateEvent(post.id, { height: Number(e.target.value) || 645 })}
                                    className="w-20 px-2 py-1 rounded bg-brand-white border border-brand-pale text-slate-800 text-xs font-mono font-semibold text-right focus:outline-none focus:border-brand-forest"
                                  />
                                  <span className="text-slate-400">px</span>
                                </div>
                              </div>

                              <div className="truncate text-[10px] text-slate-400 font-mono bg-brand-white px-2 py-0.5 rounded border border-brand-pale/60" title={post.iframeSrc}>
                                {post.iframeSrc}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ADD EVENT MODAL (MANUAL EVENT OR FB IFRAME) */}
            {isAddEventOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col animate-modal-content">
                  {/* Modal Header */}
                  <div className="bg-brand-forest p-3.5 sm:p-5 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold">Add School Event Post</h3>
                        <p className="text-[10px] sm:text-[11px] text-brand-pale">
                          {eventModalTab === 'manual' ? 'Create Custom Post with Photo & Text' : 'Paste FB Link to Retrieve Iframe'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddEventOpen(false);
                        setNewEventInput('');
                      }}
                      className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex border-b border-brand-pale bg-brand-light/40 px-4 sm:px-6 pt-3 gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEventModalTab('manual')}
                      className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
                        eventModalTab === 'manual'
                          ? 'bg-brand-white border-brand-pale text-brand-forest border-b-white -mb-px shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
                      }`}
                    >
                      📷 Manual Event (Picture &amp; Text)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventModalTab('facebook')}
                      className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
                        eventModalTab === 'facebook'
                          ? 'bg-brand-white border-brand-pale text-brand-forest border-b-white -mb-px shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
                      }`}
                    >
                      🌐 Facebook Embed
                    </button>
                  </div>

                  {/* TAB 1: MANUAL EVENT (PICTURE & TEXT) */}
                  {eventModalTab === 'manual' && (
                    <form onSubmit={handleAddManualEvent} className="flex-1 flex flex-col overflow-hidden">
                      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                        {/* Photo Upload Box */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Event Picture / Poster
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            ref={eventPhotoInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleEventPhotoFile(file);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />

                          {manualEventImage ? (
                            <div className="space-y-3">
                              {/* Live Card Full-Cover Preview */}
                              <div className="relative w-full max-w-[280px] mx-auto h-[360px] rounded-2xl overflow-hidden shadow-lg border border-slate-700/60 flex flex-col justify-between bg-slate-900 group">
                                <img
                                  src={manualEventImage}
                                  alt="Event preview"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 pointer-events-none" />

                                {/* Top Bar Floating */}
                                <div className="relative z-10 p-3 flex items-center justify-between gap-2">
                                  <span className="px-2.5 py-1 rounded-full bg-brand-forest/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-xs border border-white/20">
                                    {manualEventCategory || 'School Event'}
                                  </span>
                                  {manualEventDate && (
                                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs border border-white/15">
                                      {manualEventDate}
                                    </span>
                                  )}
                                </div>

                                {/* Bottom Content Scrim */}
                                <div className="relative z-10 p-4 space-y-1 text-white">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[9px] font-bold uppercase tracking-wider mb-1">
                                    Full Card Cover Preview
                                  </span>
                                  <h4 className="text-sm font-bold text-white line-clamp-2 drop-shadow-sm">
                                    {manualEventTitle || 'Event Title will appear here...'}
                                  </h4>
                                  {manualEventTitleTa && (
                                    <p className="text-xs font-tamil text-emerald-300 font-semibold line-clamp-1">
                                      {manualEventTitleTa}
                                    </p>
                                  )}
                                  {manualEventLocation && (
                                    <p className="text-[11px] text-white/80 truncate flex items-center gap-1">
                                      <span>📍</span>
                                      <span>{manualEventLocation}</span>
                                    </p>
                                  )}
                                  {manualEventDescription && (
                                    <p className="text-xs text-white/85 line-clamp-2 leading-relaxed pt-0.5">
                                      {manualEventDescription}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Photo Stats & Actions */}
                              <div className="flex items-center justify-between bg-brand-light/40 border border-brand-pale rounded-xl px-3 py-2 text-xs">
                                <div>
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold mr-2">
                                    Photo Ready
                                  </span>
                                  {eventPhotoStats && (
                                    <span className="text-[11px] text-slate-600">
                                      {formatBytes(eventPhotoStats.compressedSize)}
                                      {eventPhotoStats.reductionPercent > 0 && (
                                        <span className="text-emerald-700 font-semibold ml-1">
                                          (-{eventPhotoStats.reductionPercent}%)
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => eventPhotoInputRef.current?.click()}
                                    className="text-xs text-brand-forest hover:underline font-semibold cursor-pointer"
                                  >
                                    Change Photo
                                  </button>
                                  <span className="text-slate-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setManualEventImage('');
                                      setEventPhotoStats(null);
                                    }}
                                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => eventPhotoInputRef.current?.click()}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleEventPhotoFile(file);
                              }}
                              className="w-full border-2 border-dashed border-brand-pale hover:border-brand-forest rounded-2xl p-5 text-center cursor-pointer transition hover:bg-brand-light/30 flex flex-col items-center justify-center gap-2"
                            >
                              {isProcessingEventPhoto ? (
                                <div className="flex flex-col items-center gap-2 py-2">
                                  <svg className="w-6 h-6 animate-spin text-brand-forest" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-slate-600">Optimizing photo to WebP...</span>
                                </div>
                              ) : (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-forest">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-brand-forest hover:underline">Click to upload event photo</span>
                                    <span className="text-xs text-slate-500"> or drag and drop</span>
                                    <p className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WebP up to 5 MB</p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {eventPhotoError && (
                            <p className="text-xs text-rose-600 mt-1.5 font-medium">{eventPhotoError}</p>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                              <input
                                type="checkbox"
                                checked={eventPhotoCompress}
                                onChange={(e) => setEventPhotoCompress(e.target.checked)}
                                className="rounded text-brand-forest focus:ring-brand-forest"
                              />
                              <span>Compress photo to WebP (Recommended)</span>
                            </label>
                          </div>
                        </div>

                        {/* Title Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Event Title (English) *
                            </label>
                            <input
                              type="text"
                              value={manualEventTitle}
                              onChange={(e) => setManualEventTitle(e.target.value)}
                              placeholder="e.g. Annual Prize Day Ceremony"
                              className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              தமிழ் தலைப்பு (Tamil Title)
                            </label>
                            <input
                              type="text"
                              value={manualEventTitleTa}
                              onChange={(e) => setManualEventTitleTa(e.target.value)}
                              placeholder="எ.கா. வருடாந்த பரிசளிப்பு விழா"
                              className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs font-tamil focus:outline-none focus:border-brand-forest"
                            />
                          </div>
                        </div>

                        {/* Date, Category, and Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Event Date *
                            </label>
                            <input
                              type="date"
                              value={manualEventDate}
                              onChange={(e) => setManualEventDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Category / Tag
                            </label>
                            <input
                              type="text"
                              value={manualEventCategory}
                              onChange={(e) => setManualEventCategory(e.target.value)}
                              placeholder="e.g. Ceremony, Sports"
                              className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Location (Optional)
                            </label>
                            <input
                              type="text"
                              value={manualEventLocation}
                              onChange={(e) => setManualEventLocation(e.target.value)}
                              placeholder="e.g. College Main Hall"
                              className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest"
                            />
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Event Description / Text (English)
                          </label>
                          <textarea
                            rows={3}
                            value={manualEventDescription}
                            onChange={(e) => setManualEventDescription(e.target.value)}
                            placeholder="Provide details about the event, scheduled agenda, guest speakers, or announcements..."
                            className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            விபரங்கள் (Tamil Description - Optional)
                          </label>
                          <textarea
                            rows={2}
                            value={manualEventDescriptionTa}
                            onChange={(e) => setManualEventDescriptionTa(e.target.value)}
                            placeholder="நிகழ்வு பற்றிய விபரங்கள்..."
                            className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs font-tamil focus:outline-none focus:border-brand-forest leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-3.5 sm:p-4 bg-brand-light/30 border-t border-brand-pale flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddEventOpen(false);
                            setManualEventTitle('');
                            setManualEventTitleTa('');
                            setManualEventImage('');
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-brand-white border border-brand-pale text-slate-700 text-xs font-semibold hover:bg-brand-light cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition cursor-pointer shadow-2xs text-center"
                        >
                          Create Event
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: FACEBOOK EMBED */}
                  {eventModalTab === 'facebook' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Facebook Post URL or Iframe Embed Code
                          </label>
                          <textarea
                            rows={3}
                            value={newEventInput}
                            onChange={(e) => setNewEventInput(e.target.value)}
                            placeholder="Paste Facebook post URL or embed code..."
                            autoFocus
                            className="w-full px-3.5 py-2.5 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest leading-relaxed"
                          />
                          {/* Share Link Auto-Resolve Alert */}
                          {(parsedNewEvent?.isShareUrl || newEventInput.includes('/share/')) && (
                            <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 sm:p-3.5 text-xs text-amber-900 space-y-2.5">
                              <div className="flex items-start gap-2.5">
                                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                  <strong className="block font-bold text-amber-950">Mobile Share Link Detected (/share/p/...)</strong>
                                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-900/90">
                                    Facebook's iframe embed player cannot display temporary mobile share links and shows <em>"This Facebook post is no longer available"</em> unless converted to the post's permanent canonical URL.
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/70">
                                <button
                                  type="button"
                                  disabled={isResolvingFbUrl}
                                  onClick={() => handleAutoResolveFbUrl()}
                                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                  {isResolvingFbUrl ? (
                                    <>
                                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                      </svg>
                                      <span>Converting to Permanent URL...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                      <span>Auto-Convert to Permanent URL</span>
                                    </>
                                  )}
                                </button>
                                <span className="text-[11px] text-amber-800">
                                  (Auto-resolves mobile redirect to post permalink)
                                </span>
                              </div>
                            </div>
                          )}

                          {fbResolveNotice.text && (
                            <div className={`mt-2.5 rounded-xl p-2.5 text-xs flex items-center gap-2 ${
                              fbResolveNotice.type === 'success'
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                : fbResolveNotice.type === 'warning'
                                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                                : 'bg-rose-50 border border-rose-200 text-rose-800'
                            }`}>
                              {fbResolveNotice.type === 'success' ? (
                                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              <span className="font-medium text-[11px]">{fbResolveNotice.text}</span>
                            </div>
                          )}

                          <div className="mt-2.5 rounded-xl bg-brand-light/30 border border-brand-pale p-3 text-xs text-slate-600 space-y-1">
                            <strong className="block text-slate-800 font-semibold">Tip to get the permanent post URL on Facebook:</strong>
                            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600">
                              <li>Click on the <strong>date / timestamp</strong> (e.g. <em>"2 hrs ago"</em> or the post date) on Facebook to open the post directly.</li>
                              <li>Copy the URL from your browser address bar (it starts with <code className="font-mono text-brand-forest font-bold">facebook.com/permalink.php?story_fbid=...</code> or <code className="font-mono text-brand-forest font-bold">facebook.com/&lt;page&gt;/posts/...</code>).</li>
                              <li>Or click the 3 dots (<span className="font-bold">···</span>) on the post &gt; <strong>Embed</strong> &gt; copy code.</li>
                            </ol>
                          </div>
                        </div>

                        {/* Retrieval Result & Live Iframe Preview */}
                        {parsedNewEvent ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 sm:p-4 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Iframe Successfully Retrieved</span>
                              </span>
                              <span className="text-[11px] font-mono text-emerald-800 font-semibold">Width: 500px</span>
                            </div>

                            <div>
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Generated Iframe Embed URL:
                              </span>
                              <div className="p-2 rounded-lg bg-white border border-emerald-200 text-[10px] sm:text-[11px] font-mono text-slate-700 break-all select-all">
                                {parsedNewEvent.iframeSrc}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  Canonical Post URL:
                                </span>
                                <div className="truncate text-xs font-mono text-blue-700">
                                  <a href={parsedNewEvent.postUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {parsedNewEvent.postUrl} ↗
                                  </a>
                                </div>
                              </div>

                              <div className="w-full sm:w-32">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  Height (px):
                                </span>
                                <input
                                  type="number"
                                  min={300}
                                  max={1200}
                                  step={10}
                                  value={newEventHeight}
                                  onChange={(e) => setNewEventHeight(Number(e.target.value) || 645)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-emerald-200 text-slate-800 text-base sm:text-xs font-mono font-bold"
                                />
                              </div>
                            </div>

                            {/* Live Preview of Iframe */}
                            <div className="pt-2">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Live Iframe Preview:
                              </span>
                              <div className="w-full h-[300px] sm:h-[320px] overflow-hidden rounded-xl bg-white border border-slate-200 flex justify-center items-start pt-2">
                                <div
                                  className="admin-fb-wrapper shrink-0 flex justify-center origin-top pointer-events-auto"
                                  style={{
                                    height: `${newEventHeight}px`,
                                    marginBottom: `-${newEventHeight * 0.45}px`,
                                  }}
                                >
                                  <iframe
                                    src={parsedNewEvent.iframeSrc}
                                    width={500}
                                    height={newEventHeight}
                                    style={{ border: 'none', overflow: 'hidden' }}
                                    scrolling="no"
                                    frameBorder="0"
                                    allowFullScreen={true}
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                    className="w-full h-full rounded-xl"
                                    title="Facebook Iframe Preview"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : newEventInput.trim() ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 sm:p-3.5 text-xs text-rose-800 flex items-start gap-2">
                            <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="font-semibold">Unable to parse Facebook URL</p>
                              <p className="text-[11px] text-rose-700 mt-0.5">
                                Please ensure your input contains a link to Facebook (e.g. <code>https://www.facebook.com/...</code>) or an official Facebook iframe embed snippet.
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="p-3.5 sm:p-4 bg-brand-light/30 border-t border-brand-pale flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddEventOpen(false);
                            setNewEventInput('');
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-brand-white border border-brand-pale text-slate-700 text-xs font-semibold hover:bg-brand-light cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!parsedNewEvent}
                          onClick={() => {
                            if (!parsedNewEvent) return;
                            addEvent({
                              ...parsedNewEvent,
                              height: Number(newEventHeight) || 645
                            });
                            setNewEventInput('');
                            setIsAddEventOpen(false);
                            showToast('Facebook event added to Events page!', 'success');
                          }}
                          className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-full text-xs font-bold transition cursor-pointer shadow-2xs text-center ${parsedNewEvent
                              ? 'bg-brand-forest hover:bg-brand-forestHover text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                          Add Facebook Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EDIT MANUAL EVENT MODAL */}
            {editingEvent && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col animate-modal-content">
                  {/* Modal Header */}
                  <div className="bg-brand-forest p-3.5 sm:p-5 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold">Edit Event Text &amp; Details</h3>
                        <p className="text-[10px] sm:text-[11px] text-brand-pale">
                          Update titles, descriptions, date, location, or picture
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingEvent(null)}
                      className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditEvent} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                      {/* Photo Box & Live Preview */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Event Picture / Poster
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={editEventPhotoInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleEditEventPhotoFile(file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />

                        {editingEvent.image ? (
                          <div className="space-y-3">
                            {/* Live Card Full-Cover Preview */}
                            <div className="relative w-full max-w-[280px] mx-auto h-[360px] rounded-2xl overflow-hidden shadow-lg border border-slate-700/60 flex flex-col justify-between bg-slate-900 group">
                              <img
                                src={editingEvent.image}
                                alt="Event preview"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 pointer-events-none" />

                              {/* Top Bar Floating */}
                              <div className="relative z-10 p-3 flex items-center justify-between gap-2">
                                <span className="px-2.5 py-1 rounded-full bg-brand-forest/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-xs border border-white/20">
                                  {editingEvent.category || 'School Event'}
                                </span>
                                {editingEvent.date && (
                                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs border border-white/15">
                                    {editingEvent.date}
                                  </span>
                                )}
                              </div>

                              {/* Bottom Content Scrim */}
                              <div className="relative z-10 p-4 space-y-1 text-white">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[9px] font-bold uppercase tracking-wider mb-1">
                                  Full Card Cover Preview
                                </span>
                                <h4 className="text-sm font-bold text-white line-clamp-2 drop-shadow-sm">
                                  {editingEvent.title || 'Event Title will appear here...'}
                                </h4>
                                {editingEvent.titleTa && (
                                  <p className="text-xs font-tamil text-emerald-300 font-semibold line-clamp-1">
                                    {editingEvent.titleTa}
                                  </p>
                                )}
                                {editingEvent.location && (
                                  <p className="text-[11px] text-white/80 truncate flex items-center gap-1">
                                    <span>📍</span>
                                    <span>{editingEvent.location}</span>
                                  </p>
                                )}
                                {editingEvent.description && (
                                  <p className="text-xs text-white/85 line-clamp-2 leading-relaxed pt-0.5">
                                    {editingEvent.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Photo Stats & Actions */}
                            <div className="flex items-center justify-between bg-brand-light/40 border border-brand-pale rounded-xl px-3 py-2 text-xs">
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold mr-2">
                                  Photo Attached
                                </span>
                                {editPhotoStats && (
                                  <span className="text-[11px] text-slate-600">
                                    {formatBytes(editPhotoStats.compressedSize)}
                                    {editPhotoStats.reductionPercent > 0 && (
                                      <span className="text-emerald-700 font-semibold ml-1">
                                        (-{editPhotoStats.reductionPercent}%)
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => editEventPhotoInputRef.current?.click()}
                                  className="text-xs text-brand-forest hover:underline font-semibold cursor-pointer"
                                >
                                  Change Photo
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEvent(prev => prev ? { ...prev, image: '' } : null);
                                    setEditPhotoStats(null);
                                  }}
                                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                                >
                                  Remove Photo
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => editEventPhotoInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleEditEventPhotoFile(file);
                            }}
                            className="w-full border-2 border-dashed border-brand-pale hover:border-brand-forest rounded-2xl p-5 text-center cursor-pointer transition hover:bg-brand-light/30 flex flex-col items-center justify-center gap-2"
                          >
                            {isProcessingEditPhoto ? (
                              <div className="flex flex-col items-center gap-2 py-2">
                                <svg className="w-6 h-6 animate-spin text-brand-forest" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span className="text-xs font-semibold text-slate-600">Optimizing photo to WebP...</span>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-forest">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-brand-forest hover:underline">Click to upload event photo</span>
                                  <span className="text-xs text-slate-500"> or drag and drop</span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WebP up to 5 MB</p>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {editPhotoError && (
                          <p className="text-xs text-rose-600 mt-1.5 font-medium">{editPhotoError}</p>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                            <input
                              type="checkbox"
                              checked={editPhotoCompress}
                              onChange={(e) => setEditPhotoCompress(e.target.checked)}
                              className="rounded text-brand-forest focus:ring-brand-forest"
                            />
                            <span>Compress photo to WebP (Recommended)</span>
                          </label>
                        </div>
                      </div>

                      {/* Title Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Event Title (English) *
                          </label>
                          <input
                            type="text"
                            value={editingEvent.title}
                            onChange={(e) => setEditingEvent(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g. Annual Prize Day Ceremony"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            தமிழ் தலைப்பு (Tamil Title)
                          </label>
                          <input
                            type="text"
                            value={editingEvent.titleTa}
                            onChange={(e) => setEditingEvent(prev => ({ ...prev, titleTa: e.target.value }))}
                            placeholder="எ.கா. வருடாந்த பரிசளிப்பு விழா"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs font-tamil focus:outline-none focus:border-brand-forest"
                          />
                        </div>
                      </div>

                      {/* Date, Category, and Location */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Event Date *
                          </label>
                          <input
                            type="date"
                            value={editingEvent.date}
                            onChange={(e) => setEditingEvent(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Category / Tag
                          </label>
                          <input
                            type="text"
                            value={editingEvent.category}
                            onChange={(e) => setEditingEvent(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g. Ceremony, Sports"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Location (Optional)
                          </label>
                          <input
                            type="text"
                            value={editingEvent.location}
                            onChange={(e) => setEditingEvent(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="e.g. College Main Hall"
                            className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest"
                          />
                        </div>
                      </div>

                      {/* Descriptions */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Event Description / Text (English)
                        </label>
                        <textarea
                          rows={3}
                          value={editingEvent.description}
                          onChange={(e) => setEditingEvent(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Provide details about the event, scheduled agenda, guest speakers, or announcements..."
                          className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs focus:outline-none focus:border-brand-forest leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          விபரங்கள் (Tamil Description - Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={editingEvent.descriptionTa}
                          onChange={(e) => setEditingEvent(prev => ({ ...prev, descriptionTa: e.target.value }))}
                          placeholder="நிகழ்வு பற்றிய விபரங்கள்..."
                          className="w-full px-3 py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-xs font-tamil focus:outline-none focus:border-brand-forest leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-3.5 sm:p-4 bg-brand-light/30 border-t border-brand-pale flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingEvent(null)}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-brand-white border border-brand-pale text-slate-700 text-xs font-semibold hover:bg-brand-light cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition cursor-pointer shadow-2xs text-center"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTACT INFORMATION */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <h2 className="text-base sm:text-lg font-bold text-brand-forest mb-1.5">Contact Information</h2>
              <p className="text-xs text-slate-600 mb-5">
                Update the official contact card details and Google Maps location URL shown across the website.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">School Address</label>
                  <input
                    type="text"
                    value={content.contact?.address || ''}
                    onChange={(e) => updateContact({ address: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Telephone</label>
                  <input
                    type="text"
                    value={content.contact?.phone || ''}
                    onChange={(e) => updateContact({ phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={content.contact?.email || ''}
                    onChange={(e) => updateContact({ email: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Office Hours</label>
                  <input
                    type="text"
                    value={content.contact?.officeHours || ''}
                    onChange={(e) => updateContact({ officeHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Google Maps URL</label>
                  <input
                    type="text"
                    value={content.contact?.mapsUrl || ''}
                    onChange={(e) => updateContact({ mapsUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Facebook Profile URL</label>
                  <input
                    type="text"
                    value={content.contact?.facebookUrl || ''}
                    onChange={(e) => updateContact({ facebookUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Instagram URL</label>
                  <input
                    type="text"
                    value={content.contact?.instagramUrl || ''}
                    onChange={(e) => updateContact({ instagramUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS & BACKUP */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-brand-forest">Administrator Account</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Secured by Firebase Authentication 
                  </p>
                </div>
                
              </div>

              <div className="max-w-xl bg-brand-light/30 border border-brand-pale rounded-2xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-brand-pale/70 pb-2.5 gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Logged In As</span>
                  <span className="font-bold text-slate-800 truncate text-right">{firebaseUser?.email || 'Authenticated Admin'}</span>
                </div>
                {firebaseUser?.displayName && (
                  <div className="flex items-center justify-between border-b border-brand-pale/70 pb-2.5 gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Display Name</span>
                    <span className="font-semibold text-slate-800 truncate text-right">{firebaseUser.displayName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-brand-pale/70 pb-2.5 gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Sign-In Provider</span>
                  <span className="font-mono font-semibold text-slate-700 text-right">
                    {firebaseUser?.providerData?.[0]?.providerId === 'google.com'
                      ? 'Google OAuth 2.0'
                      : firebaseUser?.providerData?.[0]?.providerId === 'password'
                      ? 'Email & Password'
                      : 'Firebase Auth'}
                  </span>
                </div>
                {firebaseProjectId && (
                  <div className="flex items-center justify-between border-b border-brand-pale/70 pb-2.5 gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Firebase Project ID</span>
                    <span className="font-mono text-brand-forest font-semibold text-right">{firebaseProjectId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Auto Timeout</span>
                  <span className="text-slate-700 font-semibold text-right">15 Min Inactivity</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleLogout()}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer shadow-2xs text-center justify-center flex items-center"
                >
                  Sign Out from Session
                </button>
              </div>
            </div>

            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <h2 className="text-base sm:text-lg font-bold text-brand-forest mb-3">Configuration Backup</h2>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={exportJson}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-brand-white border border-brand-pale hover:bg-brand-light text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs"
                >
                  <svg className="w-4 h-4 text-brand-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Backup JSON</span>
                </button>

                <label className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-brand-white border border-brand-pale hover:bg-brand-light text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs">
                  <svg className="w-4 h-4 text-brand-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Import Backup JSON</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>

                {hasLocalOverrides && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset all changes back to repository defaults?')) {
                        resetToDefaults();
                        showToast('Reset to defaults', 'success');
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer transition sm:ml-auto text-center"
                  >
                    Reset to Defaults
                  </button>
                )}
              </div>
            </div>

            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <h2 className="text-base sm:text-lg font-bold text-brand-forest mb-1.5">GitHub Repository</h2>
              <p className="text-xs text-slate-600 mb-4">
                View the website source code, commit history, and automated deployment actions on GitHub.
              </p>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 sm:py-2 rounded-full bg-brand-light border border-brand-pale hover:border-brand-soft text-brand-forest text-xs font-bold transition shadow-2xs"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span className="truncate">github.com/Sivodayan/KCC-Website</span>
                <svg className="w-3.5 h-3.5 text-brand-forest/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h2 className="text-base sm:text-lg font-bold text-brand-forest">Workflow &amp; Keyboard Shortcuts</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-light text-brand-forest border border-brand-pale">
                    {undoCount} undoable step{undoCount === 1 ? '' : 's'}
                  </span>
                  {redoCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {redoCount} redoable
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                The KCC Admin Console automatically records snapshots of your edits across all tabs.
                <span className="block sm:inline sm:ml-1 text-slate-500">
                  On mobile devices, use the Undo/Redo tap buttons in the sticky top header. On desktop, use standard shortcuts:
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand-light/30 border border-brand-pale">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-brand-white border border-brand-pale text-brand-forest shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Commit Changes</span>
                      <span className="text-[11px] text-slate-500">Opens commit modal / pushes to GitHub</span>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 rounded-lg bg-brand-white border border-slate-200 font-mono text-[11px] font-bold text-brand-forest shadow-2xs shrink-0">
                    Ctrl + S
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand-light/30 border border-brand-pale">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-brand-white border border-brand-pale text-brand-forest shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 10h10a5 5 0 0 1 5 5v2m0 0l-4-4m4 4l4-4M3 10l4-4m-4 4l4 4" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Undo Last Action</span>
                      <span className="text-[11px] text-slate-500">Reverts recent content changes</span>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 rounded-lg bg-brand-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700 shadow-2xs shrink-0">
                    Ctrl + Z
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand-light/30 border border-brand-pale">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-brand-white border border-brand-pale text-brand-forest shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 10H11a5 5 0 0 0-5 5v2m0 0l4-4m-4 4l-4-4m20-3l-4-4m4 4l-4 4" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Redo Action</span>
                      <span className="text-[11px] text-slate-500">Restores undone changes</span>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 rounded-lg bg-brand-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700 shadow-2xs shrink-0">
                    Ctrl + Y 
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand-light/30 border border-brand-pale">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-brand-white border border-brand-pale text-slate-600 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Close Active Modal</span>
                      <span className="text-[11px] text-slate-500">Dismisses dialogs without saving</span>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 rounded-lg bg-brand-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700 shadow-2xs shrink-0">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMMIT DIRECTLY TO GITHUB MODAL */}
        {isCommitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-brand-white border border-brand-pale rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto animate-modal-content">
            {/* Modal Header */}
            <div className="shrink-0 bg-slate-900 px-4 sm:px-5 py-3 sm:py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">Commit to GitHub</h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate">Sivodayan/KCC-Website • branch: main</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isCommitting) {
                    setIsCommitModalOpen(false);
                    setCommitResult(null);
                    setCommitError('');
                  }
                }}
                disabled={isCommitting}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {commitResult ? (
                <div className="text-center py-3 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Committed Successfully!</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Changes pushed directly to <span className="font-mono font-bold text-brand-forest">src/data/siteContent.json</span> on branch <span className="font-mono font-bold">main</span>.
                    </p>
                  </div>

                  <div className="bg-brand-light/40 border border-brand-pale rounded-xl p-3 text-xs space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Commit SHA:</span>
                      <span className="font-mono font-bold text-slate-800">{commitResult.commitSha}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Automated Action:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Cloudflare Pages deploying updates
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-2">
                    <a
                      href={commitResult.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs text-center"
                    >
                      <span>View Commit on GitHub</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCommitModalOpen(false);
                        setCommitResult(null);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-full bg-brand-light border border-brand-pale hover:bg-brand-pale/60 text-brand-forest text-xs font-bold transition cursor-pointer text-center"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCommitToGitHub} className="space-y-4">
                  <div className="bg-brand-light/30 border border-brand-pale rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-brand-forest shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-slate-800">Direct Git Push &amp; Automated Deployment</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        This atomic commit updates <span className="font-mono text-brand-forest font-bold">src/data/siteContent.json</span> on branch <span className="font-mono font-bold">main</span> via the Cloudflare Pages serverless proxy (<span className="font-mono font-semibold">/api/github</span>), which triggers Cloudflare Pages direct build and deployment.
                      </p>
                    </div>
                  </div>

                  {commitError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                      <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <span className="font-bold block">Commit Failed</span>
                        <span>{commitError}</span>
                      </div>
                    </div>
                  )}

                  {isServerProxyReady ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        <span className="font-medium truncate">
                          Cloudflare Secret <code className="font-mono font-bold">GITHUB_TOKEN</code> Connected &amp; Ready
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={checkProxy}
                        disabled={proxyDetails.isChecking}
                        className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold underline shrink-0 cursor-pointer"
                        title="Re-verify Cloudflare Pages proxy"
                      >
                        {proxyDetails.isChecking ? 'Checking...' : 'Re-check'}
                      </button>
                    </div>
                  ) : sessionTokenSaved ? (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="font-medium truncate">
                          Temporary session GitHub Token active (stored for this tab only).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSessionToken}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold underline shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <strong className="block font-bold text-amber-900">GitHub Secret Activation Pending</strong>
                            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                              {proxyDetails.isProxyActive
                                ? 'Cloudflare Pages server function (/api/github) is active, but secrets configured in Cloudflare require a new deployment to take effect. If you just added GITHUB_TOKEN, trigger a Redeploy in the Cloudflare dashboard.'
                                : 'Cloudflare Pages Functions are activating with your latest deployment. If GITHUB_TOKEN is added in Cloudflare dashboard, ensure a new deployment/redeploy has run.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={checkProxy}
                          disabled={proxyDetails.isChecking}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold transition shrink-0 cursor-pointer flex items-center gap-1"
                          title="Re-check proxy status"
                        >
                          <svg className={`w-3 h-3 ${proxyDetails.isChecking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>{proxyDetails.isChecking ? 'Checking...' : 'Re-check'}</span>
                        </button>
                      </div>

                      {/* Temporary Session Token Fallback */}
                      <div className="pt-2.5 border-t border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                            <span>🔑</span>
                            <span>Publish now using GitHub Token:</span>
                          </span>
                          <span className="text-[10px] text-amber-800 font-medium">Session only</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          Paste your GitHub Personal Access Token to commit immediately. Saved only in this browser tab (<code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">sessionStorage</code>) and never committed to code:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={sessionTokenInput}
                            onChange={(e) => setSessionTokenInput(e.target.value)}
                            placeholder="ghp_..."
                            className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-brand-forest/20 bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleSaveSessionToken}
                            disabled={!sessionTokenInput.trim()}
                            className="px-4 py-2 bg-brand-forest text-white text-xs font-bold rounded-xl hover:bg-brand-forestHover transition cursor-pointer disabled:opacity-40 shrink-0"
                          >
                            Set Token
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Commit Message
                    </label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Update website content via KCC Admin Panel"
                      className="w-full px-3.5 py-2.5 sm:py-2 rounded-xl bg-brand-white border border-brand-pale text-slate-800 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-brand-forest/20 focus:border-brand-forest"
                    />
                  </div>

                  <div className="p-3 bg-brand-light/20 border border-brand-pale/70 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Summary of Payload</span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-brand-white border border-brand-pale font-medium text-slate-700">
                        {content.gallery?.length || 0} Gallery Photos
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-white border border-brand-pale font-medium text-slate-700">
                        {content.events?.length || 0} School Events
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-white border border-brand-pale font-medium text-slate-700">
                        {content.history?.milestones?.length || 0} History Milestones
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-white border border-brand-pale font-medium text-slate-700">
                        {((content.history?.headmasters?.length || 0) + (content.history?.managers?.length || 0))} Leadership Records
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-white border border-brand-pale font-medium text-slate-700">
                        8 Key Metrics
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-white border border-brand-pale font-medium text-slate-700">
                        Hero &amp; Principles
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-white border border-brand-pale font-medium text-slate-700">
                        Contact Details
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-brand-pale">
                    <button
                      type="button"
                      disabled={isCommitting}
                      onClick={() => setIsCommitModalOpen(false)}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-full bg-brand-white border border-brand-pale hover:bg-brand-light text-slate-700 text-xs font-semibold transition cursor-pointer text-center"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isCommitting || (!isServerProxyReady && !getEffectiveGitHubToken() && !sessionTokenInput.trim())}
                      title="Commit & Publish to GitHub (Ctrl+Enter or Ctrl+S)"
                      className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition shadow-md active:scale-95 ${
                        isCommitting || (!isServerProxyReady && !getEffectiveGitHubToken() && !sessionTokenInput.trim()) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {isCommitting ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Committing to GitHub...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                          <span>Commit &amp; Publish</span>
                          <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-white/20 text-[10px] font-mono font-medium text-white/90">
                            Ctrl+↵
                          </kbd>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM LEAVE / COMMIT MODAL */}
      {isLeaveConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLeaveConfirmOpen(false);
          }}
        >
          <div className="bg-brand-white rounded-2xl sm:rounded-3xl border border-brand-pale shadow-2xl max-w-md w-full overflow-hidden p-5 sm:p-7 space-y-4 sm:space-y-5 animate-modal-content">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Uncommitted Changes</h3>
                <p className="text-xs text-slate-500">You have modified site content in this session</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your modifications are saved in your local browser cache. If you leave without committing, they will not be published to the official GitHub repository for the live school website.
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLeaveConfirmOpen(false);
                  handleOpenCommitModal();
                }}
                className="w-full py-3 sm:py-2.5 px-4 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Commit to GitHub Before Leaving</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLeaveConfirmOpen(false);
                  navigate('/');
                }}
                className="w-full py-3 sm:py-2.5 px-4 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
              >
                <span>Leave Without Committing (Return Home)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLeaveConfirmOpen(false)}
                className="w-full py-2.5 sm:py-2 px-4 rounded-full bg-brand-light hover:bg-brand-pale text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel &amp; Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
      </main>

      <footer className="py-6 px-4 border-t border-brand-pale bg-brand-white text-center text-xs text-slate-500 mt-auto">
        <p className="font-semibold text-slate-700">J/Kopay Christian College Admin Panel</p>
        <p className="mt-1">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-forest hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>GitHub Repository: Sivodayan/KCC-Website</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </p>
      </footer>
    </div>
  );
}
