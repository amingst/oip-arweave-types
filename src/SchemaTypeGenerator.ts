class SchemaTypeGenerator {
	private mapOipTypeToTypeScript(oipType: string): string {
		const typeMapping: Record<string, string> = {
			string: 'string',
			dref: 'string', // Data reference - DID string format (did:arweave:$transactionId)
			'repeated string': 'string[]',
			'repeated dref': 'string[]',
			number: 'number',
			integer: 'number',
			uint64: 'number',
			long: 'number',
			float: 'number',
			'repeated float': 'number[]',
			'repeated uint64': 'number[]',
			boolean: 'boolean',
			bool: 'boolean',
			enum: 'string', // Enums will be handled specially
		};

		return typeMapping[oipType] || 'unknown';
	}

	private generateInterface(
		interfaceName: string,
		fields: Record<string, FieldDefinition>
	): string {
		const fieldLines: string[] = [];

		// Sort fields by index to maintain consistent ordering
		const sortedFields = Object.entries(fields).sort(
			([, a], [, b]) => a.index - b.index
		);

		for (const [fieldName, fieldDef] of sortedFields) {
			const tsType = this.mapOipTypeToTypeScript(fieldDef.type);
			fieldLines.push(`  ${fieldName}: ${tsType};`);
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
			let interfaceName = this.toPascalCase(templateName);
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
					interfaceName = `${interfaceName}V${count + 1}`;
				}
			}

			const interfaceDefinition = this.generateInterface(
				interfaceName,
				fieldsInTemplate
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
			let interfaceName = this.toPascalCase(templateName);
			if (duplicateCount.has(templateName)) {
				const count = duplicateCount.get(templateName)! + 1;
				duplicateCount.set(templateName, count);
				interfaceName = `${interfaceName}V${count}`;
			} else {
				duplicateCount.set(templateName, 1);
			}

			const interfaceDefinition = this.generateInterface(
				interfaceName,
				fieldsInTemplate
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

		const header = `// Auto-generated TypeScript types from OIP Arweave templates
// Generated on ${new Date().toISOString()}

`;

		return header + interfaces.join('\n\n') + '\n';
	}
}

export default SchemaTypeGenerator;
