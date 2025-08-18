#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import commands from './commands';

const program = new Command();

program
	.name('oip-arweave-types')
	.description(
		chalk.blue.bold('🌐 OIP Arweave Type Generator\n') +
			chalk.gray('Generate TypeScript types from OIP Arweave templates')
	)
	.version('0.0.1');

// Add commands
commands.forEach((command) => program.addCommand(command));

program.parse();
