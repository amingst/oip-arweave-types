---
"oip-arweave-types": minor
---

## 🚀 Major CLI Enhancement & Configuration System

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
