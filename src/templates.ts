import * as fs from 'fs';
import * as path from 'path';
import SchemaTypeGenerator from './SchemaTypeGenerator';

export async function fetchOipTemplates(outputPath?: string): Promise<void> {
	console.log(
		'Fetching templates from API: https://api.oip.onl/api/templates'
	);

	try {
		const response = await fetch('https://api.oip.onl/api/templates');

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: ApiResponse = (await response.json()) as ApiResponse;

		const generator = new SchemaTypeGenerator();
		const typeScriptContent = generator.generateTypeScriptFile(data);

		// Default output path logic
		let finalOutputPath: string;
		if (outputPath) {
			finalOutputPath = path.resolve(outputPath);
		} else {
			// Default to oip folder in project root
			const projectRoot = path.resolve(__dirname, '..');
			const oipDir = path.join(projectRoot, 'oip');

			// Create oip directory if it doesn't exist
			if (!fs.existsSync(oipDir)) {
				fs.mkdirSync(oipDir, { recursive: true });
			}

			finalOutputPath = path.join(oipDir, 'generated-types.ts');
		}

		fs.writeFileSync(finalOutputPath, typeScriptContent);

		console.log(`TypeScript types generated at: ${finalOutputPath}`);
	} catch (error) {
		console.error('Failed to fetch templates from API:', error);
		console.log('Falling back to local templates.json file...');

		// Fallback to local file
		const localPath = path.resolve(__dirname, '../json/templates.json');
		if (fs.existsSync(localPath)) {
			parseOipTemplates(localPath, outputPath);
		} else {
			console.error('Local templates.json file not found either.');
			process.exit(1);
		}
	}
}

export function parseOipTemplates(
	jsonFilePath: string,
	outputPath?: string
): void {
	const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
	const data: ApiResponse = JSON.parse(jsonContent);

	const generator = new SchemaTypeGenerator();
	const typeScriptContent = generator.generateTypeScriptFile(data);

	// Default output path logic
	let finalOutputPath: string;
	if (outputPath) {
		finalOutputPath = path.resolve(outputPath);
	} else {
		// Default to types folder in project root
		const projectRoot = path.resolve(__dirname, '..');
		const typesDir = path.join(projectRoot, 'types');

		// Create types directory if it doesn't exist
		if (!fs.existsSync(typesDir)) {
			fs.mkdirSync(typesDir, { recursive: true });
		}

		finalOutputPath = path.join(typesDir, 'generated-types.ts');
	}

	fs.writeFileSync(finalOutputPath, typeScriptContent);

	console.log(`TypeScript types generated at: ${finalOutputPath}`);
}
