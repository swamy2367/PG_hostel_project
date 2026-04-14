# Dark/Light Theme Pattern - Implementation Guide

## Complete Pattern Reference

This document shows the exact pattern used across all three owner pages for dark/light theme support.

---

## 1️⃣ IMPORTS

```javascript
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import OwnerNavbar from '../components/OwnerNavbar'
```

**Key Point:** Must import `useEffect` (added if not already there)

---

## 2️⃣ STATE DECLARATION

```javascript
export default function ComponentName() {
  // Theme state FIRST
  const [isDark, setIsDark] = useState(false)
  
  // Other states follow
  const [otherState, setOtherState] = useState(initialValue)
  // ...
}
```

**Key Point:** `isDark` state should be the first state declared

---

## 3️⃣ THEME INITIALIZATION & LISTENING

```javascript
useEffect(() => {
  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme')
  setIsDark(savedTheme === 'dark')
  
  // Apply to body element
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme')
  } else {
    document.body.classList.remove('dark-theme')
  }

  // Listen for theme changes dispatched by OwnerNavbar
  const handleThemeChange = () => {
    const newTheme = localStorage.getItem('theme')
    setIsDark(newTheme === 'dark')
    
    // Update body classes
    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }

  window.addEventListener('themeChange', handleThemeChange)
  
  // Cleanup
  return () => {
    window.removeEventListener('themeChange', handleThemeChange)
  }
}, []) // Empty dependency array - runs once on mount
```

**Key Points:**
- Empty dependency array `[]` - runs only once on component mount
- Place FIRST before any data-fetching useEffects
- Always clean up the event listener
- No other dependencies needed

---

## 4️⃣ JSX WRAPPER WITH DYNAMIC CLASSNAME

```javascript
return (
  <div className={`component-wrapper ${isDark ? 'dark-theme' : 'light-theme'}`}>
    {/* Component content */}
  </div>
)
```

**Variations by Component:**
```javascript
// Dashboard
<div className={`owner-dashboard-wrapper ${isDark ? 'dark-theme' : 'light-theme'}`}>

// Bookings
<div className={`owner-bookings-wrapper ${isDark ? 'dark-theme' : 'light-theme'}`}>

// Add Hostel
<div className={`add-hostel-wrapper ${isDark ? 'dark-theme' : 'light-theme'}`}>
```

**Key Point:** Template literal with ternary operator for conditional class

---

## 5️⃣ EMBEDDED STYLES - STRUCTURE

```jsx
<style>{`
  /* MAIN WRAPPER - TRANSITION & THEME MODES */
  .component-wrapper {
    min-height: 100vh;
    transition: background-color 0.3s ease; /* Smooth theme change */
  }

  /* LIGHT THEME COLORS */
  .light-theme {
    background: #f9fafb;  /* or gradient for dashboards */
    color: #1f2937;
  }

  /* DARK THEME COLORS */
  .dark-theme {
    background: #111827;
    color: #f3f4f6;
  }

  /* CHILD ELEMENT - LIGHT DEFAULT */
  .child-element {
    background: white;
    color: #1f2937;
    border: 1px solid #e5e7eb;
  }

  /* CHILD ELEMENT - DARK OVERRIDE */
  .dark-theme .child-element {
    background: #1f2937;
    color: #f3f4f6;
    border: 1px solid #374151;
  }

  /* ... MORE ELEMENTS ... */

  @media (max-width: 768px) {
    /* Responsive styles - same for both themes */
  }
`}</style>
```

---

## 6️⃣ CSS PATTERN - COMPLETE EXAMPLE

### Pattern for Cards/Containers

```css
.stat-card {
  /* Light theme (default) */
  margin:2px;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  color: #1f2937;
}

.dark-theme .stat-card {
  /* Dark theme override */
  margin:2px;
  background: #1f2937;
  border: 1px solid #374151;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  color: #f3f4f6;
}
```

### Pattern for Text

```css
.page-title {
  color: #1f2937;  /* Light theme */
}

.dark-theme .page-title {
  color: #f3f4f6;  /* Dark theme */
}
```

### Pattern for Interactive Elements

```css
.action-btn {
  background: white;
  border: 1px solid #d1d5db;
  color: #4f46e5;
  transition: all 0.3s ease;
}

.dark-theme .action-btn {
  background: #374151;
  border: 1px solid #4b5563;
  color: #60a5fa;
}

.action-btn:hover {
  background: #f3f4f6;  /* Works for light theme */
  border-color: #4f46e5;
}

.dark-theme .action-btn:hover {
  background: #4b5563;  /* Override for dark theme */
  border-color: #60a5fa;
}
```

### Pattern for Form Elements

```css
.form-input {
  background: white;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.dark-theme .form-input {
  background: #111827;
  color: #f3f4f6;
  border: 1px solid #374151;
}

.form-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.dark-theme .form-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);  /* Stronger for dark bg */
}
```

---

## 🎨 COLOR PALETTE - COPY/PASTE

### Light Theme
```css
/* Backgrounds */
background: #f9fafb;        /* Page background */
background: #f5f7fa;        /* Gradient start */
background: white;          /* Cards/containers */

/* Text */
color: #1f2937;            /* Primary text */
color: #6b7280;            /* Secondary text */
color: #9ca3af;            /* Tertiary text */

/* Borders & Dividers */
border: 1px solid #e5e7eb;
border: 1px solid #d1d5db;
color: #f3f4f6;            /* Divider lines */

/* Components */
background: #f9fafb;       /* Light backgrounds */
background: #dcfce7;       /* Success badge light */
background: #fee2e2;       /* Error badge light */
background: #dbeafe;       /* Info badge light */
```

### Dark Theme
```css
/* Backgrounds */
background: #111827;       /* Page background */
background: #1f2937;       /* Card background */
background: #374151;       /* Hover/secondary bg */

/* Text */
color: #f3f4f6;            /* Primary text */
color: #9ca3af;            /* Secondary text */

/* Borders & Dividers */
border: 1px solid #374151;
border: 1px solid #4b5563;

/* Components */
background: rgba(16, 185, 129, 0.15);     /* Success badge dark */
background: rgba(244, 63, 94, 0.15);      /* Error badge dark */
background: rgba(59, 130, 246, 0.15);     /* Info badge dark */

/* Text Colors for Badges */
color: #34d399;            /* Success text */
color: #f87171;            /* Error text */
color: #60a5fa;            /* Info text */
```

### Consistent Colors (Both Themes)
```css
/* Gradients - ALWAYS use these */
background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Interactive colors */
color: #4f46e5;            /* Primary accent */
color: #06b6d4;            /* Secondary accent */

/* Always visible in both modes */
opacity: 0.9;
opacity: 0.5;
```

---

## 📋 CSS COVERAGE CHECKLIST

For each page, ensure these elements have dark theme variants:

- [ ] Page wrapper/background
- [ ] Page titles and subtitles
- [ ] All text (primary, secondary, labels)
- [ ] All cards and containers
- [ ] All borders and dividers
- [ ] All buttons (primary, secondary, action)
- [ ] All form inputs and textareas
- [ ] All labels and placeholders
- [ ] Status badges and pills
- [ ] Error/success/info messages
- [ ] Empty states
- [ ] Loading states
- [ ] Hover states
- [ ] Focus states
- [ ] Active/inactive states

---

## 🔄 THEME SWITCHING FLOW

### User Interaction
1. User clicks theme toggle in OwnerNavbar
2. OwnerNavbar dispatches `themeChange` event
3. Each page listens for event
4. State updates → Re-render with new className

### File Structure
```
OwnerNavbar.jsx (toggles theme)
    ↓ dispatch event
Window.themeChange event
    ↓ triggers
OwnerDashboard.jsx (listens)
OwnerBookings.jsx (listens)  
AddHostel.jsx (listens)
```

---

## ⚡ Performance Notes

- Transition: `transition: background-color 0.3s ease;` creates smooth effect
- No layout thrashing (batch updates)
- Event listener properly cleaned up
- No unnecessary re-renders
- CSS selectors are efficient

---

## 🐛 Common Issues & Solutions

### Issue: Theme not persisting after refresh
**Solution:** Ensure localStorage is being read in useEffect
```javascript
const savedTheme = localStorage.getItem('theme')
setIsDark(savedTheme === 'dark')
```

### Issue: Body class not updating
**Solution:** Ensure body.classList is being updated
```javascript
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme')
} else {
  document.body.classList.remove('dark-theme')
}
```

### Issue: Styles not applying
**Solution:** Verify CSS selector specificity
```css
.dark-theme .child { ... }  /* Correct - high specificity */
.dark-theme child { ... }   /* Wrong - missing dot */
```

### Issue: Event not triggering
**Solution:** Verify OwnerNavbar is dispatching correctly
```javascript
window.dispatchEvent(new Event('themeChange'))
```

### Issue: Old theme showing briefly
**Solution:** Add transition to wrapper
```css
.component-wrapper {
  transition: background-color 0.3s ease;
}
```

---

## ✅ Implementation Checklist

When adding dark theme to a new page:

- [ ] Import `useEffect` in imports
- [ ] Add `const [isDark, setIsDark] = useState(false)`
- [ ] Add theme initialization useEffect (empty deps)
- [ ] Add wrapper className with ternary
- [ ] Create embedded `<style>` tag
- [ ] Add `.light-theme` styles
- [ ] Add `.dark-theme` overrides
- [ ] Test theme toggle
- [ ] Test page navigation with theme
- [ ] Test refresh with theme persistence
- [ ] Test all interactive elements
- [ ] Verify contrast and readability
- [ ] Check mobile responsiveness

---

## 📚 Reference Implementations

All three pages follow this exact pattern:
- `OwnerDashboard.jsx` ✅
- `OwnerBookings.jsx` ✅
- `AddHostel.jsx` ✅

Use these as templates for future dark theme implementations!
