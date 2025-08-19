import { Command } from 'commander';
import { logger } from '../logger';
import { TypeGenerator } from '../lib';

export function generateCommand(): Command {
	return new Command('generate')
		.description('Generate TypeScript types from API templates')
		.option(
			'-o, --output <path>',
			'Output directory or file path for generated types',
			'oip'
		)
		.option(
			'--single-file',
			'Generate all types in a single file (default: separate files)',
			false
		)
		.action(async (options) => {
			logger.header('🌐 OIP Arweave Type Generator');

			const generator = new TypeGenerator();
			await generator.generateTypes({
				output: options.output,
				singleFile: options.singleFile,
			});
		});
}
