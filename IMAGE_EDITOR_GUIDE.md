# AI Image Editor - User Guide

## Overview

The AI Image Editor is a comprehensive modal component that allows users to edit images using natural language instructions with built-in safety controls and consent mechanisms.

## Features

### 🎨 **Core Capabilities**
- Upload new images or select from conversation messages
- Natural language editing instructions
- Intent preview before processing
- Real-time processing with safety messaging
- Side-by-side comparison (original vs edited)
- Save/rollback functionality
- AI edited badge on saved images

### 🛡️ **Safety Features**
- Identity preservation policies
- Facial structure protection
- Policy enforcement before AI processing
- Clear consent flow with preview

## User Flow

### 1. **Upload/Select Image**
- Click the AI sparkle icon (✨) in the message input area
- Upload a new image (max 10MB)
- Or select an existing image from conversation (click "Edit with AI" button)

### 2. **Enter Edit Instructions**
Use natural language to describe your desired changes:

**Examples:**
- "Change hair color to auburn"
- "Add warm sunset lighting"
- "Change background to beach scene"
- "Increase brightness and contrast"
- "Add subtle makeup"

### 3. **Preview Intent**
Before processing, review:
- Your original instructions
- Summary of what will change
- Safety notice about identity preservation

**Click "Confirm & Process"** to proceed or **"Back to Edit"** to modify

### 4. **Processing**
Watch the custom preloader with safety messaging:
- Animated logo spinner
- Progress indicators
- "Preserving facial structure" notice

### 5. **Review Results**
Compare original vs edited images side-by-side:
- **Left**: Original image
- **Right**: AI edited version (blue border)
- View the applied edit description

**Choose:**
- ✓ **Save to Conversation** - Sends edited image as a message
- ✗ **Discard Edit** - Rollback, doesn't save (you can try again)

## AI Edited Badge

Messages with AI edited images show a special badge:
- 🌟 Blue/purple gradient badge labeled "AI Edited"
- Displays the AI prompt used for editing
- Visible in conversation history

## Allowed Edits

### ✅ **Safe Edits (Allowed)**
- Hair color and styling
- Makeup application
- Lighting adjustments
- Background changes
- Clothing modifications
- Color grading
- Brightness/contrast
- Accessories

### ❌ **Forbidden Edits (Blocked)**
- Face swapping
- Identity changes
- Facial structure alterations
- Feature addition/removal
- Impersonation attempts
- Celebrity transformations

## Technical Details

### Component Props

```typescript
interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string;
  onSaveToConversation?: (imageData: string, prompt: string) => Promise<void>;
  conversationId?: string;
}
```

### Message Metadata

Edited images are saved with metadata:
```typescript
{
  aiEdited: true,
  aiPrompt: "User's edit instructions"
}
```

### Steps

1. `upload` - Select or upload image
2. `edit` - Enter instructions
3. `preview-intent` - Review and confirm
4. `processing` - AI editing in progress
5. `review` - Compare and save/discard

## Integration

### Opening the Editor

**From Message Input:**
```typescript
<button onClick={() => setShowImageEditor(true)}>
  {/* AI sparkle icon */}
</button>
```

**From Image Message:**
```typescript
<button onClick={() => handleEditImage(imageUrl)}>
  Edit with AI
</button>
```

### Handling Save

```typescript
const handleSaveEditedImage = async (imageData: string, prompt: string) => {
  await sendMessage(prompt, 'image', { 
    aiEdited: true, 
    aiPrompt: prompt 
  }, imageData);
};
```

## API Integration

The editor calls the Gemini Proxy Functions:
- Endpoint: `POST /v1/edit-image`
- Authentication: Firebase ID token
- Policy enforcement on server
- Face detection via Google Cloud Vision

## Error Handling

### Policy Violations
If edit violates safety policies:
- User sees 403 error with explanation
- Returns to edit step
- Can modify prompt and try again

### Rate Limits
- 20 requests per hour per user
- Clear error message with retry time
- Automatic reset after window

### Network Errors
- Toast notification
- Returns to edit step
- Error message displayed

## UI Components

### Upload Step
- Large image icon
- "Choose Image" button
- Supported edits notice
- Identity protection notice

### Edit Step
- Image preview
- Large textarea for instructions
- Character count/validation
- "Preview Changes" button

### Intent Preview
- Information icon
- Instructions summary
- Detected changes list
- Safety notice
- Confirm/back buttons

### Processing Step
- Animated spinner with logo
- Safety message box
- Progress step indicators
- Preserving identity messaging

### Review Step
- Side-by-side comparison grid
- Original label
- AI Edited label with border
- Applied edit summary
- Save/Discard buttons

## Accessibility

- Keyboard navigation support
- Screen reader friendly labels
- Focus management
- Clear button labels
- High contrast text

## Mobile Responsive

- Stacked layout on mobile
- Touch-friendly buttons
- Scrollable content
- Full-screen modal

## Best Practices

### For Users
1. Be specific in instructions
2. One change at a time for best results
3. Review intent preview carefully
4. Compare results before saving
5. Use rollback if not satisfied

### For Developers
1. Always handle errors gracefully
2. Show loading states
3. Validate images before upload
4. Preserve conversation context
5. Log AI interactions for audit

## Troubleshooting

**Q: Image upload fails**
- Check file size (max 10MB)
- Ensure valid image format
- Check network connection

**Q: Edit is rejected**
- Review forbidden keywords
- Simplify instructions
- Focus on cosmetic changes
- Avoid identity-altering requests

**Q: Processing takes too long**
- Large images may take 30+ seconds
- Check network speed
- Wait for completion (don't close modal)

**Q: Edited image not saved**
- Must click "Save to Conversation"
- Check conversation permissions
- Verify network connectivity

## Future Enhancements

Potential features:
- Batch editing
- Edit history
- Preset styles
- Advanced controls
- Comparison slider
- Download original/edited
- Share edited images

## Related Components

- `ImageModal` - Full-screen image viewer
- `ChatRoom` - Message display
- `GeminiProxyClient` - API client
- `useMessaging` - Message hook

## Security

- All edits server-side validated
- Policy checks before AI calls
- Rate limiting enforced
- Audit logging enabled
- Identity preservation guaranteed

---

**For technical documentation**, see:
- `/functions/README.md` - API reference
- `GEMINI_PROXY_SUMMARY.md` - Implementation details
- `/src/lib/geminiProxyClient.ts` - Client SDK
