# 404 OG Image Specification

## Overview

Open Graph image variant of the 404 compass illustration for social sharing when users share links to non-existent pages.

## Dimensions

- **Width**: 1200px
- **Height**: 630px
- **Format**: PNG (for social media compatibility)
- **Aspect Ratio**: 1.91:1 (standard OG image)

## Design Composition

```
+----------------------------------------------------------+
|                                                          |
|    +----------+     +------------------------------+     |
|    |          |     |                              |     |
|    |  Compass |     |  404                         |     |
|    |  Illust. |     |  Page Not Found              |     |
|    |  400x400 |     |  "Looks like you've wandered |     |
|    |          |     |   off the map"               |     |
|    +----------+     +------------------------------+     |
|                                                          |
+----------------------------------------------------------+
```

## Color Palette

Based on the existing 404 compass illustration:

| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep Navy | #142942 |
| Accent (404 text) | Teal | #00B5C2 |
| Headline | White | #FFFFFF |
| Subtitle | Light Gray | #B3BFcc |
| Illustration BG | Light Blue-Gray | #EDF5FA (10% opacity) |

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Error Code "404" | Inter | Bold | 120px |
| Headline | Inter | Bold | 48px |
| Subtitle | Inter | Regular | 24px |

## Layout Structure

```
404-OG-Image (1200x630)
├── Content (1100x530, centered with 50px padding)
│   ├── Illustration-Area (400x400)
│   │   └── [Compass illustration placed here]
│   └── Text-Area (600x400)
│       ├── Error-Code "404"
│       ├── Headline "Page Not Found"
│       └── Subtitle "Looks like you've wandered off the map"
```

## Figma Node References

- **Source Illustration**: Node `25:3` (Illustrations/404-Compass)
- **Parent Section**: Node `25:2` (Page Illustrations)
- **Target Location**: Adjacent to Page Illustrations section

## Creation Code

```javascript
// Figma Plugin API code to create the OG image frame
// Requires Desktop Bridge plugin to be running

const brandNavy = { r: 0.08, g: 0.16, b: 0.26 };
const brandTeal = { r: 0.0, g: 0.71, b: 0.76 };
const lightBg = { r: 0.93, g: 0.96, b: 0.98 };

// Create main frame
const ogFrame = figma.createFrame();
ogFrame.name = '404-OG-Image';
ogFrame.resize(1200, 630);
ogFrame.fills = [{ type: 'SOLID', color: brandNavy }];

// Create horizontal layout for content
const contentFrame = figma.createFrame();
contentFrame.name = 'Content';
contentFrame.resize(1100, 530);
contentFrame.x = 50;
contentFrame.y = 50;
contentFrame.fills = [];
contentFrame.layoutMode = 'HORIZONTAL';
contentFrame.itemSpacing = 60;
contentFrame.primaryAxisAlignItems = 'CENTER';
contentFrame.counterAxisAlignItems = 'CENTER';
ogFrame.appendChild(contentFrame);

// Illustration placeholder
const illustrationArea = figma.createFrame();
illustrationArea.name = 'Illustration-Area';
illustrationArea.resize(400, 400);
illustrationArea.fills = [{ type: 'SOLID', color: lightBg, opacity: 0.1 }];
illustrationArea.cornerRadius = 16;
contentFrame.appendChild(illustrationArea);

// Text area with vertical layout
const textArea = figma.createFrame();
textArea.name = 'Text-Area';
textArea.resize(600, 400);
textArea.fills = [];
textArea.layoutMode = 'VERTICAL';
textArea.itemSpacing = 24;
textArea.primaryAxisAlignItems = 'CENTER';
textArea.counterAxisAlignItems = 'MIN';
contentFrame.appendChild(textArea);

// Load fonts
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

// Create text elements
const text404 = figma.createText();
text404.characters = '404';
text404.fontName = { family: 'Inter', style: 'Bold' };
text404.fontSize = 120;
text404.fills = [{ type: 'SOLID', color: brandTeal }];
textArea.appendChild(text404);

const headline = figma.createText();
headline.characters = 'Page Not Found';
headline.fontName = { family: 'Inter', style: 'Bold' };
headline.fontSize = 48;
headline.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
textArea.appendChild(headline);

const subtitle = figma.createText();
subtitle.characters = "Looks like you've wandered off the map";
subtitle.fontName = { family: 'Inter', style: 'Regular' };
subtitle.fontSize = 24;
subtitle.fills = [{ type: 'SOLID', color: { r: 0.7, g: 0.75, b: 0.8 } }];
textArea.appendChild(subtitle);
```

## Usage

This OG image will be displayed when:
- Users share a 404 page URL on social media
- Link previews are generated in messaging apps
- Search engines index the error page

## Export Settings

- **Format**: PNG
- **Scale**: 1x (1200x630)
- **Compression**: Optimized for web

## Status

- [x] Specification created
- [ ] Figma frame created (requires Desktop Bridge plugin)
- [ ] Compass illustration placed
- [ ] Visual validation completed
- [ ] Exported to Supabase Storage
