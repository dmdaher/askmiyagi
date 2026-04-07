/** Hosted mode: editor runs on Vercel with Blob storage instead of local filesystem */
export const isHosted = process.env.NEXT_PUBLIC_EDITOR_MODE === 'hosted';
