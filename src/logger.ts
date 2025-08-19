import chalk from 'chalk';

// Simple CLI logger focused on chalk-styled console output
export class Logger {
	// Info level - general information (cyan)
	info(message: string, data?: any): void {
		console.log(chalk.cyan(message));
		if (data && process.env.DEBUG) {
			console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
		}
	}

	// Success level - successful operations (green)
	success(message: string, data?: any): void {
		console.log(chalk.green(message));
		if (data && process.env.DEBUG) {
			console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
		}
	}

	// Warning level - warnings (yellow)
	warn(message: string, data?: any): void {
		console.log(chalk.yellow(message));
		if (data && process.env.DEBUG) {
			console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
		}
	}

	// Error level - errors (red)
	error(message: string, data?: any): void {
		console.log(chalk.red(message));
		if (data && process.env.DEBUG) {
			console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
		}
	}

	// Debug level - debug information (gray)
	debug(message: string, data?: any): void {
		if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
			console.log(chalk.gray(message));
			if (data) {
				console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
			}
		}
	}

	// Header level - prominent headers (blue bold)
	header(message: string, data?: any): void {
		console.log(chalk.blue.bold(message));
		if (data && process.env.DEBUG) {
			console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
		}
	}

	// Muted level - less important info (gray)
	muted(message: string, data?: any): void {
		console.log(chalk.gray(message));
		if (data && process.env.DEBUG) {
			console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
		}
	}
}

// Create singleton instance
export const logger = new Logger();
