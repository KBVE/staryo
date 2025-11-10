// src/components/profile/ReactUserProfile.tsx
// Lightweight React wrapper that fills data-x-kbve elements
// Delegates heavy work to the worker, minimal main thread overhead

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type {
  UserProfile,
  ProfileWorkerRequest,
  ProfileWorkerResponse,
} from './userProfile';

interface ReactUserProfileProps {
  userId?: string;
  className?: string;
  onProfileLoaded?: (profile: UserProfile) => void;
  onError?: (error: string) => void;
}

/**
 * Lightweight React component for user profile
 * Fills data-x-kbve elements and manages interactive controls
 */
export default function ReactUserProfile({
  userId,
  className = '',
  onProfileLoaded,
  onError,
}: ReactUserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const isFirstRender = useRef(true);

  // Get vanilla JS helpers
  const profileHelpers = (window as any).__profileHelpers;

  // Check if mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Initialize worker and load profile
   */
  useEffect(() => {
    if (!mounted) return;

    let workerInstance: Worker | null = null;
    let cleanedUp = false;

    const initWorker = async () => {
      try {
        // Create worker
        workerInstance = new Worker(
          new URL('./userProfile.worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current = workerInstance;

        // Handle worker messages
        workerInstance.onmessage = (e: MessageEvent<ProfileWorkerResponse>) => {
          if (cleanedUp) return;

          const msg = e.data;

          switch (msg.type) {
            case 'WORKER_READY':
              // Get session and load profile
              loadProfile();
              break;

            case 'PROFILE_FETCHED':
              if (!cleanedUp) {
                setProfile(msg.data);
                setLoading(false);
                onProfileLoaded?.(msg.data);

                // Fill data-x-kbve elements on first render
                if (isFirstRender.current && profileHelpers) {
                  profileHelpers.updateProfileUI(msg.data);
                  isFirstRender.current = false;
                }
              }
              break;

            case 'PROFILE_UPDATED':
              if (!cleanedUp) {
                setProfile(msg.data);
                setIsEditing(false);

                // Update UI
                if (profileHelpers) {
                  profileHelpers.updateProfileUI(msg.data);
                }
              }
              break;

            case 'AVATAR_PROCESSED':
              if (!cleanedUp && profileHelpers && profile) {
                profileHelpers.updateAvatar(msg.data.url, profile.displayName || 'User');
              }
              break;

            case 'CANVAS_RENDERED':
              if (!cleanedUp && profileHelpers) {
                // Transfer OffscreenCanvas from worker to DOM
                profileHelpers.insertCanvas(msg.data.target, msg.data.canvas);
              }
              break;

            case 'ERROR':
              if (!cleanedUp) {
                console.error('[ReactProfile] Worker error:', msg.error);
                setError(msg.error);
                setLoading(false);
                onError?.(msg.error);
              }
              break;

            case 'AUTH_STATE_CHANGED':
              // Reload profile on auth change
              if (!cleanedUp) {
                loadProfile();
              }
              break;
          }
        };

        workerInstance.onerror = (err) => {
          if (!cleanedUp) {
            console.error('[ReactProfile] Worker error:', err);
            setError('Worker initialization failed');
            setLoading(false);
            onError?.('Worker initialization failed');
          }
        };
      } catch (err) {
        if (!cleanedUp) {
          console.error('[ReactProfile] Failed to create worker:', err);
          setError(err instanceof Error ? err.message : 'Initialization failed');
          setLoading(false);
          onError?.(err instanceof Error ? err.message : 'Initialization failed');
        }
      }
    };

    initWorker();

    return () => {
      cleanedUp = true;
      if (workerInstance) {
        workerInstance.terminate();
      }
    };
  }, [mounted, onProfileLoaded, onError]);

  /**
   * Load profile from worker
   */
  const loadProfile = useCallback(async () => {
    if (!workerRef.current) return;

    try {
      setLoading(true);

      // Get session from Supa
      const { getSupa } = await import('../../lib/supa');
      const supa = getSupa();
      const sessionData = await supa.getSession();

      if (!sessionData?.session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const userId = sessionData.session.user.id;

      // Request profile from worker
      workerRef.current.postMessage({
        type: 'FETCH_PROFILE',
        payload: { userId },
      } as ProfileWorkerRequest);
    } catch (err) {
      console.error('[ReactProfile] Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setLoading(false);
      onError?.(err instanceof Error ? err.message : 'Failed to load profile');
    }
  }, [onError]);

  /**
   * Update profile
   */
  const handleUpdateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (!workerRef.current) return;

      setLoading(true);

      workerRef.current.postMessage({
        type: 'UPDATE_PROFILE',
        payload: updates,
      } as ProfileWorkerRequest);
    },
    []
  );

  /**
   * Handle avatar upload
   */
  const handleAvatarUpload = useCallback(
    async (file: File) => {
      if (!workerRef.current) return;

      try {
        const arrayBuffer = await file.arrayBuffer();

        workerRef.current.postMessage({
          type: 'PROCESS_AVATAR',
          payload: {
            imageData: arrayBuffer,
            mimeType: file.type,
          },
        } as ProfileWorkerRequest);
      } catch (err) {
        console.error('[ReactProfile] Failed to process avatar:', err);
        onError?.(err instanceof Error ? err.message : 'Failed to process avatar');
      }
    },
    [onError]
  );

  // Don't render anything until mounted (SSR safety)
  if (!mounted) return null;

  // Error state - show in controls area
  if (error && !loading) {
    return createPortal(
      <div
        className={cn(
          'mt-4 flex items-center gap-3 p-4 rounded-lg',
          'transition-all duration-300',
          className
        )}
        style={{
          backgroundColor: 'var(--sl-color-bg-accent)',
          color: 'var(--sl-color-text-accent)',
        }}
        role="alert"
        aria-live="assertive"
      >
        <svg
          className="w-5 h-5 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="text-sm font-medium">Error Loading Profile</h3>
          <p className="text-xs opacity-80 mt-1">{error}</p>
        </div>
      </div>,
      document.querySelector('[data-x-kbve="profile-controls"]') || document.body
    );
  }

  // Loading state - skeleton is already visible, no additional UI needed
  if (loading) {
    return null;
  }

  // Render interactive controls in the controls area
  return createPortal(
    <div className={cn('mt-6 space-y-4', className)}>
      {/* Edit Mode Toggle */}
      {!isEditing && profile && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2'
            )}
            style={{
              backgroundColor: 'var(--sl-color-accent)',
              color: 'var(--sl-color-white)',
              '--tw-ring-color': 'var(--sl-color-accent)',
            } as any}
            aria-label="Edit profile"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Edit Form */}
      {isEditing && profile && (
        <form
          className={cn(
            'p-4 rounded-lg space-y-4',
            'animate-in fade-in duration-200'
          )}
          style={{
            backgroundColor: 'var(--sl-color-bg-accent)',
          }}
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleUpdateProfile({
              displayName: formData.get('displayName') as string,
              bio: formData.get('bio') as string,
            });
          }}
          aria-label="Edit profile form"
        >
          <div>
            <label
              htmlFor="edit-display-name"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--sl-color-text)' }}
            >
              Display Name
            </label>
            <input
              id="edit-display-name"
              name="displayName"
              type="text"
              defaultValue={profile.displayName}
              className={cn(
                'w-full px-3 py-2 rounded-lg',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2'
              )}
              style={{
                backgroundColor: 'var(--sl-color-bg)',
                color: 'var(--sl-color-text)',
                borderWidth: '1px',
                borderColor: 'var(--sl-color-border)',
                '--tw-ring-color': 'var(--sl-color-accent)',
              } as any}
              aria-label="Display name input"
            />
          </div>

          <div>
            <label
              htmlFor="edit-bio"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--sl-color-text)' }}
            >
              Bio
            </label>
            <textarea
              id="edit-bio"
              name="bio"
              rows={3}
              maxLength={500}
              defaultValue={profile.bio}
              className={cn(
                'w-full px-3 py-2 rounded-lg',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2'
              )}
              style={{
                backgroundColor: 'var(--sl-color-bg)',
                color: 'var(--sl-color-text)',
                borderWidth: '1px',
                borderColor: 'var(--sl-color-border)',
                '--tw-ring-color': 'var(--sl-color-accent)',
              } as any}
              aria-label="Biography input"
            />
          </div>

          <div>
            <label
              htmlFor="edit-avatar"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--sl-color-text)' }}
            >
              Avatar
            </label>
            <input
              id="edit-avatar"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2'
              )}
              style={{
                backgroundColor: 'var(--sl-color-bg)',
                color: 'var(--sl-color-text)',
                borderWidth: '1px',
                borderColor: 'var(--sl-color-border)',
                '--tw-ring-color': 'var(--sl-color-accent)',
              } as any}
              aria-label="Avatar upload input"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2'
              )}
              style={{
                backgroundColor: 'var(--sl-color-bg)',
                color: 'var(--sl-color-text)',
                borderWidth: '1px',
                borderColor: 'var(--sl-color-border)',
                '--tw-ring-color': 'var(--sl-color-accent)',
              } as any}
              aria-label="Cancel editing"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              style={{
                backgroundColor: 'var(--sl-color-accent)',
                color: 'var(--sl-color-white)',
                '--tw-ring-color': 'var(--sl-color-accent)',
              } as any}
              aria-label="Save profile changes"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>,
    document.querySelector('[data-x-kbve="profile-controls"]') || document.body
  );
}
