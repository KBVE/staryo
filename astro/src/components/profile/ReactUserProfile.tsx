// src/components/profile/ReactUserProfile.tsx
// Lightweight React wrapper for user profile
// Delegates heavy work to the worker and uses vanilla JS helpers

import React, { useEffect, useState, useCallback, useRef } from 'react';
import type {
  UserProfile,
  ProfileState,
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
 * Uses the existing vanilla JS infrastructure and worker
 */
export default function ReactUserProfile({
  userId,
  className = '',
  onProfileLoaded,
  onError,
}: ReactUserProfileProps) {
  const [profileState, setProfileState] = useState<ProfileState>({ status: 'loading' });
  const workerRef = useRef<Worker | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Initialize worker connection
   */
  useEffect(() => {
    let mounted = true;

    const initWorker = async () => {
      try {
        // Check if vanilla JS helpers already initialized a worker
        const existingWorker = (window as any).__profileHelpers?.getWorker?.();

        if (existingWorker) {
          workerRef.current = existingWorker;

          // Check if profile already loaded
          const existingProfile = (window as any).__profileHelpers?.getCurrentProfile?.();
          if (existingProfile && mounted) {
            setProfileState({ status: 'authenticated', profile: existingProfile });
            onProfileLoaded?.(existingProfile);
          }
          return;
        }

        // Create new worker if not already created
        const worker = new Worker(
          new URL('./userProfile.worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (e: MessageEvent<ProfileWorkerResponse>) => {
          if (!mounted) return;

          const msg = e.data;

          switch (msg.type) {
            case 'WORKER_READY':
              // Worker ready, fetch profile
              if (userId) {
                worker.postMessage({
                  type: 'FETCH_PROFILE',
                  payload: { userId },
                } as ProfileWorkerRequest);
              }
              break;

            case 'PROFILE_FETCHED':
              setProfileState({ status: 'authenticated', profile: msg.data });
              onProfileLoaded?.(msg.data);
              break;

            case 'PROFILE_UPDATED':
              setProfileState({ status: 'authenticated', profile: msg.data });
              setIsEditing(false);
              break;

            case 'ERROR':
              setProfileState({ status: 'error', error: msg.error });
              onError?.(msg.error);
              break;

            case 'AUTH_STATE_CHANGED':
              // Reload profile on auth state change
              if (userId) {
                worker.postMessage({
                  type: 'FETCH_PROFILE',
                  payload: { userId },
                } as ProfileWorkerRequest);
              }
              break;
          }
        };

        worker.onerror = (error) => {
          console.error('[ReactProfile] Worker error:', error);
          if (mounted) {
            setProfileState({ status: 'error', error: 'Worker initialization failed' });
            onError?.('Worker initialization failed');
          }
        };

        workerRef.current = worker;
      } catch (error) {
        console.error('[ReactProfile] Failed to initialize:', error);
        if (mounted) {
          setProfileState({
            status: 'error',
            error: error instanceof Error ? error.message : 'Initialization failed',
          });
          onError?.(error instanceof Error ? error.message : 'Initialization failed');
        }
      }
    };

    initWorker();

    return () => {
      mounted = false;
      // Don't terminate the worker if it's shared with vanilla JS
      if (workerRef.current && !(window as any).__profileHelpers?.getWorker) {
        workerRef.current.terminate();
      }
    };
  }, [userId, onProfileLoaded, onError]);

  /**
   * Update profile handler
   */
  const handleUpdateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (!workerRef.current) {
        console.error('[ReactProfile] Worker not initialized');
        return;
      }

      setProfileState({ status: 'loading' });

      workerRef.current.postMessage({
        type: 'UPDATE_PROFILE',
        payload: updates,
      } as ProfileWorkerRequest);
    },
    []
  );

  /**
   * Process avatar handler
   */
  const handleAvatarUpload = useCallback(
    async (file: File) => {
      if (!workerRef.current) {
        console.error('[ReactProfile] Worker not initialized');
        return;
      }

      try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Send to worker for processing
        workerRef.current.postMessage({
          type: 'PROCESS_AVATAR',
          payload: {
            imageData: arrayBuffer,
            mimeType: file.type,
          },
        } as ProfileWorkerRequest);
      } catch (error) {
        console.error('[ReactProfile] Failed to process avatar:', error);
        onError?.(
          error instanceof Error ? error.message : 'Failed to process avatar'
        );
      }
    },
    [onError]
  );

  /**
   * Render loading state
   */
  if (profileState.status === 'loading') {
    return (
      <div
        className={`profile-react-wrapper ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Loading user profile"
      >
        <div className="flex items-center justify-center p-8">
          <svg
            className="w-8 h-8 text-gray-400 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (profileState.status === 'error') {
    return (
      <div
        className={`profile-react-wrapper ${className}`}
        role="alert"
        aria-live="assertive"
        aria-label="Profile error"
      >
        <div className="flex items-center gap-3 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <svg
            className="w-6 h-6 text-red-500"
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
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error Loading Profile
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {profileState.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render anonymous state
   */
  if (profileState.status === 'anonymous') {
    return (
      <div
        className={`profile-react-wrapper ${className}`}
        role="status"
        aria-label="Not logged in"
      >
        <div className="flex items-center justify-center p-8 text-gray-600 dark:text-gray-400">
          <p>Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  /**
   * Render authenticated profile (minimal - most rendering is done by vanilla JS)
   */
  const { profile } = profileState;

  return (
    <div
      className={`profile-react-wrapper ${className}`}
      role="region"
      aria-label="User profile"
    >
      {/*
        Most of the UI is rendered by AstroUserProfile.astro
        This React component provides additional interactive controls
      */}

      {/* Edit Mode Toggle (example of React-specific functionality) */}
      {!isEditing && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Edit profile"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Simple Edit Form (example) */}
      {isEditing && (
        <form
          className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
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
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-display-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Display Name
              </label>
              <input
                id="edit-display-name"
                name="displayName"
                type="text"
                defaultValue={profile.displayName}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Display name input"
              />
            </div>

            <div>
              <label
                htmlFor="edit-bio"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Bio
              </label>
              <textarea
                id="edit-bio"
                name="bio"
                rows={3}
                defaultValue={profile.bio}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Biography input"
              />
            </div>

            <div>
              <label
                htmlFor="edit-avatar"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Avatar upload input"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Cancel editing"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Save profile changes"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
