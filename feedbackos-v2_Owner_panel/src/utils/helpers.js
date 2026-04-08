// Format timestamp to IST (Indian Standard Time)
export function formatIST(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' IST';
  } catch {
    return dateString;
  }
}

// Format date only
export function formatDateIST(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Get initials from name
export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Validate password strength
export function validatePassword(pwd) {
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    digit: /\d/.test(pwd),
    special: /[!@#$%^&*]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score, strong: score >= 4 };
}

// Construct admin panel URL from hospital ID
export function getAdminPanelUrl(hospitalId, baseUrl = '') {
  const base = baseUrl || window.location.origin;
  return `${base}/admin/${hospitalId}`;
}

// Format large numbers
export function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// Generate color from string (for hospital avatar fallback)
export function stringToColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
  return colors[Math.abs(hash) % colors.length];
}

// Download blob as file
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
