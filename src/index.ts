#!/usr/bin/env node
import chalk from 'chalk';
import { fetchOipTemplates } from './templates';

// CLI handling
if (require.main === module) {
	const args = process.argv.slice(2);

	// Parse command line arguments
	let outputPath: string | undefined;
	let keepVersions = false;

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
	const versionsIndex = args.findIndex(arg => arg === '--keep-versions');
	if (versionsIndex !== -1) {
		keepVersions = true;
		args.splice(versionsIndex, 1);
	}

	// Check for help flag
	if (args.includes('--help') || args.includes('-h')) {
		console.log(chalk.bold.blue('🌐 OIP Arweave Type Generator'));
		console.log(
			chalk.gray('Generate TypeScript types from OIP Arweave templates\n')
		);
		console.log(
			chalk.bold('📖 Usage:'),
			chalk.cyan('npx oip-arweave-types [options]')
		);
		console.log(chalk.bold('\n⚙️  Options:'));
		console.log(
			chalk.green('  --output, -o <path>      '),
			'Output path for generated types'
		);
		console.log(
			chalk.green('  --keep-versions          '),
			'Keep all template versions (creates versioned interfaces)'
		);
		console.log(
			chalk.green('  --help, -h               '),
			'Show this help message'
		);
		console.log(chalk.bold('\n🚀 Examples:'));
		console.log(
			chalk.cyan('  npx oip-arweave-types                    '),
			chalk.gray('# Generate latest versions only')
		);
		console.log(
			chalk.cyan('  npx oip-arweave-types --keep-versions    '),
			chalk.gray('# Keep all template versions')
		);
		console.log(
			chalk.cyan('  npx oip-arweave-types -o ./types.ts      '),
			chalk.gray('# Custom output path')
		);
		process.exit(0);
	}

	// Always fetch from API
	console.log(chalk.bold.blue('🌐 OIP Arweave Type Generator'));
	fetchOipTemplates(outputPath, keepVersions).catch(console.error);
}
