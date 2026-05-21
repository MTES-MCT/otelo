'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { FC, useState } from 'react'
import { type ApiConsumer } from '~/hooks/use-consumers'
import { useDeleteConsumer } from '~/hooks/use-delete-consumer'
import { useGetConsumerKey } from '~/hooks/use-get-consumer-key'
import { useRegenerateConsumerKey } from '~/hooks/use-regenerate-consumer-key'
import { useUpdateConsumer } from '~/hooks/use-update-consumer'

const deleteModal = createModal({
  id: 'delete-consumer-modal',
  isOpenedByDefault: false,
})

const keyModal = createModal({
  id: 'key-display-modal',
  isOpenedByDefault: false,
})

interface ConsumersTableProps {
  consumers: ApiConsumer[]
  onEdit: (id: string) => void
}

export const ConsumersTable: FC<ConsumersTableProps> = ({ consumers, onEdit }) => {
  const { mutate: updateConsumer } = useUpdateConsumer()
  const { mutate: deleteConsumer } = useDeleteConsumer()
  const { mutateAsync: regenerateKey, isPending: isRegenerating } = useRegenerateConsumerKey()
  const [regeneratedKey, setRegeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [keyVisible, setKeyVisible] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [keyConsumerId, setKeyConsumerId] = useState<string | null>(null)
  const [keyConsumerName, setKeyConsumerName] = useState<string>('')

  const { data: keyData, isLoading: isLoadingKey } = useGetConsumerKey(keyConsumerId)

  const handleDelete = (id: string) => {
    setDeletingId(id)
    deleteModal.open()
  }

  const confirmDelete = () => {
    if (deletingId) {
      deleteConsumer(deletingId)
      deleteModal.close()
      setDeletingId(null)
    }
  }

  const handleOpenKey = (consumer: ApiConsumer) => {
    setKeyConsumerId(consumer.id)
    setKeyConsumerName(consumer.name)
    setRegeneratedKey(null)
    setCopied(false)
    setKeyVisible(false)
    keyModal.open()
  }

  const handleRegenerate = async () => {
    if (!keyConsumerId) return
    const result = await regenerateKey(keyConsumerId)
    setRegeneratedKey(result.key)
    setCopied(false)
    setKeyVisible(false)
  }

  const handleCopy = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleActive = (consumer: ApiConsumer) => {
    updateConsumer({ id: consumer.id, active: !consumer.active })
  }

  const displayedKey = regeneratedKey ?? keyData?.key
  const isNewKey = !!regeneratedKey

  const columns: ColumnDef<ApiConsumer>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
    },
    {
      accessorKey: 'prefix',
      header: 'Préfixe',
      cell: ({ getValue }) => <code>otelo_{getValue<string>()}...</code>,
    },
    {
      accessorKey: 'active',
      header: 'Actif',
      cell: ({ row }) => {
        const consumer = row.original
        return (
          <button
            type="button"
            onClick={() => handleToggleActive(consumer)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
            title={consumer.active ? 'Desactiver' : 'Activer'}
          >
            {consumer.active ? '✅' : '❌'}
          </button>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Création',
      cell: ({ getValue }) => dayjs(getValue<string>()).format('DD/MM/YYYY'),
    },
    {
      accessorKey: 'lastUsedAt',
      header: 'Dernière utilisation',
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        return val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-'
      },
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'right' }}>Actions</div>,
      cell: ({ row }) => {
        const consumer = row.original
        return (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', color: 'var(--text-action-high-blue-france)' }}>
            <i style={{ cursor: 'pointer' }} onClick={() => onEdit(consumer.id)} className="ri-pencil-line" title="Modifier" />
            <i style={{ cursor: 'pointer' }} onClick={() => handleOpenKey(consumer)} className="ri-key-2-line" title="Gérer la clé API" />
            <i style={{ cursor: 'pointer' }} onClick={() => handleDelete(consumer.id)} className="ri-delete-bin-5-fill" title="Supprimer" />
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: consumers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <div className="fr-table" style={{ overflowX: 'auto' }}>
        <table style={{ display: 'table' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="fr-text--center">
                  Aucun consommateur API
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <deleteModal.Component title="Supprimer ce consommateur API ?">
        <p>Cette action est irréversible. Les simulations associées seront supprimées.</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button priority="secondary" onClick={deleteModal.close}>
            Annuler
          </Button>
          <Button
            onClick={confirmDelete}
            iconId="ri-delete-bin-5-fill"
            style={{
              backgroundColor: 'var(--background-action-low-red-marianne)',
              color: 'var(--background-default-grey)',
            }}
          >
            Supprimer
          </Button>
        </div>
      </deleteModal.Component>

      <keyModal.Component title={`Clé API — ${keyConsumerName}`}>
        {isNewKey && (
          <div
            className="fr-p-2w fr-mb-2w"
            style={{
              background: 'var(--background-contrast-info)',
              borderRadius: '4px',
              borderLeft: '4px solid var(--border-plain-info)',
            }}
          >
            <p className="fr-text--sm fr-mb-0">Nouvelle clé générée. Copiez-la maintenant.</p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="fr-input-group" style={{ flex: 1, marginBottom: 0 }}>
            {isLoadingKey && !displayedKey ? (
              <input className="fr-input" type="text" value="Chargement..." readOnly style={{ fontFamily: 'monospace' }} />
            ) : (
              <input
                className="fr-input"
                type={keyVisible ? 'text' : 'password'}
                value={displayedKey ?? ''}
                readOnly
                style={{ fontFamily: 'monospace' }}
              />
            )}
          </div>
          <Button
            size="small"
            priority="tertiary no outline"
            onClick={() => setKeyVisible((v) => !v)}
            iconId={keyVisible ? 'ri-eye-off-line' : 'ri-eye-line'}
            title={keyVisible ? 'Masquer' : 'Afficher'}
          />
          {displayedKey && (
            <Button
              size="small"
              priority="secondary"
              onClick={() => handleCopy(displayedKey)}
              iconId={copied ? 'ri-check-line' : 'ri-clipboard-line'}
            >
              {copied ? 'Copié !' : 'Copier'}
            </Button>
          )}
        </div>

        <div
          className="fr-p-2w fr-mt-2w"
          style={{
            background: 'var(--background-action-low-orange-terre-battue)',
            borderRadius: '4px',
            borderLeft: '4px solid var(--border-plain-warning)',
          }}
        >
          <p className="fr-text--bold fr-mb-1w">Régénérer la clé</p>
          <p className="fr-text--sm fr-mb-0">
            Régénérer la clé invalidera immédiatement l'ancienne. Tous les scripts utilisant l'ancienne clé cesseront de fonctionner.
          </p>
        </div>

        <div className="fr-mt-2w" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button
            priority="secondary"
            onClick={() => {
              keyModal.close()
              setKeyConsumerId(null)
              setRegeneratedKey(null)
            }}
          >
            Fermer
          </Button>
          <Button onClick={handleRegenerate} iconId="ri-refresh-line" disabled={isRegenerating}>
            {isRegenerating ? 'Régénération...' : 'Régénérer la clé'}
          </Button>
        </div>
      </keyModal.Component>
    </>
  )
}
