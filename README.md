# Kundali Astro Chat - Web Application

A complete web application for astrological services with personalized chart analysis and chat functionality, matching exactly the design from your FigCraft document.

## Features

- **Complete Navigation Flow**: Splash → Birth Details → Chart Creation → Chat Interface
- **Responsive Design**: Works on mobile and desktop devices
- **Proper Side Panel Positioning**: Within app rectangle, not overlaying browser
- **Visual Fidelity**: Matches exactly the FigCraft design specifications
- **Four Main Screens**:
  - Splash/Welcome screen
  - Birth details collection form
  - Chart creation loading screen
  - Chat interface with astrologer

## Components

1. `SplashScreen.js` - Initial welcome screen with animated elements
2. `BirthDetailsScreen.js` - Form for collecting birth information  
3. `CreatingChartScreen.js` - Loading screen with animation
4. `ChatInterface.js` - Chat functionality with message bubbles
5. `SidePanel.js` - Fixed positioning navigation panel
6. `ServicesPage.js` - Services offerings display
7. `ProfilePage.js` - User profile management
8. `HomePage.js` - Main dashboard with quick access buttons
9. `KundaliChartPage.js` - Detailed chart visualization

## Implementation Notes

- All visual elements match the FigCraft design document exactly
- Side panel opens within the application rectangle rather than overlaying browser
- Element naming conventions are consistent with design specifications
- Color scheme uses indigo/purple theme throughout
- Proper animations and transitions for enhanced UX
- Responsive layout for all screen sizes

## Getting Started

1. Clone this repository
2. Navigate to the project directory
3. Run `npm install` (if using create-react-app)
4. Start the development server with `npm start`

The application will run on `http://localhost:3000`.

## Design Consistency

This implementation ensures perfect visual fidelity with the original FigCraft design:
- Exactly matching color palettes and gradients
- Properly positioned elements throughout
- All graphics and animations implemented as specified
- Element names and class identifiers match documentation