import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import SchemaTypeGenerator from './SchemaTypeGenerator';

export async function fetchOipTemplates(outputPath?: string): Promise<void> {
	console.log(chalk.cyan('🚀 Fetching templates from OIP API...'));
	console.log(chalk.gray('   https://api.oip.onl/api/templates'));

	try {
		const response = await fetch('https://api.oip.onl/api/templates');

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		console.log(chalk.green('✅ Successfully fetched templates'));

		const data: ApiResponse = (await response.json()) as ApiResponse;

		console.log(
			chalk.blue(`📦 Processing ${data.templates.length} templates...`)
		);

		const generator = new SchemaTypeGenerator();
		const typeScriptContent = generator.generateTypeScriptFile(data);
		const interfaces = generator.parseTemplates(data);

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

		console.log(chalk.green('🎉 TypeScript types generated successfully!'));
		console.log(chalk.cyan(`📁 Output: ${finalOutputPath}`));
		console.log(
			chalk.yellow(`🔧 Generated ${interfaces.length} interfaces`)
		);

		// Show some stats
		const fileSize = fs.statSync(finalOutputPath).size;
		const fileSizeKB = (fileSize / 1024).toFixed(2);
		console.log(chalk.gray(`📊 File size: ${fileSizeKB} KB`));
	} catch (error) {
		console.log(chalk.red('❌ Failed to fetch templates from API'));
		console.log(
			chalk.red(
				`� Error: ${
					error instanceof Error ? error.message : String(error)
				}`
			)
		);
		console.log(
			chalk.yellow(
				'🌐 Please check your internet connection and try again.'
			)
		);
		console.log(
			chalk.gray(
				'   If the issue persists, the API may be temporarily unavailable.'
			)
		);
		process.exit(1);
	}
}
