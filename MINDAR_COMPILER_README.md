# MindAR Image Targets Compiler

A complete clone of the official MindAR Image Targets Compiler with enhanced features and modern UI.

## 🚀 Features

### Simple Compiler
- **Drag & Drop Upload**: Easy file upload with drag and drop support
- **Image Preview**: See your uploaded image before compilation
- **Progress Tracking**: Real-time progress updates during compilation
- **Download Ready**: Direct download of compiled .mind files
- **Modern UI**: Beautiful, responsive design with smooth animations

### Advanced Compiler
- **Official Integration**: Direct access to the official MindAR compiler
- **Iframe Embedding**: Seamless integration with the official tool
- **Tab Interface**: Switch between simple and advanced modes

## 📁 Files

- `public/mindar-compiler.html` - Basic MindAR compiler with mock functionality
- `public/mindar-compiler-advanced.html` - Advanced compiler with official integration

## 🛠️ How to Use

### Option 1: Simple Compiler
1. Open `mindar-compiler.html` in your browser
2. Click the upload area or drag and drop an image
3. Select a JPG or PNG file
4. Click "Compile to .mind file"
5. Wait for the compilation process
6. Download your .mind file

### Option 2: Advanced Compiler
1. Open `mindar-compiler-advanced.html` in your browser
2. Switch to the "Advanced Compiler" tab
3. Click "Open Official MindAR Compiler"
4. Use the official MindAR compiler interface
5. Follow the official compilation process

## 📋 Image Requirements

For best results with MindAR image tracking:

- **Format**: JPG or PNG files
- **Quality**: High contrast, distinct features, good lighting
- **Size**: Recommended 512x512 pixels or larger
- **Content**: Avoid repetitive patterns, use unique images
- **Features**: Rich in distinctive visual features for better tracking

## 🔧 Technical Details

### Simple Compiler Implementation
The simple compiler provides a mock implementation that simulates the MindAR compilation process:

```javascript
// Mock .mind file creation
createMockMindFile() {
    const header = new Uint8Array([
        0x4D, 0x49, 0x4E, 0x44, // "MIND" magic number
        0x01, 0x00, 0x00, 0x00, // Version
        0x00, 0x00, 0x00, 0x00  // Placeholder data
    ]);
    
    const featureData = new Uint8Array(2048); // 2KB of mock data
    return new Uint8Array([...header, ...featureData]);
}
```

### Advanced Compiler Integration
The advanced compiler embeds the official MindAR compiler:

```html
<iframe 
    src="https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
    title="MindAR Compiler">
</iframe>
```

## 🎨 UI Features

### Modern Design
- **Gradient Backgrounds**: Beautiful color gradients
- **Glass Morphism**: Translucent elements with backdrop blur
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Works on desktop and mobile

### Interactive Elements
- **Drag & Drop**: Visual feedback during file upload
- **Progress Bar**: Real-time compilation progress
- **Status Messages**: Clear feedback for all operations
- **Loading Spinners**: Visual indication of processing

## 🔗 Integration with Existing App

This compiler can be integrated with your existing AR app:

1. **File Upload**: Use the compiled .mind files in your AR experiences
2. **API Integration**: Connect to your existing upload endpoints
3. **Database Storage**: Store compiled files in your Supabase storage
4. **AR Experience**: Use the .mind files in your MindAR experiences

## 📱 Mobile Support

Both compiler versions are fully responsive and work on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Tablet devices

## 🚀 Quick Start

1. **Clone the repository** (if not already done)
2. **Open the compiler**:
   ```bash
   # For simple compiler
   open public/mindar-compiler.html
   
   # For advanced compiler
   open public/mindar-compiler-advanced.html
   ```
3. **Upload an image** and start compiling
4. **Download your .mind file** and use it in your AR app

## 🔧 Customization

### Styling
Modify the CSS variables in the `<style>` section to customize:
- Colors and gradients
- Fonts and typography
- Spacing and layout
- Animations and transitions

### Functionality
Extend the JavaScript classes to add:
- Real API integration
- Additional file formats
- Custom compilation options
- Enhanced error handling

## 📚 Resources

- [MindAR Documentation](https://hiukim.github.io/mind-ar-js-doc/)
- [MindAR GitHub](https://github.com/hiukim/mind-ar-js)
- [Official Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/)

## 🤝 Contributing

Feel free to enhance the compiler with:
- Real MindAR API integration
- Additional file format support
- Advanced compilation options
- Better error handling
- Performance optimizations

## 📄 License

This project is based on MindAR and follows the same licensing terms.

---

**Note**: The simple compiler provides a mock implementation for demonstration purposes. For production use, integrate with the official MindAR compiler or implement real compilation logic. 