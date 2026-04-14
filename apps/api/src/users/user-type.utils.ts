import { USER_TYPE_LABELS } from '@shared'
import { UserType } from '~/generated/prisma/client'

export function resolveUserTypeLabel(value: string): UserType | null {
  const rawValue = value.trim()
  if (!rawValue) {
    return null
  }

  const normalizedValue = normalizeUserTypeLabel(rawValue)
  const exactMatches = new Map<string, UserType>()

  for (const userType of Object.values(UserType)) {
    exactMatches.set(normalizeUserTypeLabel(userType), userType)
  }

  for (const [userType, label] of Object.entries(USER_TYPE_LABELS) as Array<[UserType, string]>) {
    exactMatches.set(normalizeUserTypeLabel(label), userType)
  }

  const exactMatch = exactMatches.get(normalizedValue)
  if (exactMatch) {
    return exactMatch
  }

  if (normalizedValue.includes('agence') && normalizedValue.includes('depart')) {
    return UserType.AgenceDepartementale
  }
  if (normalizedValue.includes('agence') && normalizedValue.includes('urban')) {
    return UserType.AgenceUrbanisme
  }
  if (normalizedValue.includes('bailleur') || normalizedValue.includes('agenceprivee')) {
    return UserType.BailleurSocialAgencePrivee
  }
  if (normalizedValue.includes('bureau') && normalizedValue.includes('etud')) {
    return UserType.BureauEtudes
  }
  if (normalizedValue.includes('commune')) {
    return UserType.Commune
  }
  if (normalizedValue.includes('dreal')) {
    return UserType.DREAL
  }
  if (normalizedValue === 'ddt' || normalizedValue.startsWith('ddt')) {
    return UserType.DDT
  }
  if (normalizedValue.includes('epci')) {
    return UserType.EPCI
  }
  if (normalizedValue.includes('operateur') || normalizedValue.includes('rayonnementregional')) {
    return UserType.OperateurRayonnementRegional
  }
  if (normalizedValue.includes('scot') || normalizedValue.includes('petr')) {
    return UserType.SCOTPETR
  }
  if (normalizedValue.includes('admin')) {
    return UserType.Admin
  }
  if (normalizedValue.includes('autre')) {
    return UserType.Autre
  }
  if (normalizedValue.includes('collectivite')) {
    return UserType.Collectivite
  }

  return null
}

export function normalizeUserTypeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}
