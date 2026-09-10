export function formatStudentDisplayName(
  fullName?: string | null,
  email?: string | null,
  fallbackUsername?: string | null
): string {
  // If fallbackUsername is provided (e.g. 'msond2004'), use it if clean
  if (fallbackUsername && !fallbackUsername.includes('@') && fallbackUsername.trim()) {
    return fallbackUsername.trim();
  }

  // If fullName is valid and doesn't contain '@', use it directly
  if (fullName && !fullName.includes('@') && fullName.trim()) {
    return fullName.trim();
  }

  // Extract clean username/name from email prefix
  const source = (fullName && fullName.includes('@')) ? fullName : (email || '');
  if (source.includes('@')) {
    const prefix = source.split('@')[0];
    // E.g. 'msond2004' -> return 'msond2004'
    if (/[0-9]/.test(prefix)) {
      return prefix;
    }
    const cleanWords = prefix.split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return cleanWords.join(' ');
  }

  return fullName || fallbackUsername || 'Academy User';
}
