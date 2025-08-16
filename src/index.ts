#!/usr/bin/env node
import chalk from 'chalk';
import { fetchOipTemplates } from './templates';

// CLI handling
if (require.main === module) {
	const args = process.argv.slice(2);

	// Parse command line arguments
	let outputPath: string | undefined;

	// Look for --output or -o flag
	const outputIndex = args.findIndex(
		(arg) => arg === '--output' || arg === '-o'
	);
	if (outputIndex !== -1 && outputIndex + 1 < args.length) {
		outputPath = args[outputIndex + 1];
		// Remove output flag and path from args
		args.splice(outputIndex, 2);
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
			chalk.green('  --output, -o <path>  '),
			'Output path for generated types'
		);
		console.log(
			chalk.green('  --help, -h           '),
			'Show this help message'
		);
		console.log(chalk.bold('\n🚀 Examples:'));
		console.log(
			chalk.cyan('  npx oip-arweave-types                '),
			chalk.gray('# Generate types in ./oip/generated-types.ts')
		);
		console.log(
			chalk.cyan('  npx oip-arweave-types -o ./types.ts  '),
			chalk.gray('# Custom output path')
		);
		process.exit(0);
	}

	// Always fetch from API
	console.log(chalk.bold.blue('🌐 OIP Arweave Type Generator'));
	fetchOipTemplates(outputPath).catch(console.error);
}
