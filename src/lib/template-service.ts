import * as path from 'path';
import { ApiClient } from './api-client';
import { FileSystemUtils, UserPrompts } from './file-utils';
import { TemplateExtractor } from './template-extractor';
import { JSDocEnhancer, JSDocOptions } from './jsdoc-enhancer';
import { ConfigManager, ResolvedConfig } from './config';
import { logger } from '../logger';

export interface AddTemplateOptions {
	force?: boolean;
	includeJSDoc?: boolean;
	jsDocOptions?: JSDocOptions;
}

export class TemplateService {
	private config: ResolvedConfig;
	private apiClient: ApiClient;

	constructor(config?: ResolvedConfig) {
		this.config = config || ConfigManager.loadConfig();
		this.apiClient = new ApiClient(this.config.apiRoot);
	}

	async addTemplate(
		templateName: string,
		options: AddTemplateOptions = {}
	): Promise<void> {
		try {
			// Check for template-specific config overrides
			const templateConfig = this.config.templates[templateName] || {};
			const force = options.force ?? templateConfig.force ?? false;
			const includeJSDoc = options.includeJSDoc ?? true; // Default to true
			const jsDocOptions = options.jsDocOptions || {};

			// 1. Fetch the schema from API
			let fullContent = await this.apiClient.fetchTemplate(templateName);
			if (!fullContent) {
				return; // Error already logged in ApiClient
			}

			// 2. Validate that the response contains the specific template
			const expectedInterfaceName =
				templateName.charAt(0).toUpperCase() + templateName.slice(1);

			const hasInterface =
				fullContent.includes(
					`export interface ${expectedInterfaceName}`
				) ||
				fullContent.includes(`export type ${expectedInterfaceName}`);

			if (!hasInterface) {
				logger.error(
					`❌ Template "${templateName}" not found in API response`,
					{
						templateName,
						expectedInterfaceName,
					}
				);
				return;
			}

			// 3. Extract only the relevant parts for this specific template
			let extractedContent = TemplateExtractor.extractTemplateContent(
				fullContent,
				expectedInterfaceName
			);

			if (!extractedContent) {
				logger.error(
					`❌ Failed to extract content for template "${templateName}"`,
					{ templateName }
				);
				return;
			}

			// 4. Enhance with JSDoc comments if requested
			if (includeJSDoc) {
				extractedContent = await JSDocEnhancer.enhanceWithJSDoc(
					extractedContent,
					jsDocOptions
				);
			}

			// 5. Determine output path - use template-specific config if available
			let outputPath: string;
			if (templateConfig.outputPath) {
				// Use absolute or relative path from config
				outputPath =
					templateConfig.outputPath.startsWith('/') ||
					templateConfig.outputPath.includes(':')
						? templateConfig.outputPath
						: path.join(process.cwd(), templateConfig.outputPath);
			} else {
				// Use default template file location
				const existingFile =
					FileSystemUtils.checkTemplateFileExists(templateName);
				if (existingFile) {
					outputPath = existingFile;
				} else {
					outputPath = FileSystemUtils.writeTemplateFile(
						templateName,
						''
					); // Get path only
				}
			}

			// 6. Check if file already exists
			const fileExists = FileSystemUtils.fileExists(outputPath);

			// 7. Handle file overwrite logic
			if (fileExists && !force) {
				const shouldOverwrite = await UserPrompts.promptOverwrite(
					outputPath
				);
				if (!shouldOverwrite) {
					logger.muted('Operation cancelled.');
					return;
				}
			}

			// 8. If force is used and file exists, delete it first for clean overwrite
			if (force && fileExists) {
				FileSystemUtils.deleteFile(outputPath);
				logger.debug(`🗑️ Removed existing file for clean overwrite: ${outputPath}`);
			}

			// 9. Write the file
			if (templateConfig.outputPath) {
				// Custom path - write directly
				FileSystemUtils.writeFile(outputPath, extractedContent);
			} else {
				// Default path - use template file helper
				outputPath = FileSystemUtils.writeTemplateFile(
					templateName,
					extractedContent
				);
			}

			// 10. Success feedback
			logger.success('🎉 Template schema added successfully!');
			logger.info(`📁 Output: ${outputPath}`, { outputPath });
		} catch (error) {
			logger.error('❌ Failed to add template schema', {
				error: error instanceof Error ? error.message : String(error),
			});
			process.exit(1);
		}
	}
}
