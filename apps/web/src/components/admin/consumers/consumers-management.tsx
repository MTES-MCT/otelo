'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { FC, useState } from 'react'
import { type ApiConsumer, useConsumers } from '~/hooks/use-consumers'
import { useCreateConsumer } from '~/hooks/use-create-consumer'
import { useUpdateConsumer } from '~/hooks/use-update-consumer'
import { ConsumersTable } from './consumers-table'

const createConsumerModal = createModal({
  id: 'create-consumer-modal',
  isOpenedByDefault: false,
})

const editConsumerModal = createModal({
  id: 'edit-consumer-modal',
  isOpenedByDefault: false,
})

export const ConsumersManagement: FC = () => {
  const { data: consumers, isLoading } = useConsumers()
  const { mutateAsync: createConsumer, isPending: isCreating } = useCreateConsumer()
  const { mutateAsync: updateConsumer, isPending: isUpdating } = useUpdateConsumer()

  // Create form state
  const [createName, setCreateName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Edit form state
  const [editingConsumer, setEditingConsumer] = useState<ApiConsumer | null>(null)
  const [editName, setEditName] = useState('')
  const [editActive, setEditActive] = useState(true)

  const handleOpenCreate = () => {
    setCreateName('')
    setCreatedKey(null)
    setCopied(false)
    createConsumerModal.open()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return
    const result = await createConsumer({ name: createName.trim() })
    setCreatedKey(result.key)
  }

  const handleCopy = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenEdit = (id: string) => {
    const consumer = consumers?.find((c) => c.id === id)
    if (!consumer) return
    setEditingConsumer(consumer)
    setEditName(consumer.name)
    setEditActive(consumer.active)
    editConsumerModal.open()
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingConsumer || !editName.trim()) return
    await updateConsumer({
      id: editingConsumer.id,
      name: editName.trim(),
      active: editActive,
    })
    editConsumerModal.close()
    setEditingConsumer(null)
  }

  if (isLoading) {
    return <p>Chargement...</p>
  }

  return (
    <>
      <div className="fr-mb-4w" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="fr-mb-0">{consumers?.length ?? 0} consommateur(s) API</p>
        <Button onClick={handleOpenCreate} iconId="ri-add-line">
          Nouveau consommateur
        </Button>
      </div>

      <ConsumersTable consumers={consumers ?? []} onEdit={handleOpenEdit} />

      {/* Create modal */}
      <createConsumerModal.Component
        title={createdKey ? 'Cle API creee' : 'Nouveau consommateur API'}
        buttons={
          createdKey
            ? [{ children: 'Fermer', onClick: () => createConsumerModal.close() }]
            : [
                { children: 'Annuler', priority: 'secondary' as const, onClick: () => createConsumerModal.close() },
                {
                  children: isCreating ? 'Creation...' : 'Creer',
                  onClick: () => (document.getElementById('create-consumer-form') as HTMLFormElement)?.requestSubmit(),
                  disabled: isCreating || !createName.trim(),
                },
              ]
        }
      >
        {createdKey ? (
          <div>
            <p className="fr-text--sm">Voici la cle API du consommateur. Elle ne sera plus affichee. Copiez-la maintenant.</p>
            <div className="fr-p-2w" style={{ background: 'var(--background-contrast-grey)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code style={{ wordBreak: 'break-all', flex: 1 }}>{createdKey}</code>
                <Button size="small" priority="secondary" onClick={handleCopy} iconId={copied ? 'ri-check-line' : 'ri-clipboard-line'}>
                  {copied ? 'Copie !' : 'Copier'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form id="create-consumer-form" onSubmit={handleCreate}>
            <Input
              label="Nom du consommateur"
              hintText='Ex: "DREAL IDF"'
              nativeInputProps={{
                value: createName,
                onChange: (e) => setCreateName(e.target.value),
                required: true,
              }}
            />
          </form>
        )}
      </createConsumerModal.Component>

      {/* Edit modal */}
      <editConsumerModal.Component
        title="Modifier le consommateur"
        buttons={[
          { children: 'Annuler', priority: 'secondary' as const, onClick: () => editConsumerModal.close() },
          {
            children: isUpdating ? 'Enregistrement...' : 'Enregistrer',
            onClick: () => (document.getElementById('edit-consumer-form') as HTMLFormElement)?.requestSubmit(),
            disabled: isUpdating || !editName.trim(),
          },
        ]}
      >
        <form id="edit-consumer-form" onSubmit={handleEdit}>
          <Input
            label="Nom du consommateur"
            nativeInputProps={{
              value: editName,
              onChange: (e) => setEditName(e.target.value),
              required: true,
            }}
          />
          <ToggleSwitch label="Actif" checked={editActive} onChange={(checked) => setEditActive(checked)} />
        </form>
      </editConsumerModal.Component>
    </>
  )
}
