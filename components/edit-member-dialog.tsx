"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateMemberName } from "@/lib/database"
import type { Member } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface EditMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  onSuccess: () => void
}

export function EditMemberDialog({ open, onOpenChange, member, onSuccess }: EditMemberDialogProps) {
  const [name, setName] = useState(member?.name || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update name when member changes
  useState(() => {
    if (member) {
      setName(member.name)
    }
  })

  const handleSubmit = async () => {
    if (!member || !name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a member name",
        variant: "destructive",
      })
      return
    }

    if (name.trim() === member.name) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      const success = await updateMemberName(member.id, name.trim())
      if (success) {
        toast({
          title: "Success",
          description: "Member name updated successfully",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: "Failed to update member name. Name might already exist.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member Name</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberName">Member Name</Label>
            <Input
              id="memberName"
              placeholder="Enter member name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
