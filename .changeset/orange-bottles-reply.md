---
"oip-arweave-types": patch
---

## Enhanced JSDoc Generation and Template Management

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
