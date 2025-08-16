#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
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
		console.log('Fetching latest templates from API...');
		fetchOipTemplates(outputPath).catch(console.error);
	} else {
		// Use local file
		jsonFilePath = path.resolve(args[0]);

		if (!fs.existsSync(jsonFilePath)) {
			console.error(`File not found: ${jsonFilePath}`);
			console.log('Usage: npx oip-arweave-types [options] [input-file]');
			console.log('Options:');
			console.log(
				'  --api           Fetch templates from API (default behavior)'
			);
			console.log('  --output, -o    Output path for generated types');
			console.log('Examples:');
			console.log(
				'  npx oip-arweave-types                    # Fetch from API'
			);
			console.log(
				'  npx oip-arweave-types --api              # Explicitly fetch from API'
			);
			console.log(
				'  npx oip-arweave-types local.json         # Use local file'
			);
			console.log(
				'  npx oip-arweave-types -o ./types.ts      # Custom output path'
			);
			process.exit(1);
		}

		console.log(`Using local file: ${jsonFilePath}`);
		parseOipTemplates(jsonFilePath, outputPath);
	}
}
