#!/usr/bin/env node

import { NestFactory } from '@nestjs/core'
import { Command } from 'commander'
import { CliModule } from './cli.module'
import { BackfillEpcisGeoCommand } from './commands/backfill-epcis-geo.command'
import { ImportBackupCommand } from './commands/import-backup.command'
import { ImportCsvCommand } from './commands/import-csv.command'
import { RecalculateResultsCommand } from './commands/recalculate-results.command'
import { UpdateUserTypesCommand } from './commands/update-user-types.command'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: ['error', 'warn'],
  })

  const program = new Command()
  program.name('otelo-cli').description('CLI pour la gestion de la base de données Otelo').version('1.0.0')

  program
    .command('import-backup')
    .description('Importe le dernier backup Scalingo dans la base de données locale')
    .action(async () => {
      try {
        const command = app.get(ImportBackupCommand)
        await command.execute()
        await app.close()
        process.exit(0)
      } catch (error) {
        console.error('✗ Erreur fatale:', error instanceof Error ? error.message : error)
        await app.close()
        process.exit(1)
      }
    })

  program
    .command('recalculate-results')
    .description(
      [
        'Recalcule les résultats enrichis de simulation (stock B11-B15, flux, sitadel, données par année).',
        '',
        'Par défaut, fonctionne en dry-run (aucune écriture en base).',
        'Utiliser --write pour persister les résultats en base.',
        '',
        'Exemples :',
        '  pnpm -F api cli recalculate-results                         # dry-run sur toutes les simulations',
        '  pnpm -F api cli recalculate-results --write                  # écriture en base pour toutes',
        '  pnpm -F api cli recalculate-results --simulation-id <uuid>   # dry-run sur une seule',
        '  pnpm -F api cli recalculate-results --simulation-id <uuid> --write',
      ].join('\n'),
    )
    .option('--simulation-id <id>', 'Recalculer une seule simulation')
    .option('--write', 'Persister les résultats en base (sans ce flag = dry-run)')
    .action(async (options) => {
      try {
        const command = app.get(RecalculateResultsCommand)
        await command.execute({
          simulationId: options.simulationId,
          dryRun: !options.write,
        })
        await app.close()
        process.exit(0)
      } catch (error) {
        console.error('✗ Erreur fatale:', error instanceof Error ? error.message : error)
        await app.close()
        process.exit(1)
      }
    })

  program
    .command('import-csv')
    .description(
      [
        "Importe un fichier CSV dans une table de données d'Otelo.",
        '',
        'Par défaut, génère le SQL INSERT sans exécuter (mode dry-run).',
        'Utiliser --execute pour insérer directement en base locale.',
        'Utiliser --output <fichier.sql> pour écrire le SQL dans un fichier.',
        '',
        'Le SQL utilise ON CONFLICT DO NOTHING : les doublons sont ignorés.',
        'Supporte plusieurs fichiers CSV : les lignes sont fusionnées par clé primaire.',
        '',
        'Exemples :',
        '  pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024',
        '  pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024 --output import-rp.sql',
        '  pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024 --execute',
        '  pnpm -F api cli import-csv --table homeless --csv ./data/homeless_rp.csv --csv ./data/homeless_sne.csv --millesime 2024',
        '  pnpm -F api cli import-csv --table data_pack_versions --csv ./data/versions.csv',
      ].join('\n'),
    )
    .requiredOption('--table <name>', 'Nom de la table PostgreSQL (ex: rp, sitadel, homeless...)')
    .requiredOption(
      '--csv <path>',
      'Chemin(s) du/des fichier(s) CSV (répétable)',
      (val: string, prev: string[]) => prev.concat(val),
      [] as string[],
    )
    .option('--millesime <value>', 'Millésime à injecter (ex: 2024). Créé automatiquement si inexistant.')
    .option('--execute', 'Exécuter le SQL directement en base (⚠ local uniquement !)')
    .option('--output <path>', 'Écrire le SQL dans un fichier au lieu de stdout')
    .action(async (options) => {
      try {
        const command = app.get(ImportCsvCommand)
        await command.execute({
          table: options.table,
          csv: options.csv,
          millesime: options.millesime,
          execute: options.execute || false,
          output: options.output,
        })
        await app.close()
        process.exit(0)
      } catch (error) {
        console.error('✗ Erreur fatale:', error instanceof Error ? error.message : error)
        await app.close()
        process.exit(1)
      }
    })

  program
    .command('update-user-types')
    .description(
      [
        'Met à jour en masse la typologie des utilisateurs à partir d’un fichier CSV ou Excel.',
        '',
        'Colonnes attendues : email, typologie',
        'Formats supportés : .csv, .xlsx',
        '',
        'Par défaut, fonctionne en dry-run (aucune écriture en base).',
        'Utiliser --write pour persister les résultats en base.',
        'Utiliser --verbose pour afficher le détail ligne par ligne.',
        '',
        'Exemples :',
        '  pnpm -F api cli update-user-types --file ./users.csv',
        '  pnpm -F api cli update-user-types --file ./users.xlsx --verbose',
        '  pnpm -F api cli update-user-types --file ./users.csv --write',
      ].join('\n'),
    )
    .requiredOption('--file <path>', 'Chemin du fichier CSV ou Excel')
    .option('--write', 'Persister les résultats en base (sans ce flag = dry-run)')
    .option('--verbose', 'Afficher le détail ligne par ligne')
    .action(async (options) => {
      try {
        const command = app.get(UpdateUserTypesCommand)
        await command.execute({
          file: options.file,
          dryRun: !options.write,
          verbose: options.verbose || false,
        })
        await app.close()
        process.exit(0)
      } catch (error) {
        console.error('✗ Erreur fatale:', error instanceof Error ? error.message : error)
        await app.close()
        process.exit(1)
      }
    })

  program
    .command('backfill-epcis-geo')
    .description(
      [
        "Récupère les codes et noms de départements depuis l'API Geo pour chaque EPCI.",
        '',
        'Par défaut, fonctionne en dry-run (aucune écriture en base).',
        'Utiliser --write pour persister les résultats en base.',
        '',
        'Exemples :',
        '  pnpm -F api cli backfill-epcis-geo              # dry-run',
        '  pnpm -F api cli backfill-epcis-geo --write       # écriture en base',
      ].join('\n'),
    )
    .option('--write', 'Persister les résultats en base (sans ce flag = dry-run)')
    .action(async (options) => {
      try {
        const command = app.get(BackfillEpcisGeoCommand)
        await command.execute({ dryRun: !options.write })
        await app.close()
        process.exit(0)
      } catch (error) {
        console.error('✗ Erreur fatale:', error instanceof Error ? error.message : error)
        await app.close()
        process.exit(1)
      }
    })

  await program.parseAsync(process.argv)
}

bootstrap().catch((error) => {
  console.error('✗ Erreur lors du démarrage du CLI:', error)
  process.exit(1)
})
