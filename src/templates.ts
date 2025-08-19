/// <reference path="./index.d.ts" />
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { logger } from './logger';

// Function to split TypeScript content into separate files
function splitTypeScriptIntoFiles(content: string): {
	files: Record<string, string>;
	indexContent: string;
} {
	const files: Record<string, string> = {};
	const exports: string[] = [];

	// Split content by lines for processing
	const lines = content.split('\n');
	let currentBlock: string[] = [];
	let currentName = '';
	let inBlock = false;
	let braceCount = 0;
	let isUnionType = false;

	// Header comments to include in each file
	const headerLines = lines.slice(0, 3); // First 3 lines are usually headers
	const header = headerLines.join('\n') + '\n\n';

	// First pass: collect all export names
	const allExports: string[] = [];
	for (const line of lines) {
		const exportMatch = line.match(
			/^export (?:type|interface) ([A-Za-z0-9_]+)/
		);
		if (exportMatch) {
			allExports.push(exportMatch[1]);
		}
	}

	for (let i = 3; i < lines.length; i++) {
		const line = lines[i];

		// Check for export declarations
		const exportMatch = line.match(
			/^export (?:type|interface) ([A-Za-z0-9_]+)/
		);
		if (exportMatch) {
			// Save previous block if exists
			if (currentName && currentBlock.length > 0) {
				const blockContent = currentBlock.join('\n');
				const imports = findRequiredImports(
					blockContent,
					allExports,
					currentName
				);
				const fileContent =
					header +
					(imports.length > 0 ? imports.join('\n') + '\n\n' : '') +
					blockContent +
					'\n';
				files[`${currentName}.ts`] = fileContent;
				exports.push(currentName);
			}

			// Start new block
			currentName = exportMatch[1];
			currentBlock = [line];
			inBlock = true;
			braceCount = 0;
			isUnionType = line.includes('=') && !line.includes('{');

			// Count braces in the declaration line
			braceCount += (line.match(/{/g) || []).length;
			braceCount -= (line.match(/}/g) || []).length;
		} else if (inBlock) {
			currentBlock.push(line);

			// For union types, look for the ending semicolon
			if (isUnionType) {
				if (line.trim() === ';') {
					const blockContent = currentBlock.join('\n');
					const imports = findRequiredImports(
						blockContent,
						allExports,
						currentName
					);
					const fileContent =
						header +
						(imports.length > 0
							? imports.join('\n') + '\n\n'
							: '') +
						blockContent +
						'\n';
					files[`${currentName}.ts`] = fileContent;
					exports.push(currentName);
					currentName = '';
					currentBlock = [];
					inBlock = false;
					isUnionType = false;
				}
			} else {
				// Count braces to know when interface ends
				braceCount += (line.match(/{/g) || []).length;
				braceCount -= (line.match(/}/g) || []).length;

				// If braces are balanced and we're in an interface, the block is complete
				if (braceCount === 0 && currentName) {
					const blockContent = currentBlock.join('\n');
					const imports = findRequiredImports(
						blockContent,
						allExports,
						currentName
					);
					const fileContent =
						header +
						(imports.length > 0
							? imports.join('\n') + '\n\n'
							: '') +
						blockContent +
						'\n';
					files[`${currentName}.ts`] = fileContent;
					exports.push(currentName);
					currentName = '';
					currentBlock = [];
					inBlock = false;
				}
			}
		}
	}

	// Handle any remaining block
	if (currentName && currentBlock.length > 0) {
		const blockContent = currentBlock.join('\n');
		const imports = findRequiredImports(
			blockContent,
			allExports,
			currentName
		);
		const fileContent =
			header +
			(imports.length > 0 ? imports.join('\n') + '\n\n' : '') +
			blockContent +
			'\n';
		files[`${currentName}.ts`] = fileContent;
		exports.push(currentName);
	}

	// Generate index file that re-exports everything
	const indexContent =
		header +
		exports.map((name) => `export * from './${name}';`).join('\n') +
		'\n';

	return { files, indexContent };
}

// Helper function to find required imports for a block
function findRequiredImports(
	blockContent: string,
	allExports: string[],
	currentName: string
): string[] {
	const imports: string[] = [];

	for (const exportName of allExports) {
		if (exportName !== currentName) {
			// Check if this export is referenced in the block content
			const regex = new RegExp(`\\b${exportName}\\b`);
			if (regex.test(blockContent)) {
				imports.push(
					`import type { ${exportName} } from './${exportName}';`
				);
			}
		}
	}

	return imports;
}

export async function fetchOipTemplates(
	options?: { output?: string; singleFile?: boolean } | string
): Promise<void> {
	// Handle both new options object and legacy parameter format
	let outputPath: string | undefined;
	let singleFile: boolean = false;

	if (typeof options === 'string') {
		// Legacy format: fetchOipTemplates(outputPath)
		outputPath = options;
	} else {
		// New format: fetchOipTemplates({ output, singleFile })
		outputPath = options?.output;
		singleFile = options?.singleFile ?? false;
	}
	logger.info('🚀 Fetching templates from OIP API...');

	// Always use API types
	const apiUrl = 'https://api.oip.onl/api/templates?typeScriptTypes=true';

	try {
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		logger.success('✅ Successfully fetched templates');

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

		// Default output path logic
		let finalOutputPath: string;
		let outputDir: string;

		if (outputPath) {
			if (singleFile) {
				// If singleFile is true, treat as file path
				finalOutputPath = path.resolve(outputPath);
				// If the path doesn't have an extension, add .ts
				if (!path.extname(finalOutputPath)) {
					finalOutputPath = path.join(
						finalOutputPath,
						'generated-types.ts'
					);
				}
				outputDir = path.dirname(finalOutputPath);
			} else {
				// If singleFile is false, treat as directory
				outputDir = path.resolve(outputPath);
				finalOutputPath = path.join(outputDir, 'index.ts');
			}
		} else {
			// Default to oip folder in the user's current working directory
			outputDir = path.join(process.cwd(), 'oip');
			if (singleFile) {
				finalOutputPath = path.join(outputDir, 'generated-types.ts');
			} else {
				finalOutputPath = path.join(outputDir, 'index.ts');
			}
		}

		// Ensure output directory exists
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		if (singleFile) {
			// Write everything to a single file (current behavior)
			fs.writeFileSync(finalOutputPath, typeScriptContent);

			logger.success('🎉 TypeScript types generated successfully!');
			logger.info(`📁 Output: ${finalOutputPath}`, {
				outputPath: finalOutputPath,
			});
			logger.info(`🔧 Retrieved ${interfaceCount} interfaces`, {
				interfaceCount,
			});
		} else {
			// Split into separate files
			const { files, indexContent } =
				splitTypeScriptIntoFiles(typeScriptContent);

			// Write individual files
			for (const [filename, content] of Object.entries(files)) {
				const filePath = path.join(outputDir, filename);
				fs.writeFileSync(filePath, content as string);
			}

			// Write index file that exports everything
			fs.writeFileSync(finalOutputPath, indexContent);

			logger.success('🎉 TypeScript types generated successfully!');
			logger.info(`📁 Output directory: ${outputDir}`, { outputDir });
			logger.info(
				`🔧 Generated ${
					Object.keys(files).length
				} separate files + index.ts`,
				{
					fileCount: Object.keys(files).length,
				}
			);
			logger.info(`🔧 Retrieved ${interfaceCount} interfaces`, {
				interfaceCount,
			});
		}
	} catch (error) {
		logger.error('❌ Failed to fetch templates from API', {
			error: error instanceof Error ? error.message : String(error),
		});
		logger.warn('🌐 Please check your internet connection and try again.');
		process.exit(1);
	}
}

// Function to fetch a specific template schema from the API
async function fetchTemplateSchema(
	templateName: string
): Promise<string | null> {
	const apiUrl = `https://api.oip.onl/api/templates?typeScriptTypes=true&template=${encodeURIComponent(
		templateName
	)}`;

	try {
		logger.info(`🔍 Fetching schema for template: ${templateName}`, {
			templateName,
		});

		const response = await fetch(apiUrl);

		if (!response.ok) {
			if (response.status === 404) {
				logger.error(`❌ Template "${templateName}" not found`, {
					templateName,
					status: response.status,
				});
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (!data.typeScript) {
			throw new Error('API response missing TypeScript content');
		}

		logger.success(`✅ Successfully fetched schema for "${templateName}"`, {
			templateName,
		});
		return data.typeScript;
	} catch (error) {
		logger.error(
			`❌ Failed to fetch template schema for "${templateName}"`,
			{
				templateName,
				error: error instanceof Error ? error.message : String(error),
			}
		);
		return null;
	}
}

// Function to check if a file exists in the oip directory
function checkFileExists(templateName: string): string | null {
	const oipDir = path.join(process.cwd(), 'oip');
	const filePath = path.join(oipDir, `${templateName}.ts`);

	if (fs.existsSync(filePath)) {
		return filePath;
	}

	return null;
}

// Function to prompt user for file overwrite confirmation
async function promptOverwrite(filePath: string): Promise<boolean> {
	const readline = require('readline');
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		console.log(chalk.yellow(`⚠️  File already exists: ${filePath}`));
		rl.question(
			chalk.cyan('Do you want to overwrite it? (y/N): '),
			(answer: string) => {
				rl.close();
				const shouldOverwrite =
					answer.toLowerCase() === 'y' ||
					answer.toLowerCase() === 'yes';
				resolve(shouldOverwrite);
			}
		);
	});
}

// Function to write template file to the oip directory
function writeTemplateFile(templateName: string, content: string): string {
	const oipDir = path.join(process.cwd(), 'oip');

	// Ensure oip directory exists
	if (!fs.existsSync(oipDir)) {
		fs.mkdirSync(oipDir, { recursive: true });
	}

	const filePath = path.join(oipDir, `${templateName}.ts`);
	fs.writeFileSync(filePath, content);

	return filePath;
}
