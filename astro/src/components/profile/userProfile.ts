// src/components/profile/userProfile.ts
// Core TypeScript functions for user profile management
// Optimized for performance with ArrayBuffer serialization

/**
 * User profile data structure
 */
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

/**
 * Profile state for UI
 */
export type ProfileState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'authenticated'; profile: UserProfile }
  | { status: 'anonymous' };

/**
 * Message types for worker communication
 */
export type ProfileWorkerRequest =
  | { type: 'FETCH_PROFILE'; payload: { userId: string } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'PROCESS_AVATAR'; payload: { imageData: ArrayBuffer; mimeType: string } }
  | { type: 'RENDER_AVATAR_CANVAS'; payload: { imageUrl: string; size: number; effects?: AvatarEffects } }
  | { type: 'RENDER_PROFILE_BADGE'; payload: { level: number; title: string } }
  | { type: 'RENDER_STATS_CHART'; payload: { data: number[]; width: number; height: number } }
  | { type: 'SERIALIZE_PROFILE'; payload: UserProfile }
  | { type: 'DESERIALIZE_PROFILE'; payload: ArrayBuffer };

export type ProfileWorkerResponse =
  | { type: 'PROFILE_FETCHED'; data: UserProfile }
  | { type: 'PROFILE_UPDATED'; data: UserProfile }
  | { type: 'AVATAR_PROCESSED'; data: { url: string; thumbnail: string } }
  | { type: 'CANVAS_RENDERED'; data: { canvas: OffscreenCanvas; target: string } }
  | { type: 'PROFILE_SERIALIZED'; data: ArrayBuffer }
  | { type: 'PROFILE_DESERIALIZED'; data: UserProfile }
  | { type: 'ERROR'; error: string };

/**
 * Avatar effects for canvas rendering
 */
export interface AvatarEffects {
  borderColor?: string;
  borderWidth?: number;
  shadow?: boolean;
  grayscale?: boolean;
  badge?: {
    text: string;
    color: string;
    position: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  };
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates username (alphanumeric, dash, underscore, 3-20 chars)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Sanitizes display name (removes excessive whitespace)
 */
export function sanitizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, 50);
}

/**
 * Validates profile data
 */
export function validateProfile(profile: Partial<UserProfile>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (profile.email && !isValidEmail(profile.email)) {
    errors.push('Invalid email format');
  }

  if (profile.username && !isValidUsername(profile.username)) {
    errors.push('Username must be 3-20 characters (alphanumeric, dash, underscore only)');
  }

  if (profile.bio && profile.bio.length > 500) {
    errors.push('Bio must be 500 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serializes profile to ArrayBuffer for efficient worker communication
 * Uses a compact binary format for fast transfer
 */
export function serializeProfile(profile: UserProfile): ArrayBuffer {
  const encoder = new TextEncoder();

  // Encode strings
  const idBytes = encoder.encode(profile.id);
  const emailBytes = encoder.encode(profile.email);
  const usernameBytes = profile.username ? encoder.encode(profile.username) : new Uint8Array(0);
  const displayNameBytes = profile.displayName ? encoder.encode(profile.displayName) : new Uint8Array(0);
  const avatarUrlBytes = profile.avatarUrl ? encoder.encode(profile.avatarUrl) : new Uint8Array(0);
  const bioBytes = profile.bio ? encoder.encode(profile.bio) : new Uint8Array(0);
  const metadataBytes = profile.metadata ? encoder.encode(JSON.stringify(profile.metadata)) : new Uint8Array(0);

  // Calculate total size
  // Header: 7 * 4 bytes (lengths) + 2 * 8 bytes (timestamps) = 44 bytes
  const headerSize = 44;
  const totalSize = headerSize +
    idBytes.length +
    emailBytes.length +
    usernameBytes.length +
    displayNameBytes.length +
    avatarUrlBytes.length +
    bioBytes.length +
    metadataBytes.length;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  let offset = 0;

  // Write lengths
  view.setUint32(offset, idBytes.length, true); offset += 4;
  view.setUint32(offset, emailBytes.length, true); offset += 4;
  view.setUint32(offset, usernameBytes.length, true); offset += 4;
  view.setUint32(offset, displayNameBytes.length, true); offset += 4;
  view.setUint32(offset, avatarUrlBytes.length, true); offset += 4;
  view.setUint32(offset, bioBytes.length, true); offset += 4;
  view.setUint32(offset, metadataBytes.length, true); offset += 4;

  // Write timestamps (as milliseconds since epoch)
  view.setBigUint64(offset, BigInt(profile.createdAt), true); offset += 8;
  view.setBigUint64(offset, BigInt(profile.updatedAt), true); offset += 8;

  // Write string data
  uint8View.set(idBytes, offset); offset += idBytes.length;
  uint8View.set(emailBytes, offset); offset += emailBytes.length;
  uint8View.set(usernameBytes, offset); offset += usernameBytes.length;
  uint8View.set(displayNameBytes, offset); offset += displayNameBytes.length;
  uint8View.set(avatarUrlBytes, offset); offset += avatarUrlBytes.length;
  uint8View.set(bioBytes, offset); offset += bioBytes.length;
  uint8View.set(metadataBytes, offset);

  return buffer;
}

/**
 * Deserializes profile from ArrayBuffer
 */
export function deserializeProfile(buffer: ArrayBuffer): UserProfile {
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);
  const decoder = new TextDecoder();

  let offset = 0;

  // Read lengths
  const idLength = view.getUint32(offset, true); offset += 4;
  const emailLength = view.getUint32(offset, true); offset += 4;
  const usernameLength = view.getUint32(offset, true); offset += 4;
  const displayNameLength = view.getUint32(offset, true); offset += 4;
  const avatarUrlLength = view.getUint32(offset, true); offset += 4;
  const bioLength = view.getUint32(offset, true); offset += 4;
  const metadataLength = view.getUint32(offset, true); offset += 4;

  // Read timestamps
  const createdAt = Number(view.getBigUint64(offset, true)); offset += 8;
  const updatedAt = Number(view.getBigUint64(offset, true)); offset += 8;

  // Read strings
  const id = decoder.decode(uint8View.subarray(offset, offset + idLength)); offset += idLength;
  const email = decoder.decode(uint8View.subarray(offset, offset + emailLength)); offset += emailLength;
  const username = usernameLength > 0 ? decoder.decode(uint8View.subarray(offset, offset + usernameLength)) : undefined; offset += usernameLength;
  const displayName = displayNameLength > 0 ? decoder.decode(uint8View.subarray(offset, offset + displayNameLength)) : undefined; offset += displayNameLength;
  const avatarUrl = avatarUrlLength > 0 ? decoder.decode(uint8View.subarray(offset, offset + avatarUrlLength)) : undefined; offset += avatarUrlLength;
  const bio = bioLength > 0 ? decoder.decode(uint8View.subarray(offset, offset + bioLength)) : undefined; offset += bioLength;
  const metadata = metadataLength > 0 ? JSON.parse(decoder.decode(uint8View.subarray(offset, offset + metadataLength))) : undefined;

  return {
    id,
    email,
    username,
    displayName,
    avatarUrl,
    bio,
    createdAt,
    updatedAt,
    metadata,
  };
}

/**
 * Creates a default profile from session data
 */
export function createProfileFromSession(session: any): UserProfile {
  const now = Date.now();
  return {
    id: session.user?.id || '',
    email: session.user?.email || '',
    username: session.user?.user_metadata?.username,
    displayName: session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0],
    avatarUrl: session.user?.user_metadata?.avatar_url,
    bio: session.user?.user_metadata?.bio,
    createdAt: session.user?.created_at ? new Date(session.user.created_at).getTime() : now,
    updatedAt: now,
    metadata: session.user?.user_metadata,
  };
}

/**
 * Generates a placeholder avatar URL based on user's name
 */
export function generatePlaceholderAvatar(displayName: string): string {
  const initial = displayName.charAt(0).toUpperCase();
  const colors = [
    '6366f1', '8b5cf6', 'ec4899', 'f43f5e', 'f59e0b',
    '10b981', '06b6d4', '3b82f6', '6366f1', '8b5cf6'
  ];
  const colorIndex = displayName.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  // Using a placeholder service (or you can use data URI with canvas)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${bgColor}&color=fff&size=128&bold=true`;
}

/**
 * Formats relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}
