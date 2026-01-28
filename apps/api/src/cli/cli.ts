#!/usr/bin/env node

import { NestFactory } from '@nestjs/core'
import { Command } from 'commander'
import { CliModule } from './cli.module'
import { ImportBackupCommand } from './commands/import-backup.command'

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

  await program.parseAsync(process.argv)
}

bootstrap().catch((error) => {
  console.error('✗ Erreur lors du démarrage du CLI:', error)
  process.exit(1)
})
