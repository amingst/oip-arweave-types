import { DependencyAnalyzer } from './dependency-analyzer';

export class TemplateExtractor {
	static extractTemplateContent(
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
				DependencyAnalyzer.findDependenciesInLine(
					line,
					dependencies,
					templateName
				);
			} else if (inTargetBlock) {
				extractedLines.push(line);

				// Find dependencies in this line
				DependencyAnalyzer.findDependenciesInLine(
					line,
					dependencies,
					templateName
				);

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
		const processedTypes = new Set<string>();
		for (const dep of dependencies) {
			if (!addedDependencies.has(dep) && !processedTypes.has(dep)) {
				const depContent = this.extractDependencyContent(
					fullContent,
					dep
				);
				if (depContent) {
					allContent.push(depContent, '');
					addedDependencies.add(dep);
					processedTypes.add(dep);
				}
			}
		}

		// Add the main template
		allContent.push(...extractedLines);

		return allContent.join('\n');
	}

	private static extractDependencyContent(
		fullContent: string,
		dependencyName: string
	): string | null {
		const lines = fullContent.split('\n');
		const foundDefinitions: string[] = [];

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

				const definition = depLines.join('\n');
				
				// Check if we've already found this exact definition
				if (!foundDefinitions.includes(definition)) {
					foundDefinitions.push(definition);
					return definition; // Return the first unique occurrence
				}
			}
		}

		return null;
	}
}
