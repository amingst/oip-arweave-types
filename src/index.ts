#!/usr/bin/env node

import SchemaTypeGenerator from './SchemaTypeGenerator';
import * as fs from 'fs';
import * as path from 'path';

export function parseOipTemplates(
	jsonFilePath: string,
	outputPath?: string
): void {
	const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
	const data: ApiResponse = JSON.parse(jsonContent);

	const generator = new SchemaTypeGenerator();
	const typeScriptContent = generator.generateTypeScriptFile(data);

	// Default output path logic
	let finalOutputPath: string;
	if (outputPath) {
		finalOutputPath = path.resolve(outputPath);
	} else {
		// Default to types folder in project root
		const projectRoot = path.resolve(__dirname, '..');
		const typesDir = path.join(projectRoot, 'types');

		// Create types directory if it doesn't exist
		if (!fs.existsSync(typesDir)) {
			fs.mkdirSync(typesDir, { recursive: true });
		}

		finalOutputPath = path.join(typesDir, 'generated-types.ts');
	}

	fs.writeFileSync(finalOutputPath, typeScriptContent);

	console.log(`TypeScript types generated at: ${finalOutputPath}`);
}

// CLI handling
if (require.main === module) {
	const args = process.argv.slice(2);

	// Parse command line arguments
	let jsonFilePath: string;
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

	// Default to templates.json if no input file provided, or if --all flag is used
	if (args.length === 0 || args[0] === '--all') {
		jsonFilePath = path.resolve(__dirname, '../json/templates.json');
		console.log('Using master templates.json to generate all types');
	} else {
		jsonFilePath = path.resolve(args[0]);
	}

	if (!fs.existsSync(jsonFilePath)) {
		console.error(`File not found: ${jsonFilePath}`);
		console.log(
			'Usage: npx oip-arweave-types [input-file] [--output|-o output-path]'
		);
		console.log(
			'  input-file: Path to JSON template file (defaults to templates.json)'
		);
		console.log(
			'  --output: Output path for generated types (defaults to ./types/generated-types.ts)'
		);
		process.exit(1);
	}

	parseOipTemplates(jsonFilePath, outputPath);
}
