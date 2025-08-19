#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { logger } from './logger';
import { VersionChecker } from './lib/version-checker';
import commands from './commands';
import packageJson from '../package.json';

const program = new Command();

program
	.name('oip-arweave-types')
	.description(
		chalk.blue.bold('🌐 OIP Arweave Type Generator\n') +
			chalk.gray('Generate TypeScript types from OIP Arweave templates')
	)
	// Don't set version here, we'll handle it manually
	.configureHelp({
		formatHelp: (cmd, helper) => {
			// For the root command, show our custom help
			if (cmd.name() === 'oip-arweave-types') {
				logger.header('🌐 OIP Arweave TypeScript Generator');
				logger.info(
					'📦 Generate TypeScript types from OIP Arweave templates'
				);
				console.log('');

				logger.info('📋 Available Commands:');
				console.log('');

				// Dynamically iterate through commands to build help
				cmd.commands.forEach((command) => {
					const name = command.name();
					const description = command.description();

					// Get the emoji for each command
					let emoji = '🔧';
					if (name === 'generate') emoji = '🚀';
					if (name === 'add') emoji = '➕';
					if (name === 'config') emoji = '⚙️';
					if (name === 'help') emoji = '❓';

					logger.info(
						`${emoji} ${name} ${command
							.usage()
							.replace(name, '')
							.trim()}`
					);
					logger.muted(`   ${description}`);

					// Show options for each command
					const options = command.options;
					if (options && options.length > 0) {
						logger.muted('   Options:');
						options.forEach((option) => {
							const flags = option.flags;
							const desc = option.description;
							logger.muted(`     ${flags.padEnd(20)} ${desc}`);
						});
					}

					console.log('');
				});

				logger.info('💡 Examples:');
				logger.muted('   npx oip-arweave-types generate');
				logger.muted(
					'   npx oip-arweave-types generate --single-file -o types.ts'
				);
				logger.muted('   npx oip-arweave-types add Audio');
				logger.muted('   npx oip-arweave-types config init');
				console.log('');

				logger.info('🔧 Configuration:');
				logger.muted(
					'   Create oip.config.json in your project root to customize:'
				);
				logger.muted('   • API endpoint (apiRoot)');
				logger.muted('   • Default output directory (outputDir)');
				logger.muted(
					'   • Single file mode preference (defaultSingleFile)'
				);
				logger.muted('   • Template-specific settings (templates)');

				return ''; // Return empty string to prevent default help from showing
			}

			// For subcommands, use default formatting
			return helper.formatHelp(cmd, helper);
		},
	});

// Add commands
commands.forEach((command) => program.addCommand(command));

// Add custom version command with update check
program
	.option('-V, --version', 'output the version number')
	.action(async (options) => {
		if (options.version) {
			// Custom version display with update check
			logger.info(`📦 oip-arweave-types v${packageJson.version}`);
			await VersionChecker.showUpdateNotification();
			process.exit(0);
		}
	});

program.parse();
