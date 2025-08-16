# OIP Arweave Types

> TypeScript types for OIP Arweave templates with optional CLI generator

This package provides automatically updated TypeScript types for OIP Arweave templates. Types are generated during installation, with an optional CLI for advanced usage.

## Features

-   🎯 **Automatic Types** - Types generated automatically during installation
-   🌐 **Live API Integration** - Fetches latest templates from OIP Arweave API
-   🔄 **Always Up-to-Date** - Gets the latest template definitions on install
-   🎨 **Clean Interfaces** - Readable TypeScript interfaces with proper typing
-   ⚡ **Zero Configuration** - Works out of the box, no setup required
-   🛠️ **Optional CLI** - Advanced CLI available for custom workflows

## Installation

### For TypeScript Projects (Recommended)

Simply install as a dependency to get automatic types:

```bash
# Install as a project dependency
npm install oip-arweave-types
# or
pnpm add oip-arweave-types
```

Types are automatically available in your TypeScript projects:

```typescript
// Import the types you need
import type { Album, Artwork, Person, Basic } from 'oip-arweave-types';

// Use them in your code
const album: Album = {
	albumTitle: 'My Album',
	artist: 'Artist Name',
};
```

### For CLI Usage

If you want to use the CLI tool for custom workflows:

```bash
# Global installation for CLI usage
npm install -g oip-arweave-types

# Or use directly with npx
npx oip-arweave-types generate
```

> **Note**: If the automatic generation fails during installation (e.g., no internet connection), you can manually generate types later using the CLI commands below.

## Usage

### Basic Usage

Generate TypeScript types from all available templates:

```bash
npx oip-arweave-types generate
```

This creates `oip/generated-types.ts` with interfaces for the latest version of each template.

### Options

```bash
# Custom output path
npx oip-arweave-types generate --output ./src/types/oip.ts

# Include all template versions (not just latest)
npx oip-arweave-types generate --keep-versions

# Combine options
npx oip-arweave-types generate --output ./types.ts --keep-versions
```

### Help

```bash
# General help
npx oip-arweave-types --help

# Command-specific help
npx oip-arweave-types generate --help
```

## Generated Output

The tool generates clean TypeScript interfaces like:

```typescript
// Latest versions only (default)
export interface Album {
	albumTitle: string;
	artist: string;
	company?: string;
	type?: string;
	year?: number;
}

export interface Artwork {
	title: string;
	artist: string;
	description?: string;
	medium?: string;
	year?: number;
}
```

With `--keep-versions`, you get versioned interfaces:

```typescript
// All versions included
export interface AlbumV1 {
	albumTitle: string;
	artist: string;
}

export interface AlbumV2 {
	albumTitle: string;
	artist: string;
	company?: string;
	type?: string;
	year?: number;
}

// Latest version alias
export type Album = AlbumV2;
```

## API Reference

The tool connects to the OIP Arweave API at `https://api.oip.onl/api/templates` to fetch template definitions. Templates are automatically deduplicated based on their Arweave block timestamps to ensure you get the most recent version of each template.

## Type Mappings

OIP field types are mapped to TypeScript as follows:

-   `string` → `string`
-   `number` → `number`
-   `boolean` → `boolean`
-   Arrays → `T[]` (e.g., `string[]`, `number[]`)
-   Nested objects → Nested interfaces

Optional fields (not marked as required in OIP templates) are generated with the `?` optional operator.

## Development

```bash
# Clone the repository
git clone https://github.com/amingst/oip-arweave-types.git
cd oip-arweave-types

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Test locally
npx . generate
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and changes.

## License

MIT © [Andrew Mingst](https://github.com/amingst)

## Related

-   [OIP (Open Index Protocol)](https://oip.wiki/)
-   [Arweave](https://arweave.org/)
-   [TypeScript](https://www.typescriptlang.org/)

---

<div align="center">
  <sub>Built with ❤️ for the Arweave ecosystem</sub>
</div>
