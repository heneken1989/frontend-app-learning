import { lazy } from 'react';

// Lazy load main page components
export const LearningHome = lazy(() => import('./custom-components/LearningHome'));
export const PaymentPage = lazy(() => import('./custom-components/PaymentPage'));
export const PaymentSuccess = lazy(() => import('./custom-components/PaymentSuccess'));
export const PaymentCancel = lazy(() => import('./custom-components/PaymentCancel'));
export const ProgressPage = lazy(() => import('./custom-components/ProgressPage'));
export const EnrollmentStatusRoute = lazy(() => import('./custom-components/EnrollmentStatus/src/EnrollmentStatusRoute'));
export const TestSeriesPage = lazy(() => import('./custom-components/TestSeriesPage'));
export const TestResultsPage = lazy(() => import('./custom-components/TestSeriesPage/components/TestResultsPage'));
export const ModuleTransitionPage = lazy(() => import('./custom-components/TestSeriesPage/components/ModuleTransitionPage'));

// Lazy load courseware components
export const CoursewareContainer = lazy(() => import('./courseware'));
export const CoursewareRedirectLandingPage = lazy(() => import('./courseware/CoursewareRedirectLandingPage'));

// Lazy load tab components
export const OutlineTab = lazy(() => import('./course-home/outline-tab'));
export const DatesTab = lazy(() => import('./course-home/dates-tab'));
export const ProgressTab = lazy(() => import('./course-home/progress-tab/ProgressTab'));
export const LiveTab = lazy(() => import('./course-home/live-tab/LiveTab'));

// Lazy load utility components
export const GoalUnsubscribe = lazy(() => import('./course-home/goal-unsubscribe'));
export const PreferencesUnsubscribe = lazy(() => import('./preferences-unsubscribe'));
export const PageNotFound = lazy(() => import('./generic/PageNotFound'));
export const CourseAccessErrorPage = lazy(() => import('./generic/CourseAccessErrorPage'));

// Lazy load tab container
export const TabContainer = lazy(() => import('./tab-page').then(module => ({ default: module.TabContainer })));
