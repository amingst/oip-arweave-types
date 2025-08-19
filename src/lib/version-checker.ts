import https from 'https';
import { logger } from '../logger';
import packageJson from '../../package.json';

export interface VersionInfo {
	current: string;
	latest: string;
	updateAvailable: boolean;
}

export class VersionChecker {
	private static readonly NPM_REGISTRY_URL = 'https://registry.npmjs.org';
	private static readonly PACKAGE_NAME = packageJson.name;
	private static readonly CURRENT_VERSION = packageJson.version;

	/**
	 * Check if a newer version is available on npm
	 */
	static async checkForUpdates(): Promise<VersionInfo> {
		try {
			const latestVersion = await this.getLatestVersion();
			const updateAvailable = this.isNewerVersion(latestVersion, this.CURRENT_VERSION);

			return {
				current: this.CURRENT_VERSION,
				latest: latestVersion,
				updateAvailable
			};
		} catch (error) {
			logger.debug('Failed to check for updates', error);
			return {
				current: this.CURRENT_VERSION,
				latest: this.CURRENT_VERSION,
				updateAvailable: false
			};
		}
	}

	/**
	 * Show update notification if available
	 */
	static async showUpdateNotification(): Promise<void> {
		const versionInfo = await this.checkForUpdates();

		if (versionInfo.updateAvailable) {
			console.log(''); // Empty line for spacing
			logger.warn('📦 Update Available!');
			logger.info(`   Current version: ${versionInfo.current}`);
			logger.info(`   Latest version:  ${versionInfo.latest}`);
			logger.muted('   Run: npm install -g oip-arweave-types@latest');
			logger.muted('   Or:  npx oip-arweave-types@latest');
			console.log(''); // Empty line for spacing
		}
	}

	/**
	 * Get the latest version from npm registry
	 */
	private static async getLatestVersion(): Promise<string> {
		return new Promise((resolve, reject) => {
			const url = `${this.NPM_REGISTRY_URL}/${this.PACKAGE_NAME}/latest`;
			
			const request = https.get(url, {
				timeout: 3000, // 3 second timeout
				headers: {
					'User-Agent': `${this.PACKAGE_NAME}/${this.CURRENT_VERSION}`,
					'Accept': 'application/json'
				}
			}, (response) => {
				let data = '';

				response.on('data', (chunk) => {
					data += chunk;
				});

				response.on('end', () => {
					try {
						const packageInfo = JSON.parse(data);
						resolve(packageInfo.version);
					} catch (error) {
						reject(new Error('Failed to parse npm registry response'));
					}
				});
			});

			request.on('error', (error) => {
				reject(error);
			});

			request.on('timeout', () => {
				request.destroy();
				reject(new Error('Request timeout'));
			});
		});
	}

	/**
	 * Compare two semantic versions
	 */
	private static isNewerVersion(latest: string, current: string): boolean {
		const latestParts = latest.split('.').map(Number);
		const currentParts = current.split('.').map(Number);

		for (let i = 0; i < 3; i++) {
			const latestPart = latestParts[i] || 0;
			const currentPart = currentParts[i] || 0;

			if (latestPart > currentPart) {
				return true;
			} else if (latestPart < currentPart) {
				return false;
			}
		}

		return false; // Versions are equal
	}
}
