import { defineCollection, z } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	i18n: defineCollection({
		loader: i18nLoader(),
		schema: i18nSchema({
			extend: z.object({
				// Authentication keys
				'auth.signIn': z.string().optional(),
				'auth.signInWith': z.string().optional(),
				'auth.signInWithGitHub': z.string().optional(),
				'auth.signInWithTwitch': z.string().optional(),
				'auth.signInWithDiscord': z.string().optional(),
				'auth.signOut': z.string().optional(),
				'auth.signingOut': z.string().optional(),
				'auth.signedOut': z.string().optional(),
				'auth.signOutError': z.string().optional(),
				'auth.authenticating': z.string().optional(),
				'auth.completingSignIn': z.string().optional(),
				'auth.authFailed': z.string().optional(),
				'auth.signInFailed': z.string().optional(),
				'auth.oauthSignInFailed': z.string().optional(),
				'auth.signOutFailed': z.string().optional(),
				'auth.loggedInAs': z.string().optional(),
				'auth.anonymousUser': z.string().optional(),
				'auth.guestUser': z.string().optional(),
				// User keys
				'user.loading': z.string().optional(),
				'user.error': z.string().optional(),
				// Session keys
				'session.sharedWorkerInfo': z.string().optional(),
				'session.supabaseInitFailed': z.string().optional(),
				// Common UI keys
				'common.close': z.string().optional(),
				'common.pleaseWait': z.string().optional(),
				'common.redirecting': z.string().optional(),
				// Site keys
				'site.logoAlt': z.string().optional(),
			}),
		}),
	}),
};
