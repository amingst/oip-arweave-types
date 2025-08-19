import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { logger } from '../logger';

export class FileSystemUtils {
	static ensureDirectoryExists(dirPath: string): void {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
		}
	}

	static writeFile(filePath: string, content: string): void {
		const dir = path.dirname(filePath);
		this.ensureDirectoryExists(dir);
		fs.writeFileSync(filePath, content);
	}

	static fileExists(filePath: string): boolean {
		return fs.existsSync(filePath);
	}

	static deleteFile(filePath: string): void {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}

	static getFileSize(filePath: string): number {
		return fs.statSync(filePath).size;
	}

	static checkTemplateFileExists(templateName: string): string | null {
		const oipDir = path.join(process.cwd(), 'oip');
		const filePath = path.join(oipDir, `${templateName}.ts`);

		if (this.fileExists(filePath)) {
			return filePath;
		}

		return null;
	}

	static writeTemplateFile(templateName: string, content: string): string {
		const oipDir = path.join(process.cwd(), 'oip');
		this.ensureDirectoryExists(oipDir);

		const filePath = path.join(oipDir, `${templateName}.ts`);
		this.writeFile(filePath, content);

		return filePath;
	}
}

export class UserPrompts {
	static async promptOverwrite(filePath: string): Promise<boolean> {
		const readline = require('readline');
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		return new Promise((resolve) => {
			logger.warn(`⚠️  File already exists: ${filePath}`, { filePath });
			rl.question(
				chalk.cyan('Do you want to overwrite it? (y/N): '),
				(answer: string) => {
					rl.close();
					const shouldOverwrite =
						answer.toLowerCase() === 'y' ||
						answer.toLowerCase() === 'yes';
					resolve(shouldOverwrite);
				}
			);
		});
	}
}
