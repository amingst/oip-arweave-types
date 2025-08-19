# OIP Arweave Types

> 🌐 TypeScript types for OIP Arweave templates with powerful CLI generator

This package provides automatically updated TypeScript types for OIP Arweave templates with a comprehensive CLI for advanced workflows and configuration management.

## ✨ Features

-   🎯 **Automatic Types** - Types generated automatically during installation
-   🌐 **Live API Integration** - Fetches latest templates from OIP Arweave API
-   🔄 **Always Up-to-Date** - Gets the latest template definitions on install
-   ⚙️ **Flexible Configuration** - Customizable via `oip.config.json`
-   🚀 **Professional UX** - Emoji-rich output and intuitive commands
-   📦 **Version Management** - Smart update notifications and version checking
-   🔧 **Distributed System Support** - Configurable API endpoints for custom deployments

## 📦 Installation

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

# Or use directly with npx (recommended)
npx oip-arweave-types generate
```

> **Note**: If the automatic generation fails during installation (e.g., no internet connection), you can manually generate types later using the CLI commands below.

## 🚀 CLI Usage

### Quick Start

```bash
# Generate all types with beautiful output
npx oip-arweave-types generate

# Get help with emoji-rich formatting
npx oip-arweave-types --help

# Check version and updates
npx oip-arweave-types --version
```

### 📋 Available Commands

#### 🚀 Generate Types

```bash
# Generate all types to default location
npx oip-arweave-types generate

# Custom output path
npx oip-arweave-types generate --output ./src/types/oip.ts

# Generate as single file
npx oip-arweave-types generate --single-file
```

#### ➕ Add Specific Templates

```bash
# Add a specific template type
npx oip-arweave-types add Audio

# Force overwrite existing files
npx oip-arweave-types add Video --force
```

#### ⚙️ Configuration Management

```bash
# Create a sample configuration file
npx oip-arweave-types config init

# Show current configuration
npx oip-arweave-types config show
```

## ⚙️ Configuration

Create an `oip.config.json` file in your project root to customize behavior:

```json
{
	"apiRoot": "https://api.oip.onl/api",
	"outputDir": "./src/types",
	"defaultSingleFile": true,
	"templates": {
		"Audio": {
			"outputPath": "./src/types/audio.ts"
		},
		"Video": {
			"singleFile": false
		}
	}
}
```

### Configuration Options

| Option              | Type      | Default                     | Description                               |
| ------------------- | --------- | --------------------------- | ----------------------------------------- |
| `apiRoot`           | `string`  | `"https://api.oip.onl/api"` | API endpoint for distributed systems      |
| `outputDir`         | `string`  | `"./oip"`                   | Default directory for generated types     |
| `defaultSingleFile` | `boolean` | `false`                     | Generate all types in one file by default |
| `templates`         | `object`  | `{}`                        | Per-template configuration overrides      |

### Supported Configuration Files

-   `oip.config.json`
-   `oip.config.js`
-   `.oiprc`
-   `.oiprc.json`

## 📖 Examples

### Basic Generation

```bash
# Simple generation with default settings
npx oip-arweave-types generate
```

### Custom Workflow

```bash
# 1. Initialize configuration
npx oip-arweave-types config init

# 2. Edit oip.config.json to your needs
# 3. Generate with your settings
npx oip-arweave-types generate

# 4. Add specific templates as needed
npx oip-arweave-types add Recipe --force
```

### Distributed System Usage

```json
{
	"apiRoot": "https://my-custom-oip-api.com/api",
	"outputDir": "./types",
	"defaultSingleFile": true
}
```

## 🔧 Generated Output

The tool generates clean TypeScript interfaces like:

```typescript
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

### Output Modes

**Separate Files** (default):

```
oip/
├── Album.ts
├── Artwork.ts
├── Audio.ts
└── index.ts
```

**Single File** (`--single-file`):

```
oip/
└── generated-types.ts  # All interfaces in one file
```

## 🌐 API Reference

The tool connects to the OIP Arweave API to fetch template definitions. The default endpoint is `https://api.oip.onl/api/templates`, but this can be customized for distributed systems via configuration.

### Type Mappings

OIP field types are mapped to TypeScript as follows:

-   `string` → `string`
-   `number` → `number`
-   `boolean` → `boolean`
-   Arrays → `T[]` (e.g., `string[]`, `number[]`)
-   Nested objects → Nested interfaces

Optional fields (not marked as required in OIP templates) are generated with the `?` optional operator.

## 🛠️ Development

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

# Test with configuration
npx . config init
npx . generate --single-file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and changes.

## 📄 License

MIT © [Andrew Mingst](https://github.com/amingst)

## 🔗 Related

-   [OIP (Open Index Protocol)](https://oip.wiki/)
-   [Arweave](https://arweave.org/)
-   [TypeScript](https://www.typescriptlang.org/)

---

<div align="center">
  <sub>Built with ❤️ for the Arweave ecosystem</sub>
</div>
