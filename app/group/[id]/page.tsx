"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Receipt,
  Edit,
  Trash2,
  Copy,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Info,
  Handshake,
} from "lucide-react";
import {
  getGroup,
  getMembers,
  getExpenses,
  getSettlements,
  getBalances,
  deleteExpense,
  removeMember,
} from "@/lib/database";
import type { Group, Member, Expense, Balance, Settlement } from "@/lib/supabase";
import { AddExpenseDialog } from "@/components/add-expense";
import { AddMemberDialog } from "@/components/add-member";
import { EditExpenseDialog } from "@/components/edit-expense";
import { SimplifyDialog } from "@/components/simplify";
import { toast } from "@/hooks/use-toast";
import { EditGroupDialog } from "@/components/edit-group";
import { EditMemberDialog } from "@/components/edit-member";
import { ExpenseSplitInfo } from "@/components/expense-split-info";

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSimplify, setShowSimplify] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupData, membersData, expensesData, settlementsData, balancesData] =
        await Promise.all([
          getGroup(groupId),
          getMembers(groupId),
          getExpenses(groupId),
          getSettlements(groupId),
          getBalances(groupId),
        ]);

      setGroup(groupData);
      setMembers(membersData);
      setExpenses(expensesData);
      setSettlements(settlementsData);
      setBalances(balancesData);

      // Calculate total expenses
      // Settlements are now separate, so no need to filter them out
      const total = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalExpenses(total);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load group data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const success = await deleteExpense(expenseId);
      if (success) {
        toast({
          title: "Success",
          description: "Expense deleted successfully",
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete expense",
          variant: "destructive",
        });
      }
    }
  };

  const copyGroupCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      toast({
        title: "Copied!",
        description: "Group code copied to clipboard",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    // Treat very small numbers close to zero as 0 to avoid showing "-$0.00"
    const valueToFormat = Math.abs(amount) < 0.01 ? 0 : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(valueToFormat);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0.01) return "text-green-600";
    if (balance < -0.01) return "text-red-600";
    return "text-gray-600";
  };

  const getSplitMethodDisplay = (method: string) => {
    switch (method) {
      case "percentage":
        return "Split by %";
      case "amount":
        return "Split by amount";
      case "equal":
      default:
        return "Split equally";
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (
      confirm(
        `Are you sure you want to remove ${member.name} from the group? This action cannot be undone.`
      )
    ) {
      const success = await removeMember(member.id);
      if (success) {
        toast({
          title: "Success",
          description: `${member.name} removed from the group`,
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description:
            "Cannot remove member. They may have expenses or be involved in splits.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl sm:text-2xl font-bold text-gray-900">
            Group not found
          </h1>
          <p className="text-gray-600 mt-2">
            The group you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const allItems = [...expenses, ...settlements].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {group.name}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditGroup(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">Group Code:</span>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={copyGroupCode}
                >
                  {group.code}
                  <Copy className="ml-1 h-3 w-3" />
                </Badge>
              </div>
              <div className="mt-2 flex w-fit items-start gap-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700 border border-blue-200">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Tip:</strong> Save this code to invite others or rejoin later.
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => setShowAddMember(true)}
                variant="outline"
                size="sm"
                className="sm:size-default"
              >
                <Users className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Member</span>
                <span className="sm:hidden">Add Member</span>
              </Button>
              <Button
                onClick={() => setShowAddExpense(true)}
                size="sm"
                className="sm:size-default bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add Expense</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Balances */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-baseline justify-between px-6 pt-4 pb-3">
                <CardTitle>Balances</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSimplify(true)}
                  className="bg-yellow-200 hover:bg-yellow-300"
                >
                  <Minimize2 className="mr-2 h-4 w-4" />
                  Simplify
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div
                      key={balance.member_id}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium">{balance.member_name}</span>
                      <span
                        className={`font-semibold ${getBalanceColor(
                          balance.balance
                        )}`}
                      >
                        {formatCurrency(balance.balance)}
                      </span>
                    </div>
                  ))}
                  {balances.length === 0 && (
                    <p className="text-gray-500 text-center py-2 mt-2">
                      No members yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              {/* <CardHeader>
                <CardTitle>Group Total</CardTitle>
              </CardHeader> */}
              <CardContent>
                <div className="text-center mt-6">
                  <div className="text-2xl font-bold text-cyan-600">
                    {formatCurrency(totalExpenses)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Total expenses</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Members ({members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>{member.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMember(member)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-gray-500 text-center py-2">
                      No members yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-green-800" />
                  <span>Items ({allItems.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {allItems.map((item) => {
                    // Type guard to check if it's a settlement
                    if ("from_member_id" in item) {
                      const settlement = item as Settlement;
                      const fromMember = members.find(
                        (m) => m.id === settlement.from_member_id
                      );
                      const toMember = members.find(
                        (m) => m.id === settlement.to_member_id
                      );

                      return (
                        <div
                          key={settlement.id}
                          className="border rounded-lg p-3 sm:p-4 bg-slate-50 border-slate-200"
                        >
                          <div className="flex items-center justify-end gap-4">
                            <div className="flex items-center gap-3">
                              <Handshake className="h-5 w-5 text-green-600 flex-shrink-0" />
                              <p className="text-sm sm:text-base text-gray-800">
                                <span className="font-semibold">
                                  {fromMember?.name || "Person 1"}
                                </span>{" "}
                                paid{" "}
                                <span className="font-semibold">
                                  {toMember?.name || "Person 2"}
                                </span>
                              </p>
                            </div>
                            <span className="font-semibold text-green-700 text-sm sm:text-base flex-shrink-0">
                              {formatCurrency(settlement.amount)}
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      const expense = item as Expense;
                      const isExpanded = expandedExpenseIds.includes(expense.id);
                      return (
                        <div
                          key={expense.id}
                          className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50"
                        >
                          <div className="flex flex-row justify-between items-start gap-4">
                            <div className="w-full flex-1 min-w-0">
                              <div className="flex items-center">
                                <h3 className="font-semibold text-sm sm:text-base truncate pr-2 flex-grow">
                                  {expense.description}
                                </h3>
                                <span className="font-semibold text-cyan-600 text-sm sm:text-base flex-shrink-0">
                                  {formatCurrency(expense.amount)}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-2">
                                Paid by {expense.paid_by_member?.name}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingExpense(expense)}
                                  className="hover:bg-gray-100"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  setExpandedExpenseIds((prev) =>
                                    isExpanded
                                      ? prev.filter((id) => id !== expense.id)
                                      : [...prev, expense.id]
                                  )
                                }
                                className="h-auto px-0 py-1 text-xs text-muted-foreground flex items-center"
                              >
                                {isExpanded ? "Hide breakdown" : "Show breakdown"}
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </Button>
                              <ExpenseSplitInfo
                                expense={expense}
                                members={members}
                                isExpanded={isExpanded}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                  {allItems.length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                      <Receipt className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No expenses yet</p>
                      <p className="text-sm text-gray-400">
                        Add your first expense to get started
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        groupId={groupId}
        members={members}
        onSuccess={loadData}
      />

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        groupId={groupId}
        onSuccess={loadData}
      />

      <EditExpenseDialog
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        expense={editingExpense}
        members={members}
        onSuccess={loadData}
      />

      <SimplifyDialog
        open={showSimplify}
        onOpenChange={setShowSimplify}
        groupId={groupId}
        balances={balances}
        onSuccess={loadData}
      />

      <EditGroupDialog
        open={showEditGroup}
        onOpenChange={setShowEditGroup}
        group={group}
        onSuccess={loadData}
      />

      <EditMemberDialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
        member={editingMember}
        onSuccess={loadData}
      />
    </div>
  );
}
