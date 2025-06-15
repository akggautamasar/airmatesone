
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUserDisplayName, getEffectiveSharers } from "@/utils/userDisplay";

interface CreateSettlementsParams {
  expense: any;
  user: any;
  profile: any;
  roommates: any[];
  addSettlementPair: (
    debtor: { name: string; email: string },
    creditor: { name: string; email: string; upi_id: string },
    amount: number
  ) => Promise<void>;
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

    // Build a complete list of all potential participants with their details
    const allParticipants = [
      { name: currentUserDisplayName, email: user?.email || '', upi_id: profile?.upi_id || '' },
      ...roommates.map((r: any) => ({ name: r.name, email: r.email, upi_id: r.upi_id || '' }))
    ];
    const uniqueParticipants = Array.from(new Map(allParticipants.map(p => [p.name, p])).values());

    const payerName = expense.paidBy;
    const creditor = uniqueParticipants.find(p => p.name === payerName);

    if (!creditor || !creditor.email) {
      toast({ title: "Error", description: `Could not find payment details for payer: ${payerName}.`, variant: "destructive" });
      console.error("Could not find creditor details for payer:", payerName);
      return;
    }

    const effectiveSharers = getEffectiveSharers(expense, currentUserDisplayName, roommates);
    if (effectiveSharers.length === 0) {
        toast({ title: "Error", description: "Cannot create settlements for an expense with no one to share it.", variant: "destructive" });
        return;
    }
    const amountPerSharer = expense.amount / effectiveSharers.length;

    for (const sharerName of effectiveSharers) {
      if (sharerName === payerName) continue;

      const debtor = uniqueParticipants.find(p => p.name === sharerName);

      if (!debtor || !debtor.email) {
        console.error("Could not find debtor details for sharer:", sharerName);
        toast({ title: "Warning", description: `Could not create settlement for ${sharerName} as their details are not found.` });
        continue;
      }

      await addSettlementPair(
        debtor,
        creditor,
        amountPerSharer
      );
    }
  };

  return { createSettlementsForExpense };
}
