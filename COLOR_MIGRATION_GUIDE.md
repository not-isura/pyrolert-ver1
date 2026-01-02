# Color Migration Guide - Pyrolert Project

## ✅ Completed Migrations

### **Core System Setup**
- ✅ Added comprehensive semantic color variables to `src/index.css`
- ✅ Updated `tailwind.config.ts` with semantic color utilities
- ✅ All semantic colors now available as Tailwind classes

### **Migrated Components & Pages**
1. ✅ **Login.tsx** - All validation states, icons, and text colors
2. ✅ **TrendBadge.tsx** - Success/error/neutral states
3. ✅ **UserDatabase.tsx** - Error messages, delete warnings, form labels
4. ✅ **RoomCard.tsx** - Temperature text (partial)
5. ✅ **RoomData.tsx** - Context text (partial)
6. ✅ **ConnectionStatusBadge.tsx** - Connected/disconnected states

---

## 🎨 Available Semantic Color Classes

### **Text Colors for Light Backgrounds**
```tsx
text-text-primary      // #262626 - Main headings, body text
text-text-secondary    // #6B7280 - Secondary text, descriptions
text-text-tertiary     // #9CA3AF - Tertiary text, timestamps
text-text-disabled     // #BDBDBD - Disabled text
text-text-placeholder  // #9CA3AF - Placeholder text
```

### **Icon Colors**
```tsx
text-icon-primary      // Primary icons (dark)
text-icon-secondary    // Secondary icons (medium gray)
text-icon-muted        // Muted/disabled icons (light gray)
text-icon-hover        // Icon hover state (maroon)
hover:text-icon-*      // Use with hover states
```

### **State/Feedback Colors**
```tsx
// Success (Green)
text-success           // #22C55E - Success text
text-success-hover     // Darker success for hover
bg-success-light       // Light green background

// Error (Red)
text-error             // #E53E3E - Error text
text-error-hover       // Darker error for hover
bg-error-light         // Light red background

// Warning (Orange)
text-warning           // #F59E0B - Warning text
text-warning-hover     // Darker warning for hover

// Info (Blue)
text-info              // #0EA5E9 - Info text
```

### **Link Colors**
```tsx
text-link              // Default link (maroon)
text-link-hover        // Link hover state
text-link-visited      // Visited links
```

### **Existing Brand Colors** (Already Available)
```tsx
text-brand-blue        // Maroon (#800000)
text-brand-yellow      // Gold
text-brand-green       // Green
text-brand-orange      // Orange
text-brand-red         // Red
bg-brand-*             // Background variants
border-brand-*         // Border variants
```

---

## 📋 Migration Checklist - Remaining Work

### **High Priority Components** (Most Used)
- ⬜ **Dashboard.tsx** - Has gray colors in various states
- ⬜ **Header.tsx** - Mobile menu, user dropdown
- ⬜ **RoomData.tsx** - Sensor readings, status descriptions (partially done)

### **Medium Priority Pages**
- ⬜ **CreateAccount.tsx** - Form validation, error messages
- ⬜ **RoomManagement.tsx** - Delete dialogs, warnings
- ⬜ **EventLogs.tsx** - PDF export colors, timestamps
- ⬜ **Settings.tsx** - Navigation cards, descriptions

### **Low Priority / Minor Components**
- ⬜ **StatusBadge.tsx** - Status colors (may already use status-* variables)
- ⬜ **SensorStatusBadge.tsx** - Sensor states (may already be semantic)
- ⬜ Other utility components

---

## 🔄 Migration Pattern Examples

### **Example 1: Replace Gray Text**
```tsx
// ❌ BEFORE (Hardcoded)
<p className="text-gray-600">Description text</p>

// ✅ AFTER (Semantic)
<p className="text-text-secondary">Description text</p>
```

### **Example 2: Replace Icon Colors**
```tsx
// ❌ BEFORE
<Search className="h-4 w-4 text-gray-400 hover:text-gray-600" />

// ✅ AFTER
<Search className="h-4 w-4 text-icon-muted hover:text-icon-secondary" />
```

### **Example 3: Replace Validation Colors**
```tsx
// ❌ BEFORE
{isValid ? (
  <Check className="text-green-600" />
) : (
  <X className="text-red-500" />
)}

// ✅ AFTER
{isValid ? (
  <Check className="text-success" />
) : (
  <X className="text-error" />
)}
```

### **Example 4: Replace Error Messages**
```tsx
// ❌ BEFORE
<p className="text-red-600">Error occurred</p>

// ✅ AFTER
<p className="text-error">Error occurred</p>
```

### **Example 5: Replace Conditional Text**
```tsx
// ❌ BEFORE
<span className={`${isActive ? "text-green-600" : "text-gray-600"}`}>

// ✅ AFTER
<span className={`${isActive ? "text-success" : "text-text-secondary"}`}>
```

---

## 🎯 Quick Reference: Color Mapping

| Old Hardcoded Class | New Semantic Class | Use Case |
|---------------------|-------------------|----------|
| `text-gray-900` | `text-text-primary` | Main headings |
| `text-gray-700` | `text-text-primary` | Body text |
| `text-gray-600` | `text-text-secondary` | Descriptions |
| `text-gray-500` | `text-icon-secondary` | Icons, metadata |
| `text-gray-400` | `text-icon-muted` | Disabled icons |
| `text-gray-300` | `text-text-tertiary` | Very light text |
| `text-red-500/600/700` | `text-error` | Error messages |
| `text-green-600` | `text-success` | Success states |
| `text-red-100` | `bg-error-light` | Error backgrounds |
| `text-green-100` | `bg-success-light` | Success backgrounds |

---

## 🚀 How to Continue Migration

### **Step 1: Pick a Component**
Choose from the checklist above, starting with high-priority items.

### **Step 2: Find Hardcoded Colors**
Search for patterns:
- `text-gray-*`
- `text-red-*`
- `text-green-*`
- `text-blue-*` (not maroon brand blue)

### **Step 3: Replace with Semantic Classes**
Use the mapping table above to replace each instance.

### **Step 4: Test Visually**
Refresh your browser and verify colors look correct.

### **Step 5: Mark as Complete**
Update this file's checklist with ✅

---

## 💡 Benefits of This System

1. **Easy Color Changes** - Change one CSS variable, update everywhere
2. **Consistency** - All components use the same color palette
3. **Accessibility** - Semantic colors ensure proper contrast ratios
4. **Maintainability** - Clear naming shows intent (error, success, etc.)
5. **Dark Mode Ready** - Can add dark mode by updating CSS variables only

---

## 📝 Notes

- **Don't replace `text-foreground` or `text-muted-foreground`** - These are already semantic!
- **Brand colors stay the same** - `text-brand-blue` (maroon) is still correct
- **Status colors** - Check if components already use `text-status-*` variables
- **Inline styles** - Some components use `style={{ color: 'hsl(var(--brand-blue))' }}` which is fine

---

## 🔍 Finding Remaining Hardcoded Colors

Run these searches in VS Code:
```regex
text-gray-\d+
text-red-\d+
text-green-\d+
bg-gray-\d+
```

Or use the grep tool to find specific patterns in specific files.

---

**Last Updated:** After migrating Login, TrendBadge, UserDatabase (partial), RoomCard (partial), RoomData (partial)
