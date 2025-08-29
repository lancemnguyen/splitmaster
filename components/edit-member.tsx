"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateMemberName } from "@/lib/database";
import type { Member } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { MemberForm } from "./member-form";
import { useFormSubmission } from "@/hooks/use-form-submission";

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSuccess: () => void;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: EditMemberDialogProps) {
  const { handleSubmit, isSubmitting } = useFormSubmission(
    async (name: string) => {
      if (!member) return null;

      if (!name.trim()) {
        toast({
          title: "Error",
          description: "Please enter a member name",
          variant: "destructive",
        });
        return null; // Indicate failure to the hook
      }

      if (name.trim() === member.name) {
        onOpenChange(false);
        return true; // Treat as success if no change needed
      }

      return await updateMemberName(member.id, name.trim());
    },
    {
      successMessage: "Member name updated successfully",
      failureMessage: "Failed to update member name. Name might already exist.",
      onSuccess: () => {
        onOpenChange(false);
        onSuccess();
      },
    }
  );

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member Name</DialogTitle>
        </DialogHeader>
        <MemberForm
          initialName={member.name}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          isEdit={true}
        />
      </DialogContent>
    </Dialog>
  );
}
