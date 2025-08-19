import * as path from 'path';

export interface OutputConfig {
	finalOutputPath: string;
	outputDir: string;
}

export class PathResolver {
	static resolveOutputPaths(
		outputPath?: string,
		singleFile: boolean = false
	): OutputConfig {
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

		return { finalOutputPath, outputDir };
	}
}
