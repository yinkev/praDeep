# PWA Icon Assets

This directory should contain the PWA icon assets for praDeep. The manifest references these files for proper PWA installation and app icon display.

## Required Icons

### 1. icon-192x192.png
- **Size**: 192x192 pixels
- **Purpose**: Standard app icon for PWA
- **Format**: PNG with transparency support
- **Usage**: Android home screen, app drawer

### 2. icon-512x512.png
- **Size**: 512x512 pixels
- **Purpose**: High-resolution app icon
- **Format**: PNG with transparency support
- **Usage**: Android splash screen, high-DPI displays

### 3. icon-maskable-512x512.png
- **Size**: 512x512 pixels (with 40px safe zone padding)
- **Purpose**: Adaptive icon for Android 8.0+
- **Format**: PNG with full bleed, important content in center
- **Usage**: Android adaptive icons (allows OS to mask/shape the icon)
- **Requirements**:
  - Icon content should be within central 368x368px safe zone
  - Full canvas (512x512) should have background fill
  - Use solid background color (not transparent)

### 4. apple-touch-icon.png
- **Size**: 180x180 pixels
- **Purpose**: iOS home screen icon
- **Format**: PNG (iOS will add rounded corners automatically)
- **Usage**: iOS/iPadOS home screen

## Design Guidelines

1. **Consistency**: Use the praDeep logo with the brand's teal gradient
2. **Background**: For maskable icons, use the primary brand color (#0d9488)
3. **Contrast**: Ensure good contrast against both light and dark backgrounds
4. **Simplicity**: Keep the design clear and recognizable at small sizes
5. **Safe Zone**: For maskable icons, keep critical elements within the safe zone

## Generating Icons

You can use online tools like:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

Or use the praDeep logo (web/public/logo.png) as source and resize with:
```bash
# Using ImageMagick
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png
convert logo.png -resize 512x512 -gravity center -background "#0d9488" -extent 512x512 icon-maskable-512x512.png
convert logo.png -resize 180x180 apple-touch-icon.png
```

## Current Status

⚠️ **TODO**: Icon files need to be created. The PWA manifest is configured but icons are not yet generated.

## Testing Icons

After adding icons, test the PWA installation on:
- **Android**: Chrome > Menu > Install app
- **iOS**: Safari > Share > Add to Home Screen
- **Desktop**: Chrome > Install icon in address bar

Verify icons appear correctly in:
- Home screen
- App drawer / App list
- App switcher / Task manager
- Splash screen (Android)
