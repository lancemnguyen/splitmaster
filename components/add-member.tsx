"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addMember } from "@/lib/database";
import { toast } from "@/hooks/use-toast";
import { MemberForm } from "./member-form";
import { useFormSubmission } from "@/hooks/use-form-submission";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onSuccess: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: AddMemberDialogProps) {
  const { handleSubmit, isSubmitting } = useFormSubmission(
    async (name: string) => {
      if (!name.trim()) {
        toast({
          title: "Error",
          description: "Please enter a name",
          variant: "destructive",
        });
        return null; // Indicate failure to the hook
      }
      return await addMember(groupId, name.trim());
    },
    {
      successMessage: "Member added to the group",
      failureMessage: "Failed to add member. Name might already exist.",
      onSuccess: () => {
        onOpenChange(false);
        onSuccess();
      },
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        <MemberForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          isEdit={false}
        />
      </DialogContent>
    </Dialog>
  );
}
