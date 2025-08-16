#!/usr/bin/env node

// Postinstall script for oip-arweave-types
// Automatically generates TypeScript types when package is installed

const path = require('path');
const fs = require('fs');

async function postInstall() {
	try {
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

		// Import the fetchOipTemplates function
		const { fetchOipTemplates } = require('./templates');

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
			keepVersions: false,
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
}

// Only run if this script is executed directly (not required)
if (require.main === module) {
	postInstall();
}

module.exports = { postInstall };
