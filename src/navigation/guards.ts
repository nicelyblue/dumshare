export function shouldRedirectHome(hasLedger: boolean): 'welcome' | null {
  return hasLedger ? null : 'welcome';
}

export function shouldRedirectAddExpense(input: { hasLedger: boolean; participantCount: number }): 'welcome' | 'addParticipants' | null {
  if (!input.hasLedger) {
    return 'welcome';
  }

  if (input.participantCount === 0) {
    return 'addParticipants';
  }

  return null;
}
