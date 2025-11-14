# NewsForm Fixes & Testing Guide

## Issues Fixed

### 1. **Textarea Component Props Handling**
**Issue**: The Textarea helper component wasn't properly merging custom className props, causing style overrides to fail.

**Fix**: Updated the Textarea component to properly merge custom classes with base classes:
```typescript
const Textarea = (props: React.ComponentPropsWithoutRef<'textarea'>) => {
    const { className, ...rest } = props;
    const baseClasses = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-unistay-yellow focus:border-unistay-yellow";
    const mergedClasses = className ? `${baseClasses} ${className}` : baseClasses;
    return <textarea {...rest} rows={4} className={mergedClasses} />;
};
```

### 2. **Textarea Focus Management**
**Issue**: When clicking formatting buttons or image insertion buttons, the textarea might lose focus or cursor position wasn't maintained correctly.

**Fix**: 
- Added explicit `textarea.focus()` calls after state updates
- Ensure cursor position is properly calculated and restored
- Added error handling with user-friendly alert if textarea isn't found

### 3. **Image Insertion Feedback**
**Issue**: Users didn't get clear feedback when an image was inserted, causing confusion about whether the action succeeded.

**Fix**:
- Added `lastInsertedImage` state to track recently inserted images
- Display a green success message showing which image was inserted
- Message auto-clears after 2 seconds
- Added visual highlight (light blue background) on the textarea when image is inserted

### 4. **Keyboard Shortcut Implementation**
**Issue**: Keyboard shortcuts weren't working because the event handler wasn't properly bound to the textarea.

**Fix**:
- Created `handleDescriptionKeyDown` function
- Added proper event delegation in the Textarea component
- Implemented support for:
  - **Ctrl+Enter** (Cmd+Enter on Mac): New paragraph
  - **Ctrl+B** (Cmd+B): Bold formatting
  - **Ctrl+I** (Cmd+I): Italic formatting

## Testing Checklist

### Paragraph Creation
- [ ] Click "New Paragraph" button - should add `\n\n` at cursor and show yellow highlight
- [ ] Press Ctrl+Enter - should work same as button
- [ ] Press Ctrl+Enter on Mac with Cmd+Enter - should work
- [ ] Verify cursor stays in textarea after action
- [ ] Test multiple paragraph breaks in sequence

### Text Formatting
- [ ] Select text and click "Bold" - text should be wrapped in `**text**`
- [ ] Press Ctrl+B with text selected - should apply bold
- [ ] Select text and click "Italic" - text should be wrapped in `*text*`
- [ ] Press Ctrl+I with text selected - should apply italic
- [ ] Try formatting without selecting text - should show alert
- [ ] Verify preview updates to show **bold** and *italic* text

### Inline Image Insertion
- [ ] Upload inline images using the file input
- [ ] Verify images appear in the grid with hover effects
- [ ] Click on an image - should insert `[IMAGE_n]` marker at cursor
- [ ] Verify green success message appears: "Image #X inserted at cursor position!"
- [ ] Verify textarea highlights light blue briefly
- [ ] Click preview ON to see images rendered in preview
- [ ] Verify multiple images can be inserted in different positions
- [ ] Remove an image by clicking the trash icon - should disappear from grid

### Preview Display
- [ ] Click "Preview ON" to see preview
- [ ] Preview should show:
  - Paragraphs separated by blank lines
  - **Bold** text in bold
  - *Italic* text in italic
  - Inline images displayed at their insertion points
- [ ] Turn preview OFF and back ON - should update correctly

### Form Submission
- [ ] Create article with paragraphs and inline images
- [ ] Submit form - should:
  - Upload featured image to Supabase
  - Upload inline images to Supabase
  - Replace `[IMAGE_n]` markers with actual URLs (`[INLINE_IMAGE:url]`)
  - Successfully save to database

### Edge Cases
- [ ] Try inserting image without focusing textarea first - should show alert
- [ ] Try bold/italic without selecting text - should show alert
- [ ] Try submitting without featured image - should show alert
- [ ] Upload multiple inline images - should all appear in grid
- [ ] Insert same image multiple times - should work

## Current Implementation

### State Management
```typescript
const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    description: '',
    source: '',
    featured: false,
    images: [],
    inlineImages: []
});
const [descriptionPreview, setDescriptionPreview] = useState(false);
const [lastInsertedImage, setLastInsertedImage] = useState<number | null>(null);
```

### Key Functions
1. **applyFormatting()** - Applies bold/italic/break formatting to selected text
2. **handleDescriptionKeyDown()** - Handles keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+Enter)
3. **insertInlineImage()** - Inserts image marker at cursor position with feedback
4. **handleImageUpload()** - Uploads images and creates preview URLs
5. **renderMarkdownPreview()** - Renders preview with formatted text and images
6. **handleSubmit()** - Handles form submission with image uploads

## Browser Compatibility
- ✅ Chrome/Edge (Ctrl+B, Ctrl+I, Ctrl+Enter)
- ✅ Firefox (Ctrl+B, Ctrl+I, Ctrl+Enter)
- ✅ Safari on Mac (Cmd+B, Cmd+I, Cmd+Enter)
- ✅ Mobile (touch support for buttons, limited keyboard support)

## Known Limitations
- Image preview shows locally uploaded images (object URLs), not permanent URLs until submitted
- Inline image URLs are only finalized after form submission and upload
- Cannot drag/drop to reorder images (will be added in future enhancement)
- Cannot crop images (will be added in future enhancement)

## Troubleshooting

### Image insertion not working
1. Click in the textarea to ensure it has focus
2. Verify inline images were uploaded (check grid)
3. Open browser console (F12) for any error messages
4. Try clicking the image again

### Keyboard shortcuts not working
1. Ensure the textarea has focus (cursor blinking)
2. On Mac, use Cmd instead of Ctrl
3. Make sure text is selected for Ctrl+B and Ctrl+I
4. For Ctrl+Enter, cursor position anywhere in textarea is fine

### Preview not showing
1. Click "Preview ON" button
2. Verify description has content
3. Check that markdown syntax is correct:
   - Bold: `**text**` (with asterisks)
   - Italic: `*text*` (with single asterisks)
   - Paragraphs: Separate with blank line (double newline)

## Future Enhancements
- [ ] Add undo/redo functionality
- [ ] Add image cropping tool
- [ ] Add drag-to-reorder images
- [ ] Add link insertion (Ctrl+K)
- [ ] Add text color/highlighting options
- [ ] Add table insertion
- [ ] Add code block formatting (triple backticks)
