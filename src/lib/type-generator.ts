import { ApiClient } from './api-client';
import { FileSystemUtils } from './file-utils';
import { PathResolver } from './path-resolver';
import { TypeAnalyzer } from './type-analyzer';
import { FileSplitter } from './file-splitter';
import { JSDocEnhancer, JSDocOptions } from './jsdoc-enhancer';
import { ConfigManager, ResolvedConfig } from './config';
import { logger } from '../logger';

export interface GenerateOptions {
	output?: string;
	singleFile?: boolean;
	includeJSDoc?: boolean;
	jsDocOptions?: JSDocOptions;
}

export class TypeGenerator {
	private config: ResolvedConfig;
	private apiClient: ApiClient;

	constructor(config?: ResolvedConfig) {
		this.config = config || ConfigManager.loadConfig();
		this.apiClient = new ApiClient(this.config.apiRoot);
	}

	async generateTypes(options: GenerateOptions = {}): Promise<void> {
		// Use config defaults when options are not provided
		const output = options.output || this.config.outputDir;
		const singleFile = options.singleFile ?? this.config.defaultSingleFile;
		const includeJSDoc = options.includeJSDoc ?? true; // Default to true
		const jsDocOptions = options.jsDocOptions || {};

		try {
			// Fetch all templates from API
			let typeScriptContent = await this.apiClient.fetchAllTemplates();

			// Enhance with JSDoc comments if requested
			if (includeJSDoc) {
				typeScriptContent = await JSDocEnhancer.enhanceWithJSDoc(
					typeScriptContent,
					jsDocOptions
				);
			}

			// Analyze the types
			const analysis = TypeAnalyzer.analyzeTypes(typeScriptContent);

			// Resolve output paths
			const { finalOutputPath, outputDir } =
				PathResolver.resolveOutputPaths(output, singleFile);

			// Ensure output directory exists
			FileSystemUtils.ensureDirectoryExists(outputDir);

			if (singleFile) {
				// Write everything to a single file
				FileSystemUtils.writeFile(finalOutputPath, typeScriptContent);

				logger.success('🎉 TypeScript types generated successfully!');
				logger.info(`📁 Output: ${finalOutputPath}`, {
					outputPath: finalOutputPath,
				});
				logger.info(
					`🔧 Retrieved ${analysis.interfaceCount} interfaces`,
					{
						interfaceCount: analysis.interfaceCount,
					}
				);
			} else {
				// Split into separate files
				const { files, indexContent } =
					FileSplitter.splitTypeScriptIntoFiles(typeScriptContent);

				// Write individual files
				for (const [filename, content] of Object.entries(files)) {
					const filePath = outputDir + '/' + filename;
					FileSystemUtils.writeFile(filePath, content as string);
				}

				// Write index file that exports everything
				FileSystemUtils.writeFile(finalOutputPath, indexContent);

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
				logger.info(
					`🔧 Retrieved ${analysis.interfaceCount} interfaces`,
					{
						interfaceCount: analysis.interfaceCount,
					}
				);
			}
		} catch (error) {
			// ApiClient already handles logging errors
			process.exit(1);
		}
	}
}
