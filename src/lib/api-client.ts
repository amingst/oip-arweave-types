import { logger } from '../logger';

export interface TemplateResponse {
	typeScript: string;
}

export interface TemplateSchemaResponse {
	[templateName: string]: {
		title?: string;
		description?: string;
		version?: string;
		properties?: {
			[fieldName: string]: {
				type: string;
				description?: string;
				required?: boolean;
				enum?: any[];
				items?: any;
				example?: any;
			};
		};
		required?: string[];
	};
}

export class ApiClient {
	private readonly baseUrl: string;

	constructor(apiRoot: string = 'https://api.oip.onl/api/templates') {
		this.baseUrl = apiRoot;
	}

	async fetchAllTemplates(): Promise<string> {
		const apiUrl = `${this.baseUrl}?typeScriptTypes=true`;

		logger.info('🚀 Fetching templates from OIP API...', {
			apiUrl: this.baseUrl,
		});

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
				apiUrl: this.baseUrl,
			});
			logger.warn(
				'🌐 Please check your internet connection and API configuration'
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
				apiUrl: this.baseUrl,
			});

			const response = await fetch(apiUrl);

			if (!response.ok) {
				if (response.status === 404) {
					logger.error(`❌ Template "${templateName}" not found`, {
						templateName,
						status: response.status,
						apiUrl: this.baseUrl,
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
					apiUrl: this.baseUrl,
				}
			);
			return null;
		}
	}

	async fetchTemplateSchemas(): Promise<TemplateSchemaResponse | null> {
		const apiUrl = `${this.baseUrl}`;

		logger.info('🔍 Fetching template schemas for JSDoc enhancement...', {
			apiUrl: this.baseUrl,
		});

		try {
			const response = await fetch(apiUrl);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Transform the API response to our schema format
			const schemas: TemplateSchemaResponse = {};

			if (data.templates && Array.isArray(data.templates)) {
				for (const template of data.templates) {
					if (
						template.data &&
						template.data.template &&
						template.data.fieldsInTemplate
					) {
						const templateName = template.data.template;
						const fields = template.data.fieldsInTemplate;

						schemas[templateName] = {
							title: templateName,
							description: `${
								templateName.charAt(0).toUpperCase() +
								templateName.slice(1)
							} template from OIP`,
							properties: {},
						};

						// Convert field metadata to our format
						for (const [fieldName, fieldInfo] of Object.entries(
							fields
						)) {
							if (
								typeof fieldInfo === 'object' &&
								fieldInfo !== null &&
								'type' in fieldInfo
							) {
								const info = fieldInfo as any;
								schemas[templateName].properties![fieldName] = {
									type: info.type,
									description:
										info.description ||
										this.generateFieldDescription(
											fieldName,
											info.type
										),
									example: info.example,
								};
							}
						}
					}
				}
			}

			logger.success(
				'✅ Successfully fetched and transformed template schemas'
			);

			return schemas;
		} catch (error) {
			logger.error('❌ Failed to fetch template schemas', {
				error: error instanceof Error ? error.message : String(error),
				apiUrl: this.baseUrl,
			});
			return null;
		}
	}

	/**
	 * Generate a description for a field based on its name and type
	 */
	private generateFieldDescription(
		fieldName: string,
		fieldType: string
	): string {
		const descriptions: Record<string, string> = {
			name: 'The name or identifier',
			title: 'The title of the item',
			description: 'A detailed description',
			date: 'The date timestamp',
			language: 'The language specification',
			avatar: 'The avatar image reference',
			license: 'The license information',
			nsfw: 'Not Safe For Work flag',
			webUrl: 'The web URL address',
			duration: 'The duration in specified units',
			size: 'The file size',
			width: 'The width dimension',
			height: 'The height dimension',
			filename: 'The filename',
			contentType: 'The MIME content type',
			creator: 'The creator information',
			artist: 'The artist name',
			author: 'The author information',
			instructions: 'Step-by-step instructions',
			notes: 'Additional notes or comments',
		};

		const baseDescription =
			descriptions[fieldName] ||
			`The ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}`;

		// Add type information
		if (fieldType.includes('repeated')) {
			return `${baseDescription} (array)`;
		} else if (fieldType === 'bool' || fieldType === 'boolean') {
			return `${baseDescription} (boolean)`;
		} else if (
			fieldType.includes('int') ||
			fieldType === 'long' ||
			fieldType === 'float'
		) {
			return `${baseDescription} (numeric)`;
		} else if (fieldType === 'enum') {
			return `${baseDescription} (enumerated value)`;
		} else if (fieldType === 'dref') {
			return `${baseDescription} (data reference)`;
		}

		return `${baseDescription} (${fieldType})`;
	}
}
