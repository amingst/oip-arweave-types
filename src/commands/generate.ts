import { Command } from 'commander';
import chalk from 'chalk';
import { fetchOipTemplates } from '../templates';

export function createGenerateCommand(): Command {
	return new Command('generate')
		.description('Generate TypeScript types from API templates')
		.option(
			'-o, --output <path>',
			'Output path for generated types',
			'oip/generated-types.ts'
		)
		.option(
			'--keep-versions',
			'Keep all template versions (creates versioned interfaces)',
			false
		)
		.action(async (options) => {
			console.log(chalk.blue.bold('🌐 OIP Arweave Type Generator'));

			await fetchOipTemplates(options.output, options.keepVersions);
		});
}
