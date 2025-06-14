
/**
 * Utility: Functions for formatting user display names.
 */

export function getCurrentUserDisplayName(profile: any, user: any) {
  return profile?.name || user?.email?.split('@')[0] || 'You';
}

export function getEffectiveSharers(expense: any, currentUserDisplayName: string, roommates: any[]) {
  // If sharers are explicitly provided by the expense form, use them directly.
  // The form already provides the correct display names.
  if (expense.sharers && expense.sharers.length > 0) {
    return expense.sharers;
  }
  
  // If no sharers are specified, default to splitting among everyone.
  // Using Set to ensure the list of participants is unique.
  return Array.from(new Set([currentUserDisplayName, ...roommates.map((r: any) => r.name)]));
}
