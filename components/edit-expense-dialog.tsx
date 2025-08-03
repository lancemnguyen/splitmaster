"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { updateExpense, getExpenseSplits } from "@/lib/database"
import type { Member, Expense } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface EditExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  members: Member[]
  onSuccess: () => void
}

export function EditExpenseDialog({ open, onOpenChange, expense, members, onSuccess }: EditExpenseDialogProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [category, setCategory] = useState("General")
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "amount">("equal")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectAll = () => {
    setSelectedMembers(members.map((member) => member.id))
    setCustomSplits({})
  }

  const handleDeselectAll = () => {
    setSelectedMembers([])
    setCustomSplits({})
  }

  const categories = [
    "General",
    "Food",
    "Transportation",
    "Entertainment",
    "Accommodation",
    "Shopping",
    "Utilities",
    "Other",
  ]

  useEffect(() => {
    if (expense && open) {
      loadExpenseData()
    }
  }, [expense, open])

  const loadExpenseData = async () => {
    if (!expense) return

    setDescription(expense.description)
    setAmount(expense.amount.toString())
    setPaidBy(expense.paid_by)
    setCategory(expense.category)

    // Load splits
    const splits = await getExpenseSplits(expense.id)
    const memberIds = splits.map((split) => split.member_id)
    setSelectedMembers(memberIds)

    // Determine split type and custom splits
    const totalAmount = expense.amount
    const equalSplit = totalAmount / splits.length
    const isEqual = splits.every((split) => Math.abs(split.amount - equalSplit) < 0.01)

    if (isEqual) {
      setSplitType("equal")
      setCustomSplits({})
    } else {
      // Check if it's percentage-based (all splits add up to 100% of total)
      const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0)
      if (Math.abs(totalSplitAmount - totalAmount) < 0.01) {
        setSplitType("amount")
        const customSplitData: { [memberId: string]: string } = {}
        splits.forEach((split) => {
          customSplitData[split.member_id] = split.amount.toString()
        })
        setCustomSplits(customSplitData)
      }
    }
  }

  const calculateSplits = () => {
    const totalAmount = Number.parseFloat(amount)
    if (!totalAmount || selectedMembers.length === 0) return []

    const splits: { memberId: string; amount: number }[] = []

    if (splitType === "equal") {
      const splitAmount = totalAmount / selectedMembers.length
      selectedMembers.forEach((memberId) => {
        splits.push({ memberId, amount: splitAmount })
      })
    } else if (splitType === "percentage") {
      selectedMembers.forEach((memberId) => {
        const percentage = Number.parseFloat(customSplits[memberId] || "0")
        const splitAmount = (totalAmount * percentage) / 100
        splits.push({ memberId, amount: splitAmount })
      })
    } else if (splitType === "amount") {
      selectedMembers.forEach((memberId) => {
        const splitAmount = Number.parseFloat(customSplits[memberId] || "0")
        splits.push({ memberId, amount: splitAmount })
      })
    }

    return splits
  }

  const validateSplits = () => {
    const totalAmount = Number.parseFloat(amount)
    const splits = calculateSplits()
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0)

    if (splitType === "percentage") {
      const totalPercentage = selectedMembers.reduce((sum, memberId) => {
        return sum + Number.parseFloat(customSplits[memberId] || "0")
      }, 0)
      return Math.abs(totalPercentage - 100) < 0.01
    } else if (splitType === "amount") {
      return Math.abs(totalSplit - totalAmount) < 0.01
    }

    return true
  }

  const handleSubmit = async () => {
    if (!expense || !description.trim() || !amount || !paidBy || selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!validateSplits()) {
      toast({
        title: "Error",
        description: "Split amounts don't add up correctly",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const splits = calculateSplits()
      const success = await updateExpense(
        expense.id,
        description.trim(),
        Number.parseFloat(amount),
        paidBy,
        splits,
        category,
      )

      if (success) {
        toast({
          title: "Success",
          description: "Expense updated successfully",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: "Failed to update expense",
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

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId])
    } else {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
      const newCustomSplits = { ...customSplits }
      delete newCustomSplits[memberId]
      setCustomSplits(newCustomSplits)
    }
  }

  if (!expense) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="e.g., Dinner at restaurant"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid by *</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Split Configuration */}
          <div className="space-y-4">
            <Label>How to split?</Label>
            <RadioGroup value={splitType} onValueChange={(value: any) => setSplitType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equal" id="equal" />
                <Label htmlFor="equal">Split equally</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Split by percentage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amount" id="amount" />
                <Label htmlFor="amount">Split by exact amounts</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Member Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Who's involved? *</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => handleMemberToggle(member.id, !!checked)}
                    />
                    <span>{member.name}</span>
                  </div>

                  {selectedMembers.includes(member.id) && splitType !== "equal" && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={splitType === "percentage" ? "0%" : "0.00"}
                        value={customSplits[member.id] || ""}
                        onChange={(e) =>
                          setCustomSplits({
                            ...customSplits,
                            [member.id]: e.target.value,
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">{splitType === "percentage" ? "%" : "$"}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Split Preview */}
          {selectedMembers.length > 0 && amount && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium">Split Preview:</Label>
              <div className="mt-2 space-y-1">
                {calculateSplits().map((split) => {
                  const member = members.find((m) => m.id === split.memberId)
                  return (
                    <div key={split.memberId} className="flex justify-between text-sm">
                      <span>{member?.name}</span>
                      <span>${split.amount.toFixed(2)}</span>
                    </div>
                  )
                })}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>${Number.parseFloat(amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Expense"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
