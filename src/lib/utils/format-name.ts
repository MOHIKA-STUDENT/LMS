export function formatStudentDisplayName(fullName?: string | null, email?: string | null): string {
  if (fullName && !fullName.includes('@')) {
    return fullName;
  }
  const source = (fullName && fullName.includes('@')) ? fullName : (email || '');
  if (source.includes('@')) {
    const prefix = source.split('@')[0];
    const cleanWords = prefix.split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return cleanWords.join(' ');
  }
  return fullName || 'Academy Student';
}
