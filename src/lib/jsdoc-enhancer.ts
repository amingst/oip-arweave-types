import { logger } from '../logger';
import { ApiClient, TemplateSchemaResponse } from './api-client';
import * as packageJson from '../../package.json';

export interface JSDocOptions {
	includeExamples?: boolean;
	includeAuthors?: boolean;
	includeVersion?: boolean;
	customTags?: Record<string, string>;
	useSchemaData?: boolean;
}

export interface SchemaFieldInfo {
	description?: string;
	type?: string;
	required?: boolean;
	example?: any;
}

export class JSDocEnhancer {
	private static schemaData: TemplateSchemaResponse | null = null;

	/**
	 * Load schema data from the API for dynamic JSDoc enhancement
	 */
	private static async loadSchemaData(): Promise<void> {
		try {
			const apiClient = new ApiClient();
			this.schemaData = await apiClient.fetchTemplateSchemas();

			if (this.schemaData) {
				logger.success(
					'✅ Loaded template schema data for enhanced JSDoc generation'
				);
			} else {
				logger.warn(
					'⚠️ Failed to load schema data, falling back to static descriptions'
				);
			}
		} catch (error) {
			logger.error('❌ Error loading schema data for JSDoc enhancement', {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Get schema information for a specific template and field
	 */
	private static getSchemaFieldInfo(
		templateName: string,
		fieldName: string
	): SchemaFieldInfo | null {
		if (!this.schemaData) {
			return null;
		}

		const templateSchema = this.schemaData[templateName];
		if (!templateSchema || !templateSchema.properties) {
			return null;
		}

		const fieldSchema = templateSchema.properties[fieldName];
		if (!fieldSchema) {
			return null;
		}

		return {
			description: fieldSchema.description,
			type: fieldSchema.type,
			required: templateSchema.required?.includes(fieldName),
			example: fieldSchema.example,
		};
	}

	/**
	 * Enhance TypeScript interfaces with JSDoc comments
	 */
	static async enhanceWithJSDoc(
		typeScriptContent: string,
		options: JSDocOptions = {}
	): Promise<string> {
		const {
			includeExamples = true,
			includeAuthors = true,
			includeVersion = true,
			customTags = {},
			useSchemaData = true,
		} = options;

		logger.debug('📝 Enhancing TypeScript content with JSDoc comments');

		// Fetch schema data if requested and not already cached
		if (useSchemaData && !this.schemaData) {
			await this.loadSchemaData();
		}

		// Split content into lines for processing
		const lines = typeScriptContent.split('\n');
		const enhancedLines: string[] = [];

		let i = 0;
		while (i < lines.length) {
			const line = lines[i];

			// Check if this line starts an interface
			const interfaceMatch = line.match(/^export interface (\w+)/);

			if (interfaceMatch) {
				const interfaceName = interfaceMatch[1];

				// Add JSDoc comment before the interface
				const jsDocComment = this.generateInterfaceJSDoc(
					interfaceName,
					options
				);

				enhancedLines.push(...jsDocComment);
				enhancedLines.push(line);

				// Process interface body for property comments
				i++;
				while (i < lines.length && !lines[i].includes('}')) {
					const propertyLine = lines[i];
					const propertyComment = this.generatePropertyJSDoc(
						propertyLine,
						interfaceName
					);

					if (propertyComment) {
						enhancedLines.push(propertyComment);
					}
					enhancedLines.push(propertyLine);
					i++;
				}

				// Add the closing brace
				if (i < lines.length) {
					enhancedLines.push(lines[i]);
				}
			} else {
				// Regular line, just add it
				enhancedLines.push(line);
			}

			i++;
		}

		const result = enhancedLines.join('\n');
		logger.debug('✅ JSDoc enhancement completed');

		return result;
	}

	/**
	 * Generate JSDoc comment for an interface
	 */
	private static generateInterfaceJSDoc(
		interfaceName: string,
		options: JSDocOptions
	): string[] {
		const lines: string[] = [];

		lines.push('/**');
		lines.push(` * ${this.generateInterfaceDescription(interfaceName)}`);

		if (options.includeAuthors) {
			lines.push(` * @author ${packageJson.author}`);
		}

		if (options.includeVersion) {
			lines.push(` * @version ${packageJson.version}`);
		}

		// Add custom tags
		Object.entries(options.customTags || {}).forEach(([tag, value]) => {
			lines.push(` * @${tag} ${value}`);
		});

		if (options.includeExamples) {
			const example = this.generateInterfaceExample(interfaceName);
			if (example) {
				lines.push(' * @example');
				lines.push(' * ```typescript');
				lines.push(` * ${example}`);
				lines.push(' * ```');
			}
		}

		lines.push(' */');

		return lines;
	}

	/**
	 * Generate JSDoc comment for a property line
	 */
	private static generatePropertyJSDoc(
		propertyLine: string,
		interfaceName?: string
	): string | null {
		// Check if this is a property line
		const propertyMatch = propertyLine.match(/^\s+(\w+)(\??):\s*([^;]+);?/);

		if (!propertyMatch) {
			return null;
		}

		const [, propertyName, isOptional, propertyType] = propertyMatch;
		const description = this.generatePropertyDescription(
			propertyName,
			propertyType,
			!!isOptional,
			interfaceName
		);

		const indent = propertyLine.match(/^(\s+)/)?.[1] || '\t';

		return `${indent}/** ${description} */`;
	}

	/**
	 * Generate a meaningful description for an interface
	 */
	private static generateInterfaceDescription(interfaceName: string): string {
		// Try to get schema description first
		if (this.schemaData && this.schemaData[interfaceName]) {
			const schemaInfo = this.schemaData[interfaceName];
			if (schemaInfo.description) {
				return schemaInfo.description;
			}
		}

		// Fallback to static descriptions
		// Map common interface names to descriptions
		const descriptions: Record<string, string> = {
			Album: 'Represents a music album with metadata information',
			Artwork: 'Represents an artwork piece with descriptive metadata',
			Audio: 'Represents an audio file with metadata and technical information',
			Video: 'Represents a video file with metadata and technical specifications',
			Image: 'Represents an image file with metadata and technical details',
			Text: 'Represents a text document with metadata and content information',
			Basic: 'Basic OIP template with fundamental metadata fields',
			Person: 'Represents a person entity with biographical information',
			Podcast:
				'Represents a podcast episode with metadata and technical details',
			PodcastShow: 'Represents a podcast show with series-level metadata',
			Recipe: 'Represents a cooking recipe with ingredients and instructions',
			Workout: 'Represents a fitness workout with exercises and metadata',
			Exercise:
				'Represents a single exercise with instructions and metadata',
			Post: 'Represents a social media or blog post with content and metadata',
			NutritionalInfo:
				'Represents nutritional information for food items',
			CreatorRegistration:
				'Represents creator registration information for OIP',
		};

		return (
			descriptions[interfaceName] ||
			`Represents a ${interfaceName} entity from OIP Arweave templates`
		);
	}

	/**
	 * Generate a meaningful description for a property
	 */
	private static generatePropertyDescription(
		propertyName: string,
		propertyType: string,
		isOptional: boolean,
		interfaceName?: string
	): string {
		// Try to get schema information first
		if (interfaceName) {
			const schemaInfo = this.getSchemaFieldInfo(
				interfaceName,
				propertyName
			);
			if (schemaInfo && schemaInfo.description) {
				let description = schemaInfo.description;

				// Add optional marker if needed
				if (isOptional) {
					description += ' - Optional field';
				}

				return description;
			}
		}

		// Fallback to static descriptions
		// Clean up the property type
		const cleanType = propertyType.trim().replace(/\s+/g, ' ');

		// Generate description based on property name patterns
		const descriptions: Record<string, string> = {
			title: 'The title or name',
			name: 'The name identifier',
			description: 'A detailed description',
			artist: 'The artist or creator name',
			author: 'The author or creator',
			year: 'The year of creation or publication',
			date: 'The date information',
			type: 'The type or category',
			category: 'The category classification',
			tags: 'Associated tags or keywords',
			url: 'The URL or web address',
			duration: 'The duration in seconds or specified units',
			size: 'The file size or dimensions',
			format: 'The file format or type',
			version: 'The version number or identifier',
			id: 'The unique identifier',
			email: 'The email address',
			phone: 'The phone number',
			address: 'The physical address',
			price: 'The price or cost',
			currency: 'The currency type',
			language: 'The language code or name',
			country: 'The country name or code',
			license: 'The license information',
			copyright: 'The copyright information',
			thumbnail: 'The thumbnail image URL or data',
			preview: 'The preview content or URL',
		};

		// Try to find a matching description
		let description = descriptions[propertyName.toLowerCase()];

		if (!description) {
			// Generate description based on property name
			const humanReadable = propertyName
				.replace(/([A-Z])/g, ' $1')
				.toLowerCase()
				.trim();
			description = `The ${humanReadable}`;
		}

		// Add type information
		const typeInfo = this.getTypeDescription(cleanType);
		if (typeInfo) {
			description += ` (${typeInfo})`;
		}

		// Add optional marker
		if (isOptional) {
			description += ' - Optional field';
		}

		return description;
	}

	/**
	 * Get a human-readable description for a TypeScript type
	 */
	private static getTypeDescription(type: string): string | null {
		if (type.includes('[]')) {
			return 'array';
		}
		if (type.includes('|')) {
			return 'union type';
		}
		if (type === 'string') {
			return 'text';
		}
		if (type === 'number') {
			return 'numeric';
		}
		if (type === 'boolean') {
			return 'true/false';
		}
		if (type === 'Date') {
			return 'date object';
		}

		return null;
	}

	/**
	 * Generate an example for an interface
	 */
	private static generateInterfaceExample(
		interfaceName: string
	): string | null {
		const examples: Record<string, string> = {
			Album: `const album: Album = {
  albumTitle: "My Album",
  artist: "Artist Name",
  year: 2024
};`,
			Audio: `const audio: Audio = {
  title: "My Song",
  artist: "Artist Name",
  duration: 180
};`,
			Video: `const video: Video = {
  title: "My Video",
  duration: 300,
  format: "mp4"
};`,
			Basic: `const basic: Basic = {
  title: "My Content",
  description: "Content description"
};`,
		};

		return examples[interfaceName] || null;
	}
}
