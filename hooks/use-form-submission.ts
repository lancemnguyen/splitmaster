import { useState } from "react"
import { toast } from "@/hooks/use-toast"

interface UseFormSubmissionOptions {
  successMessage: string
  failureMessage: string
  genericErrorMessage?: string
  onSuccess?: () => void
  onFailure?: () => void
}

export function useFormSubmission<TArgs extends any[], TResult>(
  submitFunction: (...args: TArgs) => Promise<TResult | null>,
  options: UseFormSubmissionOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (...args: TArgs) => {
    setIsSubmitting(true)
    try {
      const result = await submitFunction(...args)
      if (result) {
        toast({
          title: "Success",
          description: options.successMessage,
        })
        options.onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: options.failureMessage,
          variant: "destructive",
        })
        options.onFailure?.()
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Error",
        description: options.genericErrorMessage || "Something went wrong",
        variant: "destructive",
      })
      options.onFailure?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleSubmit, isSubmitting }
}
