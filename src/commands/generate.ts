import { Command } from 'commander';
import { fetchOipTemplates } from '../templates';
import { logger } from '../logger';

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

			await fetchOipTemplates({
				output: options.output,
				singleFile: options.singleFile,
			});
		});
}
