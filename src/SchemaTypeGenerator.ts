/// <reference path="./index.d.ts" />
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

class SchemaTypeGenerator {
	// Field name to template type mapping for drefs
	private getDrefTemplateType(fieldName: string): string | null {
		const drefMapping: Record<string, string> = {
			// Text content
			articleText: 'TextTemplate',
			transcript: 'TextTemplate',
			chapters: 'TextTemplate',
			instructions: 'TextTemplate',

			// Images
			featuredImage: 'ImageTemplate',
			avatar: 'ImageTemplate',
			podcastArtwork: 'ImageTemplate',
			thumbnails: 'ImageTemplate',
			episodeArtwork: 'ImageTemplate',

			// Audio/Video content
			audioItems: 'AudioTemplate',
			videoItems: 'VideoTemplate',
			imageItems: 'ImageTemplate',

			// Self-references and other templates
			replyTo: 'PostTemplate',
			authorDRef: 'CreatorRegistrationTemplate',
			exercise: 'ExerciseTemplate',
		};

		return drefMapping[fieldName] || null;
	}

	// Field name to creator reference mapping
	private isCreatorField(fieldName: string): boolean {
		const creatorFields = ['creator'];
		return creatorFields.includes(fieldName);
	}

	// Read all type definition files from src/types directory
	private readTypeDefinitions(): string {
		try {
			// Navigate from dist/ back to src/types/
			const typesDir = join(__dirname, '..', 'src', 'types');
			const files = readdirSync(typesDir);
			const typeDefinitions: string[] = [];

			for (const file of files) {
				if (extname(file) === '.ts') {
					const filePath = join(typesDir, file);
					const content = readFileSync(filePath, 'utf-8');
					typeDefinitions.push(content.trim());
				}
			}

			return typeDefinitions.length > 0
				? typeDefinitions.join('\n\n') + '\n\n'
				: '';
		} catch (error) {
			// If types directory doesn't exist or can't be read, return empty string
			return '';
		}
	}

	private mapOipTypeToTypeScript(
		oipType: string,
		enumValues?: any[],
		fieldName?: string
	): string {
		// Handle creator fields (string type fields that should use CreatorReference)
		if (
			fieldName &&
			this.isCreatorField(fieldName) &&
			oipType === 'string'
		) {
			return 'CreatorReference';
		}

		// Handle special dref types first
		if (oipType === 'dref' || oipType === 'repeated dref') {
			// Check for template type mappings
			const templateType = fieldName
				? this.getDrefTemplateType(fieldName)
				: null;
			const baseType = templateType
				? `string | ${templateType}`
				: 'string';
			return oipType === 'repeated dref' ? `(${baseType})[]` : baseType;
		}

		const typeMapping: Record<string, string> = {
			string: 'string',
			'repeated string': 'string[]',
			number: 'number',
			integer: 'number',
			uint64: 'number',
			uint32: 'number',
			long: 'number',
			float: 'number',
			'repeated float': 'number[]',
			'repeated uint64': 'number[]',
			'repeated uint32': 'number[]',
			boolean: 'boolean',
			bool: 'boolean',
			enum: 'string', // Enums will be handled specially
		};

		// If we have enum values, create a union type
		if (enumValues && enumValues.length > 0) {
			// Handle both simple strings and objects with code property
			const values = enumValues.map((val) => {
				if (typeof val === 'string') {
					return `"${val}"`;
				} else if (val && typeof val === 'object' && val.code) {
					return `"${val.code}"`;
				}
				return `"${String(val)}"`;
			});
			return values.join(' | ');
		}

		return typeMapping[oipType] || 'unknown';
	}

	private generateInterface(
		interfaceName: string,
		fields: Record<string, FieldDefinition>,
		templateData: any
	): string {
		const fieldLines: string[] = [];

		// Sort fields by index to maintain consistent ordering
		const sortedFields = Object.entries(fields).sort(
			([, a], [, b]) => a.index - b.index
		);

		for (const [fieldName, fieldDef] of sortedFields) {
			// Check for corresponding typeValues - pattern is fieldName + "Values"
			const enumKey = `${fieldName}Values`;
			const enumValues = templateData[enumKey];

			const tsType = this.mapOipTypeToTypeScript(
				fieldDef.type,
				enumValues,
				fieldName
			);
			const optional = fieldDef.required === false ? '?' : '';
			fieldLines.push(`  ${fieldName}${optional}: ${tsType};`);
		}

		return `export interface ${interfaceName} {
${fieldLines.join('\n')}
}`;
	}

	private toPascalCase(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	public parseTemplates(
		jsonData: ApiResponse,
		keepVersions: boolean = false
	): string[] {
		if (keepVersions) {
			return this.parseTemplatesWithVersions(jsonData);
		} else {
			return this.parseTemplatesLatestOnly(jsonData);
		}
	}

	private parseTemplatesLatestOnly(jsonData: ApiResponse): string[] {
		const interfaces: string[] = [];
		const templateMap = new Map<
			string,
			{
				template: any;
				fieldsHash: string;
				blockNumber: number;
			}
		>();

		// First pass: collect all templates and keep only the most recent version
		for (const template of jsonData.templates) {
			const { template: templateName, fieldsInTemplate } = template.data;
			const blockNumber = template.oip.inArweaveBlock;

			// Generate a hash of the fields to detect different versions
			const fieldsHash = JSON.stringify(fieldsInTemplate);
			const templateKey = templateName;

			// Check if we already have this template name
			const existing = templateMap.get(templateKey);

			if (!existing || blockNumber > existing.blockNumber) {
				// Keep this version if it's newer or if we don't have this template yet
				templateMap.set(templateKey, {
					template,
					fieldsHash,
					blockNumber,
				});
			}
		}

		// Second pass: generate interfaces from the most recent versions
		const duplicateCount = new Map<string, number>();

		for (const [templateName, templateInfo] of templateMap) {
			const { template, fieldsHash } = templateInfo;
			const { fieldsInTemplate } = template.data;

			// Handle different field structures for the same template name
			let interfaceName = `${this.toPascalCase(templateName)}Template`;
			const existingWithSameFields = Array.from(
				templateMap.values()
			).filter((t) => t !== templateInfo && t.fieldsHash === fieldsHash);

			if (existingWithSameFields.length > 0) {
				// Multiple templates with same field structure, use base name
				// (we already filtered to most recent in first pass)
			} else {
				// Check if we have different field structures for same template name
				const sameNameDifferentFields = Array.from(
					templateMap.entries()
				).filter(
					([name, info]) =>
						name === templateName && info.fieldsHash !== fieldsHash
				);

				if (sameNameDifferentFields.length > 0) {
					// Version this one since it has different field structure
					const count = duplicateCount.get(templateName) || 1;
					duplicateCount.set(templateName, count + 1);
					interfaceName = `${this.toPascalCase(
						templateName
					)}TemplateV${count + 1}`;
				}
			}

			const interfaceDefinition = this.generateInterface(
				interfaceName,
				fieldsInTemplate,
				template.data
			);
			interfaces.push(interfaceDefinition);
		}

		return interfaces;
	}

	private parseTemplatesWithVersions(jsonData: ApiResponse): string[] {
		const interfaces: string[] = [];
		const seenTemplates = new Set<string>();
		const duplicateCount = new Map<string, number>();

		for (const template of jsonData.templates) {
			const { template: templateName, fieldsInTemplate } = template.data;

			// Generate a hash of the fields to detect true duplicates vs different versions
			const fieldsHash = JSON.stringify(fieldsInTemplate);
			const templateKey = `${templateName}:${fieldsHash}`;

			if (seenTemplates.has(templateKey)) {
				// Skip exact duplicates
				continue;
			}

			seenTemplates.add(templateKey);

			// Handle different versions of the same template name
			let interfaceName = `${this.toPascalCase(templateName)}Template`;
			if (duplicateCount.has(templateName)) {
				const count = duplicateCount.get(templateName)! + 1;
				duplicateCount.set(templateName, count);
				interfaceName = `${this.toPascalCase(
					templateName
				)}TemplateV${count}`;
			} else {
				duplicateCount.set(templateName, 1);
			}

			const interfaceDefinition = this.generateInterface(
				interfaceName,
				fieldsInTemplate,
				template.data
			);
			interfaces.push(interfaceDefinition);
		}

		return interfaces;
	}

	public generateTypeScriptFile(
		jsonData: ApiResponse,
		keepVersions: boolean = false
	): string {
		const interfaces = this.parseTemplates(jsonData, keepVersions);
		const typeDefinitions = this.readTypeDefinitions();

		const header = `// Auto-generated TypeScript types from OIP Arweave templates
// Generated on ${new Date().toISOString()}

`;

		return header + typeDefinitions + interfaces.join('\n\n') + '\n';
	}
}

export default SchemaTypeGenerator;
