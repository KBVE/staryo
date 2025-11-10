/// <reference lib="webworker" />
// src/components/profile/userProfile.worker.ts
// Dedicated Worker for profile operations - handles heavy computation and Supa communication

import type {
  UserProfile,
  ProfileWorkerRequest,
  ProfileWorkerResponse,
} from './userProfile';

import {
  serializeProfile,
  deserializeProfile,
  createProfileFromSession,
} from './userProfile';

// Worker-specific imports
declare const self: DedicatedWorkerGlobalScope;

/**
 * Reference to Supa SharedWorker port
 */
let supaPort: MessagePort | null = null;
let supaReady = false;

/**
 * Message queue for Supa requests before ready
 */
const supaMessageQueue: Array<{
  id: string;
  type: string;
  payload?: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Pending Supa requests
 */
const supaPendingRequests = new Map<
  string,
  { resolve: (value: any) => void; reject: (error: any) => void }
>();

/**
 * Initialize connection to Supa SharedWorker
 */
function initSupaConnection() {
  try {
    const worker = new SharedWorker(
      new URL('../../workers/supabase.shared.ts', import.meta.url),
      { type: 'module' }
    );

    supaPort = worker.port;

    supaPort.onmessage = (e) => {
      const msg = e.data;

      // Handle ready message
      if (msg?.type === 'ready') {
        supaReady = true;
        // Process queued messages
        while (supaMessageQueue.length > 0) {
          const queued = supaMessageQueue.shift();
          if (queued && supaPort) {
            supaPort.postMessage({
              id: queued.id,
              type: queued.type,
              payload: queued.payload,
            });
            supaPendingRequests.set(queued.id, {
              resolve: queued.resolve,
              reject: queued.reject,
            });
          }
        }
        return;
      }

      // Handle auth state changes
      if (msg?.type === 'auth') {
        // Notify main thread of auth changes
        self.postMessage({
          type: 'AUTH_STATE_CHANGED',
          data: msg.session,
        } as ProfileWorkerResponse);
        return;
      }

      // Handle response
      const { id, ok, data, error } = msg ?? {};
      if (id && supaPendingRequests.has(id)) {
        const { resolve, reject } = supaPendingRequests.get(id)!;
        supaPendingRequests.delete(id);
        ok ? resolve(data) : reject(new Error(error));
      }
    };

    supaPort.start();
  } catch (error) {
    console.error('[ProfileWorker] Failed to connect to Supa:', error);
  }
}

/**
 * Send message to Supa SharedWorker
 */
function sendToSupa<T>(type: string, payload?: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = crypto.randomUUID();

    if (!supaReady || !supaPort) {
      // Queue the message
      supaMessageQueue.push({ id, type, payload, resolve, reject });
      return;
    }

    supaPendingRequests.set(id, { resolve, reject });
    supaPort.postMessage({ id, type, payload });
  });
}

/**
 * Fetch user profile from Supabase
 */
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  try {
    // Get current session from Supa
    const sessionData = await sendToSupa<{ session: any; user: any }>('getSession');

    if (!sessionData.session) {
      throw new Error('Not authenticated');
    }

    // Try to fetch profile from profiles table
    try {
      const profileData = await sendToSupa<any>('from.select', {
        table: 'profiles',
        match: { id: userId },
        limit: 1,
      });

      if (profileData && profileData.length > 0) {
        // Convert database record to UserProfile
        const dbProfile = profileData[0];
        return {
          id: dbProfile.id,
          email: sessionData.session.user.email || '',
          username: dbProfile.username,
          displayName: dbProfile.display_name || dbProfile.username,
          avatarUrl: dbProfile.avatar_url,
          bio: dbProfile.bio,
          createdAt: new Date(dbProfile.created_at).getTime(),
          updatedAt: new Date(dbProfile.updated_at || dbProfile.created_at).getTime(),
          metadata: dbProfile.metadata,
        };
      }
    } catch (profileError) {
      console.warn('[ProfileWorker] Profile table not found, using session data:', profileError);
    }

    // Fallback to session data
    return createProfileFromSession(sessionData.session);
  } catch (error) {
    throw new Error(`Failed to fetch profile: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update user profile in Supabase
 */
async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    // Get current session
    const sessionData = await sendToSupa<{ session: any; user: any }>('getSession');

    if (!sessionData.session) {
      throw new Error('Not authenticated');
    }

    const userId = sessionData.session.user.id;

    // Prepare update payload for database
    const dbUpdates: any = {};
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
    dbUpdates.updated_at = new Date().toISOString();

    // Update in database (if profiles table exists)
    try {
      await sendToSupa('from.update', {
        table: 'profiles',
        match: { id: userId },
        payload: dbUpdates,
      });
    } catch (updateError) {
      console.warn('[ProfileWorker] Failed to update profile table:', updateError);
    }

    // Fetch updated profile
    return await fetchUserProfile(userId);
  } catch (error) {
    throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Process avatar image using OffscreenCanvas
 * Creates optimized versions for display and thumbnail
 */
async function processAvatar(imageData: ArrayBuffer, mimeType: string): Promise<{ url: string; thumbnail: string }> {
  try {
    // Create blob from ArrayBuffer
    const blob = new Blob([imageData], { type: mimeType });

    // Create ImageBitmap for efficient processing
    const imageBitmap = await createImageBitmap(blob);

    const originalWidth = imageBitmap.width;
    const originalHeight = imageBitmap.height;

    // Create OffscreenCanvas for main image (max 512x512)
    const maxSize = 512;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (originalWidth > maxSize || originalHeight > maxSize) {
      const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
      targetWidth = Math.floor(originalWidth * scale);
      targetHeight = Math.floor(originalHeight * scale);
    }

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw and resize main image
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    // Convert to blob
    const mainBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });

    // Create thumbnail (128x128)
    const thumbSize = 128;
    const thumbScale = Math.min(thumbSize / originalWidth, thumbSize / originalHeight);
    const thumbWidth = Math.floor(originalWidth * thumbScale);
    const thumbHeight = Math.floor(originalHeight * thumbScale);

    const thumbCanvas = new OffscreenCanvas(thumbWidth, thumbHeight);
    const thumbCtx = thumbCanvas.getContext('2d');

    if (!thumbCtx) {
      throw new Error('Failed to get thumbnail 2D context');
    }

    thumbCtx.imageSmoothingEnabled = true;
    thumbCtx.imageSmoothingQuality = 'high';
    thumbCtx.drawImage(imageBitmap, 0, 0, thumbWidth, thumbHeight);

    const thumbBlob = await thumbCanvas.convertToBlob({ type: 'image/webp', quality: 0.75 });

    // Create object URLs
    const url = URL.createObjectURL(mainBlob);
    const thumbnail = URL.createObjectURL(thumbBlob);

    // Clean up
    imageBitmap.close();

    return { url, thumbnail };
  } catch (error) {
    throw new Error(`Failed to process avatar: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Render avatar with effects on OffscreenCanvas
 */
async function renderAvatarCanvas(
  imageUrl: string,
  size: number,
  effects?: import('./userProfile').AvatarEffects
): Promise<OffscreenCanvas> {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Fetch and load image
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  // Enable image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply shadow if requested
  if (effects?.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }

  // Draw circular avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Apply grayscale filter if requested
  if (effects?.grayscale) {
    ctx.filter = 'grayscale(100%)';
  }

  // Draw image
  ctx.drawImage(imageBitmap, 0, 0, size, size);
  ctx.restore();

  // Draw border if requested
  if (effects?.borderWidth && effects?.borderColor) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - effects.borderWidth / 2, 0, Math.PI * 2);
    ctx.strokeStyle = effects.borderColor;
    ctx.lineWidth = effects.borderWidth;
    ctx.stroke();
  }

  // Draw badge if requested
  if (effects?.badge) {
    const badgeSize = size * 0.3;
    const badgeRadius = badgeSize / 2;
    let badgeX: number, badgeY: number;

    switch (effects.badge.position) {
      case 'top-right':
        badgeX = size - badgeRadius;
        badgeY = badgeRadius;
        break;
      case 'bottom-right':
        badgeX = size - badgeRadius;
        badgeY = size - badgeRadius;
        break;
      case 'top-left':
        badgeX = badgeRadius;
        badgeY = badgeRadius;
        break;
      case 'bottom-left':
        badgeX = badgeRadius;
        badgeY = size - badgeRadius;
        break;
    }

    // Draw badge background
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = effects.badge.color;
    ctx.fill();

    // Draw badge text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${badgeSize * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(effects.badge.text, badgeX, badgeY);
  }

  // Clean up
  imageBitmap.close();

  return canvas;
}

/**
 * Render profile badge on OffscreenCanvas
 */
async function renderProfileBadge(level: number, title: string): Promise<OffscreenCanvas> {
  const width = 200;
  const height = 80;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Draw badge background with gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#a855f7');
  gradient.addColorStop(1, '#7e22ce');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 10);
  ctx.fill();

  // Draw level
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(level.toString(), 15, height / 2);

  // Draw title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width - 15, height / 2);

  return canvas;
}

/**
 * Render stats chart on OffscreenCanvas
 */
async function renderStatsChart(data: number[], width: number, height: number): Promise<OffscreenCanvas> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxValue = Math.max(...data);
  const barWidth = chartWidth / data.length;

  // Draw background
  ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
  ctx.fillRect(0, 0, width, height);

  // Draw bars
  data.forEach((value, index) => {
    const barHeight = (value / maxValue) * chartHeight;
    const x = padding + index * barWidth;
    const y = height - padding - barHeight;

    // Gradient for bar
    const gradient = ctx.createLinearGradient(x, y, x, height - padding);
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(1, '#7e22ce');

    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
  });

  // Draw grid lines
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  return canvas;
}

/**
 * Handle messages from main thread
 */
self.onmessage = async (e: MessageEvent<ProfileWorkerRequest>) => {
  const msg = e.data;

  try {
    switch (msg.type) {
      case 'FETCH_PROFILE': {
        const profile = await fetchUserProfile(msg.payload.userId);
        self.postMessage({
          type: 'PROFILE_FETCHED',
          data: profile,
        } as ProfileWorkerResponse);
        break;
      }

      case 'UPDATE_PROFILE': {
        const updatedProfile = await updateUserProfile(msg.payload);
        self.postMessage({
          type: 'PROFILE_UPDATED',
          data: updatedProfile,
        } as ProfileWorkerResponse);
        break;
      }

      case 'PROCESS_AVATAR': {
        const result = await processAvatar(msg.payload.imageData, msg.payload.mimeType);
        self.postMessage({
          type: 'AVATAR_PROCESSED',
          data: result,
        } as ProfileWorkerResponse);
        break;
      }

      case 'RENDER_AVATAR_CANVAS': {
        const canvas = await renderAvatarCanvas(
          msg.payload.imageUrl,
          msg.payload.size,
          msg.payload.effects
        );
        self.postMessage(
          {
            type: 'CANVAS_RENDERED',
            data: { canvas, target: 'profile-avatar-canvas' },
          } as ProfileWorkerResponse,
          [canvas] // Transfer canvas ownership
        );
        break;
      }

      case 'RENDER_PROFILE_BADGE': {
        const canvas = await renderProfileBadge(msg.payload.level, msg.payload.title);
        self.postMessage(
          {
            type: 'CANVAS_RENDERED',
            data: { canvas, target: 'profile-badge-canvas' },
          } as ProfileWorkerResponse,
          [canvas] // Transfer canvas ownership
        );
        break;
      }

      case 'RENDER_STATS_CHART': {
        const canvas = await renderStatsChart(
          msg.payload.data,
          msg.payload.width,
          msg.payload.height
        );
        self.postMessage(
          {
            type: 'CANVAS_RENDERED',
            data: { canvas, target: 'profile-stats-canvas' },
          } as ProfileWorkerResponse,
          [canvas] // Transfer canvas ownership
        );
        break;
      }

      case 'SERIALIZE_PROFILE': {
        const buffer = serializeProfile(msg.payload);
        self.postMessage(
          {
            type: 'PROFILE_SERIALIZED',
            data: buffer,
          } as ProfileWorkerResponse,
          [buffer] // Transfer ownership
        );
        break;
      }

      case 'DESERIALIZE_PROFILE': {
        const profile = deserializeProfile(msg.payload);
        self.postMessage({
          type: 'PROFILE_DESERIALIZED',
          data: profile,
        } as ProfileWorkerResponse);
        break;
      }

      default: {
        const _exhaustive: never = msg;
        throw new Error(`Unknown message type: ${(_exhaustive as any).type}`);
      }
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    } as ProfileWorkerResponse);
  }
};

// Initialize Supa connection when worker starts
initSupaConnection();

// Notify main thread that worker is ready
self.postMessage({ type: 'WORKER_READY' } as ProfileWorkerResponse);
