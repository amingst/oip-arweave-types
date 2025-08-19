export class DependencyAnalyzer {
	static findRequiredImports(
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

	static findDependenciesInLine(
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
}
