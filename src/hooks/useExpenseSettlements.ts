
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUserDisplayName, getEffectiveSharers } from "@/utils/userDisplay";

interface CreateSettlementsParams {
  expense: any;
  user: any;
  profile: any;
  roommates: any[];
  addSettlementPair: any;
}

export function useExpenseSettlements() {
  const { toast } = useToast();

  const createSettlementsForExpense = async ({
    expense,
    user,
    profile,
    roommates,
    addSettlementPair,
  }: CreateSettlementsParams) => {
    const currentUserDisplayName = getCurrentUserDisplayName(profile, user);
    const allUserNames = [profile?.name, user?.email?.split('@')[0]].filter(Boolean);
    const payerName = allUserNames.includes(expense.paidBy) ? currentUserDisplayName : expense.paidBy;

    const effectiveSharers = getEffectiveSharers(expense, currentUserDisplayName, roommates);
    const amountPerSharer = expense.amount / effectiveSharers.length;

    for (const sharerName of effectiveSharers) {
      if (sharerName === payerName) continue;

      let debtor = null;
      let creditor = null;

      if ([currentUserDisplayName, user?.email, profile?.name].includes(sharerName)) {
        debtor = { name: currentUserDisplayName, email: user?.email || '', upi_id: profile?.upi_id || '' };
      } else {
        debtor = roommates.find((r: any) => r.name === sharerName);
      }

      if ([currentUserDisplayName, user?.email, profile?.name].includes(payerName)) {
        creditor = { name: currentUserDisplayName, email: user?.email || '', upi_id: profile?.upi_id || '' };
      } else {
        creditor = roommates.find((r: any) => r.name === payerName);
      }
      if (!debtor || !creditor) {
        continue;
      }

      if (debtor.email === user?.email) {
        await addSettlementPair(
          { ...debtor, type: 'owes' as const },
          { ...creditor, type: 'owed' as const },
          amountPerSharer
        );
      } else if (creditor.email === user?.email) {
        await addSettlementPair(
          { ...creditor, type: 'owed' as const },
          { ...debtor, type: 'owes' as const },
          amountPerSharer
        );
      }
    }
  };

  return { createSettlementsForExpense };
}
