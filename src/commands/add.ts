import { Command } from 'commander';
import { logger } from '../logger';
import { TemplateService } from '../lib';

export function addCommand(): Command {
	const command = new Command('add')
		.description('Add a specific template type definition')
		.argument('<name>', 'Name of the template to fetch and add')
		.option('--force', 'Overwrite existing file without prompting', false)
		.option(
			'--no-jsdoc',
			'Disable JSDoc comments in generated types (default: enabled)'
		)
		.option(
			'--jsdoc-examples',
			'Include usage examples in JSDoc comments (default: enabled)'
		)
		.action(async (name, options) => {
			logger.header('🌐 OIP Template Fetcher');

			const templateService = new TemplateService();
			await templateService.addTemplate(name, {
				force: options.force,
				includeJSDoc: !options.noJsdoc, // Use the negated flag properly
				jsDocOptions: {
					includeExamples: options.jsdocExamples !== false,
					includeAuthors: true,
					includeVersion: true,
				},
			});
		});

	return command;
}
