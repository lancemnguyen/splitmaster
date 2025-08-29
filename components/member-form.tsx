"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MemberFormProps {
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  isEdit: boolean;
}

export function MemberForm({
  initialName = "",
  onSubmit,
  isSubmitting,
  onCancel,
  isEdit,
}: MemberFormProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSubmit = () => {
    onSubmit(name);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberName">{isEdit ? "Member Name" : "Name"}</Label>
        <Input
          id="memberName"
          placeholder={isEdit ? "Edit member name" : "Enter member name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting
            ? isEdit
              ? "Updating..."
              : "Adding..."
            : isEdit
            ? "Update"
            : "Add Member"}
        </Button>
      </div>
    </div>
  );
}
