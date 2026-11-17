import { BadRequestException } from '@nestjs/common'
import { Role } from '~/generated/prisma/enums'

/**
 * EPCI franciliens, hors du périmètre d'Otelo. Source : geo.api.gouv.fr, EPCI dont les régions comprennent
 * l'Île-de-France (code 11) — même règle que le filtre de recherche du front, d'où la présence du Pays Houdanais,
 * à cheval sur le Centre-Val de Loire.
 */
export const ILE_DE_FRANCE_EPCI_CODES: ReadonlySet<string> = new Set([
  '200017846', // CA Étampois Sud Essonne
  '200023125', // CC Les Portes Briardes Entre Villes et Forêts
  '200023240', // CC Pays de Nemours
  '200023919', // CC Gâtinais Val de Loing
  '200033090', // CC Plaines et Monts de France
  '200033173', // CC de la Haute Vallée de Chevreuse
  '200034130', // CC Gally Mauldre
  '200035970', // CC Vexin Centre
  '200037133', // CC du Provinois
  '200040251', // CC Bassée-Montois
  '200054781', // Métropole du Grand Paris
  '200055655', // CA Roissy Pays de France
  '200056232', // CA Communauté Paris-Saclay
  '200056380', // CA Plaine Vallée
  '200057859', // CA Coeur d'Essonne Agglomération
  '200057958', // CA Paris - Vallée de la Marne
  '200058477', // CA Val d'Yerres Val de Seine
  '200058485', // CA Val Parisis
  '200058519', // CA Saint Germain Boucles de Seine
  '200058782', // CA de Saint Quentin en Yvelines
  '200059228', // CA Grand Paris Sud Seine Essonne Sénart
  '200059889', // CU Grand Paris Seine et Oise
  '200070779', // CC Brie des Rivières et Châteaux
  '200071074', // CC Les Portes de l'Ile de France
  '200072130', // CA du Pays de Meaux
  '200072346', // CA du Pays de Fontainebleau
  '200072544', // CC des Deux Morin
  '200072874', // CC Val Briard
  '200073013', // CC Carnelle Pays-de-France
  '200073344', // CA Rambouillet Territoires
  '200090504', // CA Coulommiers Pays de Brie
  '247700032', // CC Moret Seine et Loing
  '247700057', // CA Melun Val de Seine
  '247700065', // CC du Pays de l'Ourcq
  '247700107', // CC Pays de Montereau
  '247700339', // CA Val d'Europe Agglomération
  '247700594', // CA Marne et Gondoire
  '247700644', // CC l'Orée de la Brie
  '247700701', // CC Brie Nangissienne
  '247800550', // CC du Pays Houdanais (CCPH)
  '247800584', // CA Versailles Grand Parc (CAVGP)
  '247800618', // CC Coeur d'Yvelines
  '249100074', // CC du Pays de Limours (CCPL)
  '249100157', // CC des 2 Vallées
  '249100546', // CC du Val d'Essonne (CCVE)
  '249100553', // CC Entre Juine et Renarde (CCEJR)
  '249100595', // CC le Dourdannais en Hurepoix (CCDH)
  '249500109', // CA de Cergy-Pontoise
  '249500430', // CC Sausseron Impressionnistes
  '249500455', // CC de la Vallée de l'Oise et des Trois Forêts
  '249500489', // CC du Haut Val d'Oise
  '249500513', // CC du Vexin-Val de Seine
])

export const isIleDeFranceEpci = (code: string): boolean => ILE_DE_FRANCE_EPCI_CODES.has(code)

/**
 * Refuse tout territoire comprenant un EPCI francilien, sauf aux administrateurs. Le front les retire déjà de
 * la recherche, mais l'API reste appelable directement. Sans rôle — consommateur de l'API externe —, le refus
 * s'applique.
 */
export function assertTerritoryAllowed(epciCodes: string[], role?: Role): void {
  if (role === Role.ADMIN) return
  if (epciCodes.some(isIleDeFranceEpci)) {
    throw new BadRequestException('Otelo ne permet pas de réaliser de scénario en Île-de-France.')
  }
}
