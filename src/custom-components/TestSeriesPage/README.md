# Test Series Page

A comprehensive test management page for the learning platform that displays test series and individual tests with progress tracking.

## Features

- **Test Series View**: Shows grouped tests with progress bars and completion status
- **Individual Tests View**: Displays standalone tests with scores and completion status
- **Progress Tracking**: Visual progress bars and completion percentages
- **Expandable Details**: Click to show/hide individual test details within series
- **Test Actions**: Start new tests or retake completed ones
- **Responsive Design**: Works on desktop and mobile devices
- **Loading States**: Shows loading spinner while fetching data
- **Error Handling**: Displays error messages with retry options

## Components

### TestSeriesPage.jsx
Main component that renders the test series page with tabs for Series and Individual Tests.

### TestSeriesPage.scss
Styles for the test series page including responsive design and animations.

### api/testApi.js
API functions for fetching test data and starting tests.

## Usage

1. Import the component:
```jsx
import TestSeriesPage from './custom-components/TestSeriesPage';
```

2. Add to your routing:
```jsx
<Route path="/learning/test-series" element={<TestSeriesPage />} />
```

3. The component will automatically:
   - Check for authenticated users
   - Fetch test data from the API
   - Display loading states
   - Handle errors gracefully

## API Endpoints

The component expects the following API endpoints:

- `GET /api/test-series/` - Fetch test series data
- `GET /api/individual-tests/` - Fetch individual tests data
- `POST /api/tests/{id}/start/` - Start a test

## Data Structure

### Test Series
```javascript
{
  id: number,
  title: string,
  progress: number,
  total: number,
  type: 'series',
  tests: [
    {
      id: number,
      name: string,
      completed: boolean,
      score: number | null
    }
  ]
}
```

### Individual Tests
```javascript
{
  id: number,
  name: string,
  completed: boolean,
  score: number | null,
  type: 'individual'
}
```

## Styling

The component uses SCSS with the following key classes:
- `.test-series-page` - Main container
- `.test-series-card` - Individual test series cards
- `.individual-test-card` - Individual test cards
- `.progress-container` - Progress bar container
- `.tab-navigation` - Tab navigation styling

## Responsive Design

The component is fully responsive and adapts to different screen sizes:
- Desktop: Full layout with side-by-side elements
- Tablet: Adjusted spacing and sizing
- Mobile: Stacked layout with full-width elements
