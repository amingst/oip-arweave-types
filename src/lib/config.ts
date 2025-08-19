import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';

export interface OipConfig {
	apiRoot?: string;
	outputDir?: string;
	defaultSingleFile?: boolean;
	templates?: {
		[templateName: string]: {
			outputPath?: string;
			force?: boolean;
		};
	};
}

export interface ResolvedConfig {
	apiRoot: string;
	outputDir: string;
	defaultSingleFile: boolean;
	templates: Record<string, { outputPath?: string; force?: boolean }>;
}

export class ConfigManager {
	private static readonly CONFIG_FILENAMES = [
		'oip.config.json',
		'oip.config.js',
		'.oiprc',
		'.oiprc.json',
	];

	private static readonly DEFAULT_CONFIG: ResolvedConfig = {
		apiRoot: 'https://api.oip.onl/api/templates',
		outputDir: 'oip',
		defaultSingleFile: false,
		templates: {},
	};

	static loadConfig(cwd: string = process.cwd()): ResolvedConfig {
		const configPath = this.findConfigFile(cwd);

		if (!configPath) {
			logger.debug('No config file found, using defaults');
			return { ...this.DEFAULT_CONFIG };
		}

		try {
			logger.debug(`Loading config from: ${configPath}`);
			const userConfig = this.parseConfigFile(configPath);
			const resolved = this.mergeWithDefaults(userConfig);

			logger.info(
				`📋 Loaded configuration from ${path.basename(configPath)}`
			);
			return resolved;
		} catch (error) {
			logger.warn(`⚠️  Failed to load config file ${configPath}`, {
				error: error instanceof Error ? error.message : String(error),
			});
			logger.warn('Using default configuration');
			return { ...this.DEFAULT_CONFIG };
		}
	}

	private static findConfigFile(cwd: string): string | null {
		for (const filename of this.CONFIG_FILENAMES) {
			const filepath = path.join(cwd, filename);
			if (fs.existsSync(filepath)) {
				return filepath;
			}
		}
		return null;
	}

	private static parseConfigFile(configPath: string): OipConfig {
		const ext = path.extname(configPath);
		const content = fs.readFileSync(configPath, 'utf8');

		if (ext === '.js') {
			// For .js files, we need to evaluate them
			// Note: This is potentially unsafe, but common for config files
			const tempPath = path.join(
				path.dirname(configPath),
				`temp_${Date.now()}.js`
			);
			fs.writeFileSync(tempPath, content);

			try {
				delete require.cache[require.resolve(tempPath)];
				const config = require(tempPath);
				return config.default || config;
			} finally {
				fs.unlinkSync(tempPath);
			}
		} else {
			// For JSON files
			return JSON.parse(content);
		}
	}

	private static mergeWithDefaults(userConfig: OipConfig): ResolvedConfig {
		return {
			apiRoot: userConfig.apiRoot || this.DEFAULT_CONFIG.apiRoot,
			outputDir: userConfig.outputDir || this.DEFAULT_CONFIG.outputDir,
			defaultSingleFile:
				userConfig.defaultSingleFile ??
				this.DEFAULT_CONFIG.defaultSingleFile,
			templates: userConfig.templates || this.DEFAULT_CONFIG.templates,
		};
	}

	static createSampleConfig(outputPath: string = 'oip.config.json'): void {
		const sampleConfig: OipConfig = {
			apiRoot: 'https://api.oip.onl/api/templates',
			outputDir: 'oip',
			defaultSingleFile: false,
			templates: {
				// Example template-specific overrides
				Audio: {
					outputPath: 'types/audio.ts',
				},
				Video: {
					outputPath: 'types/video.ts',
					force: true,
				},
			},
		};

		const content = JSON.stringify(sampleConfig, null, 2);
		fs.writeFileSync(outputPath, content);

		logger.success(`🎉 Sample config created: ${outputPath}`);
		logger.info('Edit this file to customize OIP CLI behavior');
	}
}
