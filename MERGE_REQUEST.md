# Title
```
feat: Enhanced Image Cropper Modal with Responsive Design and Advanced Photo Editing Features
```

# Description
```markdown
## 🎯 Overview
This MR introduces a comprehensive image cropper modal with advanced photo editing capabilities, fully responsive design, and improved user experience for corporate headshot uploads.

## ✨ Features Added

### Core Functionality
- **Image Cropping**: Fixed 4:6 (2:3) aspect ratio frame for professional photo format
- **Drag & Drop**: Intuitive drag-to-reposition functionality for photo alignment
- **Zoom Controls**: Zoom in/out buttons with percentage display (50% - 300%)
- **Image Rotation**: 360° rotation slider with real-time preview
- **Reset Function**: Quick reset button to restore original zoom, position, and rotation
- **Reupload Photo**: Button to reupload photo without closing the modal

### Responsive Design
- **Mobile Optimized**: Fully responsive layout for screens < 1024px
- **Adaptive Frame Size**: Frame automatically adjusts based on viewport size
- **Flexible Layout**: Photo Examples and Guidelines cards reorder on mobile
- **Touch Support**: Full touch gesture support for mobile devices
- **Vertical Scrolling**: Content area scrolls vertically on mobile when needed

### User Experience Improvements
- **Auto-Scaling**: Small photos automatically scale to fit the 4x6 frame
- **Photo Guidelines**: Best practice checklist with visual examples
- **Photo Examples**: Do & Don't visual guide for professional photos
- **Body Scroll Lock**: Prevents background scrolling when modal is open
- **Visual Feedback**: Grid lines, ratio indicators, and dynamic text contrast
- **Error Handling**: Robust error handling for image loading failures

### UI/UX Enhancements
- **Border Fix**: Frame border no longer clips at corners
- **Text Contrast**: Overlay text turns white when photo is present for better visibility
- **Compact Design**: Optimized frame size and padding to avoid desktop scrolling
- **Loading States**: Processing indicators during crop operations
- **Accessibility**: Proper ARIA labels and keyboard support

## 🔧 Technical Details

### Components Modified
- `components/update-data/modals/ImageCropperModal.vue`
  - Complete rewrite with Vue 3 Composition API
  - Canvas-based image cropping with rotation support
  - ResizeObserver for dynamic frame sizing
  - Teleport to body for modal isolation

- `components/form/PhotoUpload.vue`
  - Added reupload event handler integration
  - Updated to handle cropper reupload events

### Key Technical Features
- **Canvas API**: Used for actual image cropping and rotation
- **CSS Transforms**: Visual rotation with transform-origin centering
- **Bounding Box Calculation**: Accurate rotated image dimension calculations
- **State Management**: Reactive state with Vue refs and computed properties
- **Memory Management**: Proper URL.revokeObjectURL cleanup

### Constants & Configuration
- Aspect Ratio: 2:3 (4:6)
- Output Width: 800px
- Zoom Range: 0.5x - 3.0x
- Frame Size: 170-210px (desktop), 130-170px (mobile)

## 📱 Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px
- Large Desktop: ≥ 1280px

## 🐛 Bug Fixes
- Fixed modal disappearing on screen resize
- Fixed frame container overlay issue on mobile
- Fixed image disappearing and frame size inconsistency
- Fixed border corner clipping
- Fixed image stretching during rotation
- Fixed rotation point centering
- Fixed image size changes during rotation

## 📝 Files Changed
- `components/update-data/modals/ImageCropperModal.vue` (956 lines)
- `components/form/PhotoUpload.vue` (378 lines)
- `public/images/guide-photo.png` (new file)

## ✅ Testing Checklist
- [x] Upload photo and verify auto-scaling
- [x] Test drag functionality on desktop and mobile
- [x] Test zoom in/out controls
- [x] Test rotation slider
- [x] Test reset button
- [x] Test reupload photo button
- [x] Verify responsive layout on different screen sizes
- [x] Test modal behavior on screen resize
- [x] Verify body scroll lock
- [x] Test error handling (invalid image, loading failure)
- [x] Verify crop output quality and dimensions

## 🎨 UI/UX Notes
- Modal uses max-height of 85vh to prevent overflow
- Frame maintains aspect ratio at all screen sizes
- Photo Examples card appears above Guidelines on mobile
- Zoom controls flex with reset button on screens < 769px
- All buttons have proper disabled states and loading indicators

## 📸 Screenshots
(Add screenshots of the modal on desktop and mobile if available)

## 🔗 Related Issues
(Link to related tickets or issues if applicable)
```

