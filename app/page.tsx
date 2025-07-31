"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Users, Plus, ArrowRight } from "lucide-react"
import { createGroup, getGroupByCode } from "@/lib/database"
import { toast } from "@/hooks/use-toast"

export default function HomePage() {
  const [groupName, setGroupName] = useState("")
  const [groupCode, setGroupCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const group = await createGroup(groupName.trim())
      if (group) {
        toast({
          title: "Success",
          description: `Group created! Code: ${group.code}`,
        })
        router.push(`/group/${group.id}`)
      } else {
        toast({
          title: "Error",
          description: "Failed to create group",
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
      setIsCreating(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group code",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    try {
      const group = await getGroupByCode(groupCode.trim())
      if (group) {
        router.push(`/group/${group.id}`)
      } else {
        toast({
          title: "Error",
          description: "Group not found. Please check the code.",
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
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">WiseSplit</h1>
          <p className="text-gray-600 mt-2">Split expenses with friends, simplified</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Group
              </CardTitle>
              <CardDescription>Start a new expense group and invite friends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Weekend Trip, Roommates"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                />
              </div>
              <Button onClick={handleCreateGroup} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Group"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-br from-blue-50 to-indigo-100 px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join Existing Group
              </CardTitle>
              <CardDescription>Enter the group code to join an existing group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupCode">Group Code</Label>
                <Input
                  id="groupCode"
                  placeholder="e.g., ABC123"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
                  className="uppercase"
                />
              </div>
              <Button
                onClick={handleJoinGroup}
                disabled={isJoining}
                variant="outline"
                className="w-full bg-transparent"
              >
                {isJoining ? "Joining..." : "Join Group"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>No sign-up required • Free to use • Share expenses easily</p>
        </div>
      </div>
    </div>
  )
}
