import { DependencyAnalyzer } from './dependency-analyzer';
import { TypeAnalyzer } from './type-analyzer';

export interface SplitResult {
	files: Record<string, string>;
	indexContent: string;
}

export class FileSplitter {
	static splitTypeScriptIntoFiles(content: string): SplitResult {
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

		// Get all export names
		const allExports = TypeAnalyzer.getAllExportNames(content);

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
					const imports = DependencyAnalyzer.findRequiredImports(
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
						const imports = DependencyAnalyzer.findRequiredImports(
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
						const imports = DependencyAnalyzer.findRequiredImports(
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
			const imports = DependencyAnalyzer.findRequiredImports(
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
}
