import * as path from 'path';
import { ApiClient } from './api-client';
import { FileSystemUtils, UserPrompts } from './file-utils';
import { TemplateExtractor } from './template-extractor';
import { ConfigManager, ResolvedConfig } from './config';
import { logger } from '../logger';

export class TemplateService {
	private config: ResolvedConfig;
	private apiClient: ApiClient;

	constructor(config?: ResolvedConfig) {
		this.config = config || ConfigManager.loadConfig();
		this.apiClient = new ApiClient(this.config.apiRoot);
	}

	async addTemplate(
		templateName: string,
		options: { force?: boolean } = {}
	): Promise<void> {
		try {
			// Check for template-specific config overrides
			const templateConfig = this.config.templates[templateName] || {};
			const force = options.force ?? templateConfig.force ?? false;

			// 1. Fetch the schema from API
			const fullContent = await this.apiClient.fetchTemplate(
				templateName
			);
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
			const extractedContent = TemplateExtractor.extractTemplateContent(
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

			// 4. Determine output path - use template-specific config if available
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

			// 5. Check if file already exists
			const fileExists = FileSystemUtils.fileExists(outputPath);

			// 6. Handle file overwrite logic
			if (fileExists && !force) {
				const shouldOverwrite = await UserPrompts.promptOverwrite(
					outputPath
				);
				if (!shouldOverwrite) {
					logger.muted('Operation cancelled.');
					return;
				}
			}

			// 7. Write the file
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

			// 8. Success feedback
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
