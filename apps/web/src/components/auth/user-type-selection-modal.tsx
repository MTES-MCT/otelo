'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useUpdateUserType } from '~/hooks/use-update-user-type'
import { TUpdateUserType, UserType, ZUpdateUserType } from '~/schemas/user'
import { TSession } from '~/types/next-auth'

const USER_TYPE_OPTIONS = [
  { label: 'DDT', value: UserType.DDT },
  { label: "Agence d'urbanisme", value: UserType.AgenceUrbanisme },
  { label: 'Collectivité', value: UserType.Collectivite },
  { label: 'DREAL', value: UserType.DREAL },
  { label: "Bureau d'études", value: UserType.BureauEtudes },
  { label: 'Autre', value: UserType.Autre },
] as const

const UserTypeModal = createModal({
  id: 'user-type-selection-modal',
  isOpenedByDefault: true,
})

export function UserTypeSelectionModal() {
  const { data: session, update } = useSession() as unknown as { data: TSession; update: () => Promise<unknown> }
  const { mutateAsync, isPending } = useUpdateUserType()
  const pathname = usePathname()

  const form = useForm<TUpdateUserType>({
    resolver: zodResolver(ZUpdateUserType),
    defaultValues: {
      type: undefined,
      userId: session?.user?.id,
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await mutateAsync(data)
      await update()
      UserTypeModal.close()
    } catch {
      toast.error("Erreur lors de la mise à jour du type d'organisation de l'utilisateur")
    }
  })

  useEffect(() => {
    // trick to wait for the modal to be bound and mounted
    const timer = setTimeout(() => {
      if (session.user && !session.user.type) {
        UserTypeModal.open()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [session, pathname])

  if (session.user?.type) {
    return null
  }

  return (
    <UserTypeModal.Component title="Sélectionnez votre type d'organisation" concealingBackdrop={false} size="medium">
      <form onSubmit={handleSubmit}>
        <p>
          Bonjour&nbsp;
          <strong>
            {session?.user?.firstname} {session?.user?.lastname}
          </strong>
          ,
        </p>
        <p>Pour personnaliser votre expérience, veuillez sélectionner le type d'organisation auquel vous appartenez :</p>

        <Select
          label="Type d'organisation"
          state={form.formState.errors.type ? 'error' : 'default'}
          stateRelatedMessage={form.formState.errors.type?.message}
          nativeSelectProps={{
            ...form.register('type'),
            value: form.watch('type') ?? '',
          }}
        >
          <option value="" disabled>
            Choisissez votre type d'organisation
          </option>
          {USER_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div className="fr-flex fr-flex-gap-2v fr-justify-content-end fr-mt-4w">
          <Button priority="primary" type="submit" disabled={!form.formState.isValid || isPending}>
            {isPending ? 'Enregistrement...' : 'Confirmer'}
          </Button>
        </div>
      </form>
    </UserTypeModal.Component>
  )
}
