import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';

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

		// Validate that the response contains the specific template we requested
		const typeScriptContent = data.typeScript;
		const expectedInterfaceName =
			templateName.charAt(0).toUpperCase() + templateName.slice(1);

		// Check for the specific interface/type in the content
		const hasInterface =
			typeScriptContent.includes(
				`export interface ${expectedInterfaceName}`
			) ||
			typeScriptContent.includes(`export type ${expectedInterfaceName}`);

		if (!hasInterface) {
			logger.error(
				`❌ Template "${templateName}" not found in API response`,
				{
					templateName,
					expectedInterfaceName,
				}
			);
			return null;
		}

		// Extract only the relevant parts for this specific template
		const extractedContent = extractTemplateContent(
			typeScriptContent,
			expectedInterfaceName
		);

		if (!extractedContent) {
			logger.error(
				`❌ Failed to extract content for template "${templateName}"`,
				{ templateName }
			);
			return null;
		}

		logger.success(`✅ Successfully fetched schema for "${templateName}"`, {
			templateName,
		});
		return extractedContent;
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

// Function to extract only the content relevant to a specific template
function extractTemplateContent(
	fullContent: string,
	templateName: string
): string | null {
	const lines = fullContent.split('\n');
	const extractedLines: string[] = [];
	const dependencies = new Set<string>();
	let inTargetBlock = false;
	let braceCount = 0;
	let isUnionType = false;

	// First pass: find the target template and its dependencies
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Check if this is our target template
		const isTargetTemplate =
			line.includes(`export interface ${templateName}`) ||
			line.includes(`export type ${templateName}`);

		if (isTargetTemplate) {
			inTargetBlock = true;
			isUnionType = line.includes('=') && !line.includes('{');
			braceCount = 0;

			// Count braces in the declaration line
			braceCount += (line.match(/{/g) || []).length;
			braceCount -= (line.match(/}/g) || []).length;

			extractedLines.push(line);

			// Find dependencies in this line
			findDependenciesInLine(line, dependencies, templateName);
		} else if (inTargetBlock) {
			extractedLines.push(line);

			// Find dependencies in this line
			findDependenciesInLine(line, dependencies, templateName);

			if (isUnionType) {
				// For union types, end when we hit the semicolon
				if (line.trim() === ';') {
					break;
				}
			} else {
				// For interfaces, count braces
				braceCount += (line.match(/{/g) || []).length;
				braceCount -= (line.match(/}/g) || []).length;

				if (braceCount === 0) {
					break;
				}
			}
		}
	}

	if (extractedLines.length === 0) {
		return null;
	}

	// Second pass: collect all dependencies
	const allContent: string[] = [];
	const addedDependencies = new Set<string>();

	// Add header
	const headerLines = lines.slice(0, 3);
	allContent.push(...headerLines, '');

	// Add dependencies first (avoid duplicates)
	for (const dep of dependencies) {
		if (!addedDependencies.has(dep)) {
			const depContent = extractDependencyContent(fullContent, dep);
			if (depContent) {
				allContent.push(depContent, '');
				addedDependencies.add(dep);
			}
		}
	}

	// Add the main template
	allContent.push(...extractedLines);

	return allContent.join('\n');
}

// Function to find dependencies in a line of code
function findDependenciesInLine(
	line: string,
	dependencies: Set<string>,
	excludeTemplate: string
): void {
	// Look for type references - more comprehensive pattern
	const typePatterns = [
		/\b([A-Z][A-Za-z0-9]*(?:Code|Template|Reference))\b/g, // Common suffixes
		/:\s*([A-Z][A-Za-z0-9]+)(?:\s*[;\]}]|\s*\|)/g, // Type annotations
		/\|\s*([A-Z][A-Za-z0-9]+)(?:\s*[;\]}]|\s*\|)/g, // Union type members
	];

	for (const pattern of typePatterns) {
		let match;
		while ((match = pattern.exec(line)) !== null) {
			const typeName = match[1];
			if (
				typeName !== excludeTemplate &&
				typeName !== 'string' &&
				typeName !== 'number' &&
				typeName !== 'boolean' &&
				typeName !== 'unknown'
			) {
				dependencies.add(typeName);
			}
		}
	}
}

// Function to extract content for a dependency
function extractDependencyContent(
	fullContent: string,
	dependencyName: string
): string | null {
	const lines = fullContent.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (
			line.includes(`export interface ${dependencyName}`) ||
			line.includes(`export type ${dependencyName}`)
		) {
			const depLines: string[] = [line];
			const isUnionType = line.includes('=') && !line.includes('{');
			let braceCount = 0;

			if (!isUnionType) {
				braceCount += (line.match(/{/g) || []).length;
				braceCount -= (line.match(/}/g) || []).length;
			}

			// Collect the rest of the definition
			for (let j = i + 1; j < lines.length; j++) {
				const nextLine = lines[j];
				depLines.push(nextLine);

				if (isUnionType) {
					if (nextLine.trim() === ';') {
						break;
					}
				} else {
					braceCount += (nextLine.match(/{/g) || []).length;
					braceCount -= (nextLine.match(/}/g) || []).length;

					if (braceCount === 0) {
						break;
					}
				}
			}

			return depLines.join('\n');
		}
	}

	return null;
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
		logger.warn(`⚠️  File already exists: ${filePath}`, { filePath });
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

export function addCommand(): Command {
	const command = new Command('add')
		.description('Add a specific template type definition')
		.argument('<name>', 'Name of the template to fetch and add')
		.option('--force', 'Overwrite existing file without prompting', false)
		.action(async (name, options) => {
			logger.header('🌐 OIP Template Fetcher');

			try {
				// 1. Fetch the schema from API
				const schemaContent = await fetchTemplateSchema(name);
				if (!schemaContent) {
					return; // Error already logged in fetchTemplateSchema
				}

				// 2. Check if file already exists
				const existingFile = checkFileExists(name);

				// 3. Handle file overwrite logic
				if (existingFile && !options.force) {
					const shouldOverwrite = await promptOverwrite(existingFile);
					if (!shouldOverwrite) {
						logger.muted('Operation cancelled.');
						return;
					}
				}

				// 4. Write the file
				const outputPath = writeTemplateFile(name, schemaContent);

				// 5. Success feedback
				logger.success('🎉 Template schema added successfully!');
				logger.info(`📁 Output: ${outputPath}`, { outputPath });
			} catch (error) {
				logger.error('❌ Failed to add template schema', {
					error:
						error instanceof Error ? error.message : String(error),
				});
				process.exit(1);
			}
		});

	return command;
}
