"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Info,
} from "lucide-react";
import {
  getGroup,
  getMembers,
  getExpenses,
  getBalances,
  deleteExpense,
  removeMember,
} from "@/lib/database";
import type { Group, Member, Expense, Balance } from "@/lib/supabase";
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
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSimplify, setShowSimplify] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupData, membersData, expensesData, balancesData] =
        await Promise.all([
          getGroup(groupId),
          getMembers(groupId),
          getExpenses(groupId),
          getBalances(groupId),
        ]);

      setGroup(groupData);
      setMembers(membersData);
      setExpenses(expensesData);
      setBalances(balancesData);

      // Calculate total expenses
      const total = expensesData.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  <strong>Tip:</strong> Save this code! You'll need it to
                  invite others or rejoin this group later.
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Balances</CardTitle>
                </div>
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
                    <p className="text-gray-500 text-center py-4">
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
                  <div className="text-2xl font-bold text-blue-600">
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Receipt className="h-5 w-5 text-green-800" />
                  <span>Items ({expenses.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {expense.description}
                            </h3>
                            <Badge
                              variant="outline"
                              className="self-start text-xs"
                            >
                              {expense.category}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            Paid by {expense.paid_by_member?.name} •{" "}
                            {formatCurrency(expense.amount)}
                          </p>
                          {/* <p className="text-xs text-gray-500">
                            {new Date(expense.created_at).toLocaleDateString()} at{" "}
                            {new Date(expense.created_at).toLocaleTimeString()}
                          </p> */}
                          <ExpenseSplitInfo
                            expense={expense}
                            members={members}
                          />
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
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
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
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
        balances={balances}
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
