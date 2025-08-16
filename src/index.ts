#!/usr/bin/env node
import chalk from 'chalk';
import { fetchOipTemplates } from './templates';

// CLI handling
if (require.main === module) {
	const args = process.argv.slice(2);

	// Parse command line arguments
	let outputPath: string | undefined;
	let keepVersions = false;
	let command: string | undefined;

	// Look for --output or -o flag
	const outputIndex = args.findIndex(
		(arg) => arg === '--output' || arg === '-o'
	);
	if (outputIndex !== -1 && outputIndex + 1 < args.length) {
		outputPath = args[outputIndex + 1];
		// Remove output flag and path from args
		args.splice(outputIndex, 2);
	}

	// Look for --keep-versions flag
	const versionsIndex = args.findIndex((arg) => arg === '--keep-versions');
	if (versionsIndex !== -1) {
		keepVersions = true;
		args.splice(versionsIndex, 1);
	}

	// Check for help flag or no command
	if (args.includes('--help') || args.includes('-h') || args.length === 0) {
		console.log(chalk.bold.blue('🌐 OIP Arweave Type Generator'));
		console.log(
			chalk.gray('Generate TypeScript types from OIP Arweave templates\n')
		);
		console.log(
			chalk.bold('📖 Usage:'),
			chalk.cyan('npx oip-arweave-types <command> [options]')
		);
		console.log(chalk.bold('\n🎯 Commands:'));
		console.log(
			chalk.green('  generate '),
			chalk.cyan('[--output <path>] [--keep-versions]')
		);
		console.log('           Generate TypeScript types from API');
		console.log('');
		console.log('           Options:');
		console.log(
			'             ',
			chalk.cyan('--output, -o <path>'),
			'  Output path for generated types'
		);
		console.log(
			'             ',
			chalk.cyan('--keep-versions'),
			'      Keep all template versions'
		);
		console.log(chalk.bold('\n🔧 Global Options:'));
		console.log(
			chalk.green('  --help, -h               '),
			'Show this help message'
		);
		console.log(chalk.bold('\n🚀 Examples:'));
		console.log(
			chalk.cyan('  npx oip-arweave-types generate                    '),
			chalk.gray('# Generate latest versions only')
		);
		console.log(
			chalk.cyan('  npx oip-arweave-types generate --keep-versions    '),
			chalk.gray('# Keep all template versions')
		);
		console.log(
			chalk.cyan('  npx oip-arweave-types generate -o ./types.ts      '),
			chalk.gray('# Custom output path')
		);
		process.exit(0);
	}

	// Get the command (first remaining argument)
	command = args[0];

	if (command === 'generate') {
		// Run the generation
		console.log(chalk.bold.blue('🌐 OIP Arweave Type Generator'));
		fetchOipTemplates(outputPath, keepVersions).catch(console.error);
	} else {
		console.log(chalk.red('❌ Unknown command:'), chalk.yellow(command));
		console.log(
			chalk.gray('Run'),
			chalk.cyan('npx oip-arweave-types --help'),
			chalk.gray('to see available commands')
		);
		process.exit(1);
	}
}
