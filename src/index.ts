#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { fetchOipTemplates, parseOipTemplates } from './templates';

// CLI handling
if (require.main === module) {
	const args = process.argv.slice(2);

	// Parse command line arguments
	let jsonFilePath: string | undefined;
	let outputPath: string | undefined;
	let useApi = false;

	// Look for --output or -o flag
	const outputIndex = args.findIndex(
		(arg) => arg === '--output' || arg === '-o'
	);
	if (outputIndex !== -1 && outputIndex + 1 < args.length) {
		outputPath = args[outputIndex + 1];
		// Remove output flag and path from args
		args.splice(outputIndex, 2);
	}

	// Look for --api flag
	const apiIndex = args.findIndex((arg) => arg === '--api');
	if (apiIndex !== -1) {
		useApi = true;
		args.splice(apiIndex, 1);
	}

	// Default behavior: use API unless specific file is provided
	if (args.length === 0 || args[0] === '--all' || useApi) {
		console.log(chalk.bold.blue('🌐 OIP Arweave Type Generator'));
		console.log(chalk.gray('Generating TypeScript types from live API data\n'));
		fetchOipTemplates(outputPath).catch(console.error);
	} else {
		// Use local file
		jsonFilePath = path.resolve(args[0]);

		if (!fs.existsSync(jsonFilePath)) {
			console.log(chalk.red('❌ File not found:'), chalk.yellow(jsonFilePath));
			console.log(chalk.bold('\n📖 Usage:'), chalk.cyan('npx oip-arweave-types [options] [input-file]'));
			console.log(chalk.bold('\n⚙️  Options:'));
			console.log(chalk.green('  --api           '), 'Fetch templates from API (default behavior)');
			console.log(chalk.green('  --output, -o    '), 'Output path for generated types');
			console.log(chalk.bold('\n🚀 Examples:'));
			console.log(chalk.cyan('  npx oip-arweave-types                    '), chalk.gray('# Fetch from API'));
			console.log(chalk.cyan('  npx oip-arweave-types --api              '), chalk.gray('# Explicitly fetch from API'));
			console.log(chalk.cyan('  npx oip-arweave-types local.json         '), chalk.gray('# Use local file'));
			console.log(chalk.cyan('  npx oip-arweave-types -o ./types.ts      '), chalk.gray('# Custom output path'));
			process.exit(1);
		}

		console.log(chalk.bold.blue('📄 OIP Arweave Type Generator'));
		console.log(chalk.gray('Generating TypeScript types from local file\n'));
		console.log(chalk.yellow(`📂 Using local file: ${path.basename(jsonFilePath)}`));
		parseOipTemplates(jsonFilePath, outputPath);
	}
}
