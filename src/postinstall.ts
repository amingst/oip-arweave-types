#!/usr/bin/env node

// Postinstall script for oip-arweave-types
// Automatically generates TypeScript types when package is installed

const path = require('path');
const fs = require('fs');

async function postInstall() {
	try {
		// Check if dist/templates.js exists
		const templatesPath = path.join(__dirname, 'templates.js');
		if (!fs.existsSync(templatesPath)) {
			console.warn('⚠️  Cannot run postinstall: dist/templates.js not found');
			console.warn('   This likely means the package has not been built yet.');
			console.warn('   Run "pnpm build" first, then "node dist/postinstall.js"');
			return;
		}

		// Check if we're in a development environment (this package's own directory)
		const packageJson = path.join(__dirname, '..', 'package.json');
		let isDevEnvironment = false;

		if (fs.existsSync(packageJson)) {
			const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
			isDevEnvironment = pkg.name === 'oip-arweave-types';
		}

		// Skip postinstall in development environment
		if (isDevEnvironment) {
			console.log('🔧 Skipping postinstall in development environment');
			return;
		}

		console.log('🌐 OIP Arweave Types - Fetching latest types...');

		try {
			// Import the fetchOipTemplates function
			const templatesModule = require('./templates');
			const fetchOipTemplates = templatesModule.fetchOipTemplates;

			if (!fetchOipTemplates) {
				throw new Error('fetchOipTemplates function not found. This might indicate a build issue.');
			}

			// Generate types in the consuming project's node_modules directory
			const typesDir = path.join(__dirname, '..', 'types');

			// Ensure types directory exists
			if (!fs.existsSync(typesDir)) {
				fs.mkdirSync(typesDir, { recursive: true });
			}

			const outputPath = path.join(typesDir, 'oip-arweave-types.d.ts');

			// Fetch and generate types
			await fetchOipTemplates({
				output: outputPath,
				// Only using the output parameter now
			});

			console.log('✅ OIP Arweave types generated successfully!');
			console.log(
				`📁 Types available at: node_modules/oip-arweave-types/types/oip-arweave-types.d.ts`
			);
		} catch (error) {
			console.warn(
				'⚠️  Failed to generate OIP Arweave types during installation:'
			);
			console.warn(
				`   ${error instanceof Error ? error.message : String(error)}`
			);
			console.warn(
				'   You can manually generate types later with: npx oip-arweave-types generate'
			);
		}
	} catch (error) {
		console.warn('⚠️  Error in postinstall script:');
		console.warn(`   ${error instanceof Error ? error.message : String(error)}`);
	}
}

// Only run if this script is executed directly (not required)
if (require.main === module) {
	postInstall();
}

module.exports = { postInstall };

// Only run if this script is executed directly (not required)
if (require.main === module) {
	postInstall();
}

module.exports = { postInstall };
