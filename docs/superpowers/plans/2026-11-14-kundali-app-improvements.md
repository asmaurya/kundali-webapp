# Kundali Astro Chat App - Design Fidelity Improvements

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the Kundali Astro Chat application implementation to exactly match the visual design from the FigCraft document, with proper side panel positioning and element naming consistency.

**Architecture:** Complete web application with React components for each screen and a consistent navigation structure using a side panel that appears within the application window rather than overlaying the browser.

**Tech Stack:** React with Tailwind CSS, HTML/CSS/JavaScript

**Spec:** FigCraft design document specifications

## Global Constraints

- All visual elements must match the exact style from the FigCraft document
- Side panel navigation must open within the application rectangle (not over the entire browser)
- Element naming conventions must be consistent with FigCraft design
- Color scheme and typography must be exactly preserved
- All four main screens (splash, birth details, chart creation, chat) must be implemented correctly

## Review Focus

- Visual fidelity to FigCraft design elements
- Side panel position and overlay behavior
- Element naming consistency with design document
- UI layout accuracy and spacing  
- Navigation workflow correctness

---
### Task 1: Analyze Current Implementation vs FigCraft Design

**Files:**
- None (analysis only)

**Interfaces:**
- Consumes: Current codebase implementation
- Produces: Analysis report for design fixes

- [ ] **Step 1: Write the failing test**

```markdown
Test to identify missing visual elements from FigCraft design:
- Document color schemes and typography 
- Identify exact layout components and positioning
- Compare with current implementation
- Note specific graphic elements that don't match

Expected result: Detailed report of discrepancies 
```

- [ ] **Step 2: Run test to verify it fails**

Run: Manual code inspection analysis 
Expected: Find discrepancies in visual fidelity  

- [ ] **Step 3: Analyze exact FigCraft design and document gaps**

Document the specific differences between current implementation and FigCraft design:
1. Side panel positioning - currently overlaying browser, should be within app rectangle
2. Graphic element rendering - missing specific icons/components
3. Color palette inconsistencies 
4. Text and typography differences

- [ ] **Step 4: Run test to verify it passes**

Run: Manual review comparing current vs FigCraft design
Expected: Complete gap analysis report

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-11-14-kundali-app-improvements.md
git commit -m "docs: analyze current implementation gaps with FigCraft design"
```

### Task 2: Implement Proper Side Panel Positioning

**Files:**
- src/components/SidePanel.js (modified)
- src/App.js (modified)

**Interfaces:**
- Consumes: Current application state management and navigation
- Produces: Side panel component that opens inside app rectangle

- [ ] **Step 1: Write the failing test**

```javascript
// Test to verify side panel opens within app rather than browser overlay
function testSidePanelPositioning() {
  // Should render within app container not as full browser overlay
  const panel = document.querySelector('.side-panel');
  const appContainer = document.querySelector('.app-container');
  
  expect(panel).to.not.equal(null);
  expect(panel.parentElement).to.equal(appContainer); // Critical: within app container
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: Execute current side panel implementation 
Expected: FAIL - panel currently on full browser overlay

- [ ] **Step 3: Implement proper side panel positioning within app rectangle**

Modify SidePanel component to:
1. Adjust CSS positioning to be absolutely positioned within App container
2. Remove overlay background that covers entire browser  
3. Use appropriate z-index for proper layering
4. Maintain same functionality but correct positioning

- [ ] **Step 4: Run test to verify it passes**

Run: Test with new positioning
Expected: PASS - panel properly within app rectangle

- [ ] **Step 5: Commit**

```bash
git add src/components/SidePanel.js src/App.js
git commit -m "feat: fix side panel positioning within app rectangle"
```

### Task 3: Update Element Naming Consistency with FigCraft Design

**Files:**
- All component files (Update element IDs, class names, etc.)

**Interfaces:**
- Consumes: Current component naming conventions 
- Produces: Components with exact FigCraft element names

- [ ] **Step 1: Write the failing test**

```javascript
// Test element naming consistency
function testElementNamingConsistency() {
  // All components should use consistent naming from design document
  const expectedComponentNames = [
    'splash-screen', 
    'birth-details-screen',
    'creating-chart-screen', 
    'chat-interface',
    'side-panel',
    'services-page',
    'profile-page',
    'home-page',
    'kundali-chart-page'
  ];
  
  // Verify all expected class names present
  const actualNames = document.querySelectorAll('*[class]').map(el => el.className);
  expectedComponentNames.forEach(name => {
    expect(actualNames).to.contain(name);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: Check current component naming convention
Expected: FAIL - may have inconsistent class/id names  

- [ ] **Step 3: Update all component naming to match design document exactly**

1. Rename all elements to match FigCraft design element IDs 
2. Ensure consistent class naming system
3. Maintain proper semantic HTML structure
4. Keep element hierarchy matching the design

- [ ] **Step 4: Run test to verify it passes**

Run: Verify updated names
Expected: PASS - all component names match design documentation exactly  

- [ ] **Step 5: Commit**

```bash
git add src/components/*.js 
git commit -m "refactor: align element naming with FigCraft design"
```

### Task 4: Restore and Apply Exact FigCraft Graphics

**Files:**
- update all graphic elements to match exact styles from FigCraft

**Interfaces:**
- Consumes: Current graphic implementations  
- Produces: Elements using correct graphics exactly as in FigCraft

- [ ] **Step 1: Write the failing test**

```javascript
// Test that graphic elements match FigCraft styles exactly 
function testGraphicFidelity() {
  // Check each visual element matches FigCraft design:
  // - Zodiak wheel style (exact colors and animation)
  // - Button styling (shadows, spacing, colors)  
  // - Typography hierarchy
  // - Background gradients
  // - Message bubble styling
   
  const zodiacWheel = document.querySelector('.zodiac-wheel');
  expect(zodiacWheel.style.background).to.equal('linear-gradient...');
  
  const messageBubble = document.querySelector('.user-bubble');  
  expect(messageBubble.style.borderRadius).to.equal('20px');
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: Compare current graphics with design
Expected: FAIL - some styling differs from design  

- [ ] **Step 3: Apply exact graphic styling from FigCraft design**

1. Update CSS for zodiac wheel animation and styling
2. Match all button styles with design
3. Implement correct shadow effects  
4. Adjust typography to match exactly
5. Set precise color values used in design document

- [ ] **Step 4: Run test to verify it passes**

Run: Verify visual consistency 
Expected: PASS - all graphics match design document exactly 

- [ ] **Step 5: Commit**

```bash
git add src/App.css src/components/*.js src/index.html
git commit -m "style: align all graphics with FigCraft design"
```

### Task 5: Final Integration and Testing

**Files:**
- Complete integration of all improvements  

**Interfaces:**
- Consumes: All previously implemented fixes
- Produces: Fully functional application matching FigCraft design exactly

- [ ] **Step 1: Write the failing test**

```javascript
// Complete integration end-to-end test
function testFullAppIntegration() {
   // Test complete workflow:
   // 1. Splash screen -> birth details -> chart creation -> chat interface  
   // 2. Side panel navigation works as designed 
   // 3. All graphics match FigCraft exactly
   // 4. Navigation between all screens functions properly
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: Execute complete application workflow
Expected: FAIL - may still have integration issues  

- [ ] **Step 3: Final comprehensive testing and refinement**

Perform final end-to-end testing:
1. All navigation flows work correctly  
2. All visual elements match FigCraft design exactly
3. Side panel appears within app rectangle as designed
4. Element naming is consistent with design documents  
5. Application functions properly across all screens

- [ ] **Step 4: Run test to verify it passes**

Run: Final comprehensive check 
Expected: PASS - application matches design exactly

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "fix: complete implementation matching FigCraft design"
```