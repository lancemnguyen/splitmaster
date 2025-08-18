"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Member, Expense, ExpenseSplit } from "@/lib/supabase"

interface ExpenseFormProps {
  expense?: Expense | null
  expenseSplits?: ExpenseSplit[]
  members: Member[]
  onSubmit: (data: any) => Promise<void>
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseForm({
  expense,
  expenseSplits,
  members,
  onSubmit,
  isSubmitting,
  onOpenChange,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [category, setCategory] = useState("General")
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "amount">("equal")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({})

  useEffect(() => {
    if (expense) {
      setDescription(expense.description)
      setAmount(expense.amount.toString())
      setPaidBy(expense.paid_by)
      setCategory(expense.category)

      if (expense.split_method) {
        setSplitType(expense.split_method as "equal" | "percentage" | "amount")
      }

      // Load existing splits data
      if (expenseSplits && expenseSplits.length > 0) {
        const memberIds = expenseSplits.map((split) => split.member_id)
        setSelectedMembers(memberIds)

        // If not equal split, load the custom split values
        if (expense.split_method !== "equal" && expense.split_config) {
          setCustomSplits(expense.split_config as { [memberId: string]: string })
        }
      }
    } else {
      // Default for new expense
      setSelectedMembers(members.map((member) => member.id))
    }
  }, [expense, expenseSplits, members])

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

  const handleSubmit = () => {
    if (!description.trim() || !amount || !paidBy || selectedMembers.length === 0) {
      // Parent component will show toast
      return
    }

    if (!validateSplits()) {
      // Parent component will show toast
      return
    }

    const splits = calculateSplits()

    onSubmit({
      description: description.trim(),
      amount: Number.parseFloat(amount),
      paidBy,
      splits,
      category,
      splitMethod: splitType,
      splitConfig: splitType !== "equal" ? customSplits : {},
    })
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

  const handleSelectAll = () => {
    setSelectedMembers(members.map((member) => member.id))
    setCustomSplits({})
  }

  const handleDeselectAll = () => {
    setSelectedMembers([])
    setCustomSplits({})
  }

  const currentSplits = calculateSplits()
  const currentTotal = currentSplits.reduce((sum, split) => sum + split.amount, 0)

  return (
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
            type="text"
            inputMode="decimal"
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
                    type="text"
                    inputMode="decimal"
                    placeholder={splitType === "percentage" ? "0" : "0.00"}
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
            {currentSplits.map((split) => {
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
                <span>${currentTotal.toFixed(2)}</span>
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
          {isSubmitting ? (expense ? "Updating..." : "Adding...") : expense ? "Update Expense" : "Add Expense"}
        </Button>
      </div>
    </div>
  )
}
