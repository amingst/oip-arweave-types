import { logger } from '../logger';

export interface TemplateResponse {
	typeScript: string;
}

export class ApiClient {
	private readonly baseUrl = 'https://api.oip.onl/api/templates';

	async fetchAllTemplates(): Promise<string> {
		const apiUrl = `${this.baseUrl}?typeScriptTypes=true`;

		logger.info('🚀 Fetching templates from OIP API...');

		try {
			const response = await fetch(apiUrl);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			logger.success('✅ Successfully fetched templates');

			const data: TemplateResponse = await response.json();

			if (!data.typeScript) {
				throw new Error('API response missing TypeScript content');
			}

			return data.typeScript;
		} catch (error) {
			logger.error('❌ Failed to fetch templates from API', {
				error: error instanceof Error ? error.message : String(error),
			});
			logger.warn(
				'🌐 Please check your internet connection and try again.'
			);
			throw error;
		}
	}

	async fetchTemplate(templateName: string): Promise<string | null> {
		const apiUrl = `${
			this.baseUrl
		}?typeScriptTypes=true&template=${encodeURIComponent(templateName)}`;

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

			const data: TemplateResponse = await response.json();

			if (!data.typeScript) {
				throw new Error('API response missing TypeScript content');
			}

			logger.success(
				`✅ Successfully fetched schema for "${templateName}"`,
				{
					templateName,
				}
			);
			return data.typeScript;
		} catch (error) {
			logger.error(
				`❌ Failed to fetch template schema for "${templateName}"`,
				{
					templateName,
					error:
						error instanceof Error ? error.message : String(error),
				}
			);
			return null;
		}
	}
}
