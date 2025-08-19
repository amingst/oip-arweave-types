export interface TypeAnalysis {
	interfaceCount: number;
	typeNames: string[];
}

export class TypeAnalyzer {
	static analyzeTypes(typeScriptContent: string): TypeAnalysis {
		// Count interfaces by simple regex matching
		const interfaceMatches =
			typeScriptContent.match(/export interface [A-Za-z0-9_]+/g) || [];
		const typeMatches =
			typeScriptContent.match(/export type [A-Za-z0-9_]+/g) || [];

		const interfaceCount = interfaceMatches.length + typeMatches.length;

		// Extract type names
		const typeNames: string[] = [];

		// Extract interface names
		interfaceMatches.forEach((match) => {
			const nameMatch = match.match(/export interface ([A-Za-z0-9_]+)/);
			if (nameMatch) {
				typeNames.push(nameMatch[1]);
			}
		});

		// Extract type alias names
		typeMatches.forEach((match) => {
			const nameMatch = match.match(/export type ([A-Za-z0-9_]+)/);
			if (nameMatch) {
				typeNames.push(nameMatch[1]);
			}
		});

		return { interfaceCount, typeNames };
	}

	static getAllExportNames(content: string): string[] {
		const allExports: string[] = [];
		const lines = content.split('\n');

		for (const line of lines) {
			const exportMatch = line.match(
				/^export (?:type|interface) ([A-Za-z0-9_]+)/
			);
			if (exportMatch) {
				allExports.push(exportMatch[1]);
			}
		}

		return allExports;
	}
}
