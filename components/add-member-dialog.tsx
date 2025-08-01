"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addMember } from "@/lib/database"
import { toast } from "@/hooks/use-toast"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  onSuccess: () => void
}

export function AddMemberDialog({ open, onOpenChange, groupId, onSuccess }: AddMemberDialogProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const member = await addMember(groupId, name.trim())
      if (member) {
        toast({
          title: "Success",
          description: `${member.name} added to the group`,
        })
        setName("")
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: "Failed to add member. Name might already exist.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberName">Name</Label>
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
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
