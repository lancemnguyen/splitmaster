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
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">WeSplit</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Split expenses with friends, simplified</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Create New Group
              </CardTitle>
              <CardDescription className="text-sm">Start a new expense group and invite friends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-sm">
                  Group Name
                </Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Weekend Trip, Roommates"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                  className="text-sm sm:text-base"
                />
              </div>
              <Button onClick={handleCreateGroup} disabled={isCreating} className="w-full text-sm sm:text-base">
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
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Join Existing Group
              </CardTitle>
              <CardDescription className="text-sm">Enter the group code to join an existing group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupCode" className="text-sm">
                  Group Code
                </Label>
                <Input
                  id="groupCode"
                  placeholder="e.g., ABC123"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
                  className="uppercase text-sm sm:text-base"
                />
              </div>
              <Button
                onClick={handleJoinGroup}
                disabled={isJoining}
                variant="outline"
                className="w-full bg-transparent text-sm sm:text-base"
              >
                {isJoining ? "Joining..." : "Join Group"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs sm:text-sm text-gray-500">
          <p>No sign-up required • Free to use • Share expenses easily</p>
        </div>
      </div>
    </div>
  )
}
