import { ApiClient } from './api-client';
import { FileSystemUtils, UserPrompts } from './file-utils';
import { TemplateExtractor } from './template-extractor';
import { logger } from '../logger';

export class TemplateService {
	private apiClient = new ApiClient();

	async addTemplate(
		templateName: string,
		options: { force?: boolean } = {}
	): Promise<void> {
		try {
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

			// 4. Check if file already exists
			const existingFile =
				FileSystemUtils.checkTemplateFileExists(templateName);

			// 5. Handle file overwrite logic
			if (existingFile && !options.force) {
				const shouldOverwrite = await UserPrompts.promptOverwrite(
					existingFile
				);
				if (!shouldOverwrite) {
					logger.muted('Operation cancelled.');
					return;
				}
			}

			// 6. Write the file
			const outputPath = FileSystemUtils.writeTemplateFile(
				templateName,
				extractedContent
			);

			// 7. Success feedback
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
