
/**
 * Utility: Functions for formatting user display names.
 */

export function getCurrentUserDisplayName(profile: any, user: any) {
  return profile?.name || user?.email?.split('@')[0] || 'You';
}

export function getEffectiveSharers(expense: any, currentUserDisplayName: string, roommates: any[]) {
  if (expense.sharers && expense.sharers.length > 0) {
    return expense.sharers.map((s: string) =>
      [currentUserDisplayName, ...roommates.map((r: any) => r.name)].includes(s)
        ? currentUserDisplayName
        : s
    );
  }
  return [currentUserDisplayName, ...roommates.map((r: any) => r.name)];
}
