#!/usr/bin/env node

import { NestFactory } from '@nestjs/core'
import { Command } from 'commander'
import { CliModule } from './cli.module'
import { ImportBackupCommand } from './commands/import-backup.command'
import { ImportCsvCommand } from './commands/import-csv.command'
import { RecalculateResultsCommand } from './commands/recalculate-results.command'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: false, // Disable NestJS logger to avoid cluttering CLI output
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
        "Utiliser --execute pour insérer directement en base locale.",
        'Utiliser --output <fichier.sql> pour écrire le SQL dans un fichier.',
        '',
        'Le SQL utilise ON CONFLICT DO NOTHING : les doublons sont ignorés,',
        "aucune donnée existante n'est écrasée.",
        '',
        'Exemples :',
        '  pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024',
        '  pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024 --output import-rp.sql',
        '  pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024 --execute',
        '  pnpm -F api cli import-csv --table data_pack_versions --csv ./data/versions.csv',
      ].join('\n'),
    )
    .requiredOption('--table <name>', 'Nom de la table PostgreSQL (ex: rp, sitadel, homeless...)')
    .requiredOption('--csv <path>', 'Chemin du fichier CSV à importer')
    .option('--millesime <value>', 'Millésime à injecter (ex: 2024). Créé automatiquement si inexistant.')
    .option('--execute', "Exécuter le SQL directement en base (⚠ local uniquement !)")
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

  await program.parseAsync(process.argv)
}

bootstrap().catch((error) => {
  console.error('✗ Erreur lors du démarrage du CLI:', error)
  process.exit(1)
})
