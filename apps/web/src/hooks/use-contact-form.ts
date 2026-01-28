import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TContactForm } from '~/schemas/contact-form'

interface UseContactFormReturn {
  submitContactForm: (data: TContactForm) => Promise<void>
  isLoading: boolean
  error: string | null
}

const postContactForm = async (data: TContactForm) => {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Erreur lors de l'envoi du message")
  }

  return response.json()
}

export const useContactForm = (): UseContactFormReturn => {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: postContactForm,
    onSuccess: () => {
      toast.success('Message envoyé avec succès', {
        description: 'Nous vous répondrons dans les plus brefs délais.',
      })
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du message")
    },
  })

  return {
    submitContactForm: mutateAsync,
    isLoading: isPending,
    error: error?.message || null,
  }
}
