/// <reference path="./index.d.ts" />
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function fetchOipTemplates(
	options?: { output?: string } | string
): Promise<void> {
	// Handle both new options object and legacy parameter format
	let outputPath: string | undefined;

	if (typeof options === 'string') {
		// Legacy format: fetchOipTemplates(outputPath)
		outputPath = options;
	} else {
		// New format: fetchOipTemplates({ output })
		outputPath = options?.output;
	}
	console.log(chalk.cyan('🚀 Fetching templates from OIP API...'));

	// Always use API types
	const apiUrl = 'https://api.oip.onl/api/templates?typeScriptTypes=true';

	try {
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		console.log(chalk.green('✅ Successfully fetched templates'));

		const data = await response.json();

		if (!data.typeScript) {
			throw new Error('API response missing TypeScript content');
		}

		const typeScriptContent = data.typeScript;

		// Count interfaces by simple regex matching
		const interfaceMatches =
			typeScriptContent.match(/export interface [A-Za-z0-9_]+/g) || [];
		const typeMatches =
			typeScriptContent.match(/export type [A-Za-z0-9_]+/g) || [];
		const interfaceCount = interfaceMatches.length + typeMatches.length;

		// Always using most recent versions only
		console.log(chalk.gray('   Using most recent versions only'));

		// Default output path logic
		let finalOutputPath: string;
		if (outputPath) {
			finalOutputPath = path.resolve(outputPath);
			// Ensure parent directory exists for custom output paths
			const parentDir = path.dirname(finalOutputPath);
			if (!fs.existsSync(parentDir)) {
				fs.mkdirSync(parentDir, { recursive: true });
			}
		} else {
			// Default to oip folder in the user's current working directory
			const oipDir = path.join(process.cwd(), 'oip');

			// Create oip directory if it doesn't exist
			if (!fs.existsSync(oipDir)) {
				fs.mkdirSync(oipDir, { recursive: true });
			}

			finalOutputPath = path.join(oipDir, 'generated-types.ts');
		}

		fs.writeFileSync(finalOutputPath, typeScriptContent);

		console.log(chalk.green('🎉 TypeScript types generated successfully!'));
		console.log(chalk.cyan(`📁 Output: ${finalOutputPath}`));
		console.log(chalk.yellow(`🔧 Retrieved ${interfaceCount} interfaces`));

		// Show some stats
		const fileSize = fs.statSync(finalOutputPath).size;
		const fileSizeKB = (fileSize / 1024).toFixed(2);
		console.log(chalk.gray(`📊 File size: ${fileSizeKB} KB`));
	} catch (error) {
		console.log(chalk.red('❌ Failed to fetch templates from API'));
		console.log(
			chalk.red(
				`Error: ${
					error instanceof Error ? error.message : String(error)
				}`
			)
		);
		console.log(
			chalk.yellow(
				'🌐 Please check your internet connection and try again.'
			)
		);
		console.log(
			chalk.gray(
				'   If the issue persists, the API may be temporarily unavailable.'
			)
		);
		process.exit(1);
	}
}
