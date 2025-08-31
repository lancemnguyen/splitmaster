"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, ArrowRight } from "lucide-react";
import { createGroup, getGroupByCode } from "@/lib/database";
import { toast } from "@/hooks/use-toast";

export default function HomePage() {
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const group = await createGroup(groupName.trim());
      if (group) {
        toast({
          title: "Success",
          description: `Group created! Code: ${group.code}`,
        });
        router.push(`/group/${group.id}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const group = await getGroupByCode(groupCode.trim());
      if (group) {
        router.push(`/group/${group.id}`);
      } else {
        toast({
          title: "Error",
          description: "Group not found. Please check the code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Image
              src="/me-first-dollar.png"
              alt="WeSplit Logo"
              width={128}
              height={128}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800">
            Splitmaster
          </h1>
          <p className="text-gray-600 mt-2 text-xs sm:text-sm">
            Split expenses easily
            <span className="font-bold text-green-800"> • </span>
            No sign-up required
            <span className="font-bold text-green-800"> • </span>
            Free to use
          </p>
        </div>

        <div className="space-y-4 sm:space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Start a new group & invite others
              </CardTitle>
              {/* <CardDescription className="text-sm">
                Start a new group and invite others
              </CardDescription> */}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-sm">
                  Group name:
                </Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Weekend Trip"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={handleCreateGroup}
                  disabled={isCreating}
                  className="w-48 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                >
                  {isCreating ? "Creating..." : "Create Group"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-br from-blue-50 to-indigo-100 px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Join existing group
              </CardTitle>
              {/* <CardDescription className="text-sm">
                Enter the group code to join an existing group
              </CardDescription> */}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupCode" className="text-sm">
                  Enter group code:
                </Label>
                <Input
                  id="groupCode"
                  placeholder="ABC123"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
                  className="uppercase text-sm sm:text-base"
                />
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                  variant="outline"
                  className="w-48 bg-transparent text-sm sm:text-base"
                >
                  {isJoining ? "Joining..." : "Join Group"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs sm:text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Lance Nguyen</p>
        </div>
      </div>
    </div>
  );
}
