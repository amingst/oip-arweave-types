import { Command } from 'commander';
import { logger } from '../logger';
import { ConfigManager } from '../lib';

export function configCommand(): Command {
	const command = new Command('config')
		.description('Manage OIP CLI configuration')
		.action(() => {
			// Show help if no subcommand
			command.help();
		});

	// Subcommand to create a sample config file
	command
		.command('init')
		.description('Create a sample configuration file')
		.option('-f, --force', 'Overwrite existing config file', false)
		.action((options) => {
			logger.header('📋 OIP Configuration Setup');

			try {
				const configPath = 'oip.config.json';

				if (require('fs').existsSync(configPath) && !options.force) {
					logger.warn(
						`⚠️  Configuration file already exists: ${configPath}`
					);
					logger.info(
						'Use --force to overwrite, or edit the existing file'
					);
					return;
				}

				ConfigManager.createSampleConfig(configPath);
			} catch (error) {
				logger.error('❌ Failed to create config file', {
					error:
						error instanceof Error ? error.message : String(error),
				});
				process.exit(1);
			}
		});

	// Subcommand to show current config
	command
		.command('show')
		.description('Display current configuration')
		.action(() => {
			logger.header('📋 Current OIP Configuration');

			try {
				const config = ConfigManager.loadConfig();

				logger.info('📍 Configuration values:');
				console.log(JSON.stringify(config, null, 2));
			} catch (error) {
				logger.error('❌ Failed to load config', {
					error:
						error instanceof Error ? error.message : String(error),
				});
				process.exit(1);
			}
		});

	return command;
}
