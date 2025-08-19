import { Command } from 'commander';
import { logger } from '../logger';
import { TypeGenerator } from '../lib';

export function generateCommand(): Command {
	return new Command('generate')
		.description('Generate TypeScript types from API templates')
		.option(
			'-o, --output <path>',
			'Output directory or file path for generated types'
		)
		.option(
			'--single-file',
			'Generate all types in a single file (default: from config or separate files)'
		)
		.option(
			'--no-jsdoc',
			'Disable JSDoc comments in generated types (default: enabled)'
		)
		.option(
			'--jsdoc-examples',
			'Include usage examples in JSDoc comments (default: enabled)'
		)
		.action(async (options) => {
			logger.header('🌐 OIP Arweave Type Generator');

			const generator = new TypeGenerator();
			await generator.generateTypes({
				output: options.output,
				singleFile: options.singleFile,
				includeJSDoc: !options.noJsdoc, // Use the negated flag properly
				jsDocOptions: {
					includeExamples: options.jsdocExamples !== false,
					includeAuthors: true,
					includeVersion: true,
				},
			});
		});
}
