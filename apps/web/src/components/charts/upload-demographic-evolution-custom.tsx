'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import Link from 'next/link'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

interface UploadDemographicEvolutionProps {
  epciCode: string
  scenarioId?: string
}

export const UploadDemographicEvolutionCustom = ({ epciCode, scenarioId }: UploadDemographicEvolutionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string>('Aucun fichier choisi...')

  const [queryStates, setQueryStates] = useQueryStates({
    demographicEvolutionOmphaleCustomIds: parseAsArrayOf(parseAsString).withDefault([]),
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)

    // Validate file extension, support xls and xlsx in the future
    const validExtensions = ['.csv']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Format de fichier non supporté', {
        description: 'Veuillez utiliser un fichier Excel (.xlsx, .xls) ou CSV (.csv)',
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create FormData to upload the file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('epciCode', epciCode)
      if (scenarioId) formData.append('scenarioId', scenarioId)

      const response = await fetch('/api/demographic-evolution-custom/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors du téléchargement du fichier')
      }

      const result = await response.json()

      // Add the new custom data ID to the query parameters
      setQueryStates({
        demographicEvolutionOmphaleCustomIds: [...queryStates.demographicEvolutionOmphaleCustomIds, result.id],
      })

      // Success notification
      toast.success('Données démographiques personnalisées créées avec succès')

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSelectedFileName('Aucun fichier choisi...')
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Erreur lors de la création des données démographiques personnalisées', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={fr.cx('fr-mb-3w')}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="fr-hidden"
        disabled={isProcessing}
        aria-label="Importer des données démographiques personnalisées"
        id="demographic-upload-input"
      />

      <div className="fr-flex fr-align-items-center fr-flex-gap-2v">
        <Input
          hintText="Déposez un fichier Excel (.xlsx, .xls) ou CSV."
          label="Ou ajoutez vos données personnalisées"
          nativeInputProps={{
            value: selectedFileName,
            readOnly: true,
          }}
        />
        <div>
          <Button
            iconId="fr-icon-upload-line"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="fr-mt-4w"
            priority="secondary"
            aria-describedby="upload-format-hint"
            title="Importer des données démographiques personnalisées au format CSV, Excel"
          >
            {isProcessing ? 'Traitement en cours...' : 'Parcourir'}
          </Button>
        </div>
      </div>
      <p className="fr-text--xs fr-mb-0">
        <Link className="fr-link fr-text--xs" href="/assets/pdf/guide_projection_facon.pdf" target="_blank">
          Guide explicatif de la fonctionnalité
        </Link>
        <span className="fr-mx-1w">•</span>
        <Link className="fr-link fr-text--xs" href="/assets/csv/template_import_a_facon.csv" download>
          Template de données (CSV)
        </Link>
      </p>
    </div>
  )
}
