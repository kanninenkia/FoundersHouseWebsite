# Content Editing Guide

This guide explains how to edit text content on the Founders House website without coding knowledge.

## Quick Start

All editable text content is now organized in dedicated content files:

- **Home Page**: `src/home/home-content.ts`
- **About Page**: `src/about/about-content.ts`
- **Join Page**: `src/join/join-content.ts`
- **Events Page**: `src/events/hooks/events-data.ts`

## How to Edit Content

### 1. Open the Content File
Navigate to the content file you want to edit (see locations above).

### 2. Find the Text
All text is organized in clear sections with comments explaining what each part is for.

### 3. Edit the Text
Simply change the text between the quotes:

**Before:**
```typescript
title: "ABOUT",
```

**After:**
```typescript
title: "ABOUT US",
```

### 4. Save the File
Save your changes (Ctrl+S or Cmd+S). The website will automatically update.

## Important Rules

✅ **DO:**
- Edit text between quotes
- Keep the quotes around the text
- Add line breaks with `\n\n` if needed
- Save the file after editing

❌ **DON'T:**
- Remove commas at the end of lines
- Delete the `export` at the top
- Remove curly braces `{}` or brackets `[]`
- Change property names (like `title:` or `description:`)

## Examples

### Editing a Simple Text
```typescript
header: {
  title: "ABOUT",  // ← Edit text here
  subtitle: "We believe...",  // ← Or here
}
```

### Editing Multi-Paragraph Text
Use `\n\n` to create paragraph breaks:
```typescript
description: "First paragraph.\n\nSecond paragraph.",
```

### Editing Lists (like events or team members)
Each item in square brackets `[]` is one entry:
```typescript
members: [
  {
    name: "John Doe",
    email: "john@example.com",
  },
  {
    name: "Jane Smith",  // ← You can edit these
    email: "jane@example.com",
  },
]
```

## Need Help?

If something breaks:
1. Check that all quotes are closed
2. Check that commas are present at the end of each line
3. Use Ctrl+Z (Cmd+Z on Mac) to undo changes
4. Ask a developer to review your changes

## Content File Structure

### Home Page (`src/home/home-content.ts`)
- Hero section: 4-line animated text
- Quote cards: 6 testimonial quotes from supporters
  - Each has: name, quote text, image URL, and color theme
- Values sections: 4 sections (Obsessive, Ambitious, NextGen, Builders)
  - Each has a title and description
- Join section: Description, heading, and button text

### About Page (`src/about/about-content.ts`)
- Hero animation text (initial 3-second animation)
- Main header (title + subtitle)
- Section 2-5 content blocks
- Team member information

### Join Page (`src/join/join-content.ts`)
- Hero animation text
- Main header
- Membership types (Resident & Member descriptions)
- Application process information
- Community section

### Events Page (`src/events/hooks/events-data.ts`)
- Individual event cards with:
  - Title
  - Description
  - Date and location
  - Image path
