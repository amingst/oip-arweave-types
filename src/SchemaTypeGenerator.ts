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

	public parseTemplates(jsonData: ApiResponse): string[] {
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

	public generateTypeScriptFile(jsonData: ApiResponse): string {
		const interfaces = this.parseTemplates(jsonData);

		const header = `// Auto-generated TypeScript types from OIP Arweave templates
// Generated on ${new Date().toISOString()}

`;

		return header + interfaces.join('\n\n') + '\n';
	}
}

export default SchemaTypeGenerator;
