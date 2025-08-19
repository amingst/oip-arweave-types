# oip-arweave-types

## 0.4.1

### Patch Changes

- 9a1bb44: ## Enhanced JSDoc Generation and Template Management

  ### 🎉 Major Improvements

  - **Dynamic JSDoc Generation**: JSDoc comments now use real schema metadata from the OIP API instead of hardcoded descriptions
  - **Package.json Integration**: Author and version information in JSDoc comments are now dynamically pulled from package.json
  - **Enhanced File Management**: Added file deletion capability with `--force` flag for clean overwrites
  - **Schema-Aware Descriptions**: Field descriptions are now generated based on actual template metadata, providing more accurate documentation

  ### 🔧 Technical Enhancements

  - Enhanced `JSDocEnhancer` with dynamic schema loading and real-time field description generation
  - Improved `ApiClient` with template schema fetching and transformation capabilities
  - Added `deleteFile` method to `FileSystemUtils` for better file management
  - Enhanced template extraction with better dependency handling

  ### 🚀 User Experience

  - More accurate and helpful JSDoc comments in generated TypeScript interfaces
  - Automatic synchronization of package metadata in generated files
  - Cleaner file overwrites when using the `--force` flag
  - Professional-grade documentation generation

## 0.4.0

### Minor Changes

- 9b1e189: ## 🚀 Major CLI Enhancement & Configuration System

  ### ✨ New Features

  - **Configuration Management**: Added comprehensive config system with `oip.config.json` support
  - **Enhanced CLI Commands**: Improved `generate`, `add`, and new `config` commands
  - **Dynamic Help System**: Custom help formatting with emoji styling and command discovery
  - **Version Management**: Dynamic version loading from package.json with update notifications
  - **Template Service**: Advanced template handling with per-template configuration overrides

  ### 🎨 User Experience Improvements

  - **Consistent Styling**: Professional logger system with emoji-rich output across all commands
  - **Smart Defaults**: Configuration-driven defaults with command-line override support
  - **Better Error Handling**: Improved error messages and user prompts
  - **Update Notifications**: Automatic update checking when version is displayed

  ### 🔧 Technical Improvements

  - **Modular Architecture**: Refactored into clean service classes (ApiClient, TypeGenerator, TemplateService, etc.)
  - **Configuration System**: Support for multiple config file formats (.json, .js, .oiprc)
  - **Single Source of Truth**: Dynamic version and help generation
  - **Robust CLI Framework**: Custom Commander.js integration with proper option handling

  This release significantly improves the developer experience and sets up a solid foundation for future enhancements.

## 0.3.0

### Minor Changes

- 572c037: Generate types from new api route for typegen
- 4e86db4: add config for installs with npm

### Patch Changes

- 8a75ea0: update build step
- 97fdf70: update config and workflow
- ca25867: update ci

## 0.1.0

### Minor Changes

- 299026d: Add enum generation and union types for drefs

## 0.0.3

### Patch Changes

- add readme

## 1.0.0

### Major Changes

- Initial release of OIP Arweave Type Generator

  This CLI tool generates TypeScript types from OIP Arweave templates. Features include:

  - Fetches templates from OIP Arweave API
  - Generates clean TypeScript interfaces
  - Supports latest-version-only or all-versions modes
  - Built with Commander.js for extensible CLI structure
  - Colorized output for better UX

### Patch Changes

- Refactored CLI to use Commander.js for better command structure and organization

## 1.0.0

### Major Changes

- Initial release of OIP Arweave Type Generator

  This CLI tool generates TypeScript types from OIP Arweave templates. Features include:

  - Fetches templates from OIP Arweave API
  - Generates clean TypeScript interfaces
  - Supports latest-version-only or all-versions modes
  - Built with Commander.js for extensible CLI structure
  - Colorized output for better UX
