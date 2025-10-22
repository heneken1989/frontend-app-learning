import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize,
  mergeConfig,
  getConfig,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage, PageWrap } from '@edx/frontend-platform/react';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Routes, Route, Navigate, BrowserRouter,
} from 'react-router-dom';

import { Helmet } from 'react-helmet';
import { fetchLiveTab } from './course-home/data/thunks';

import messages from './i18n';
import { UserMessagesProvider } from './generic/user-messages';

import './index.scss';
import { CourseExit } from './courseware/course/course-exit';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy loaded components
import {
  LearningHome,
  PaymentPage,
  PaymentSuccess,
  PaymentCancel,
  ProgressPage,
  EnrollmentStatusRoute,
  TestSeriesPage,
  CoursewareContainer,
  CoursewareRedirectLandingPage,
  OutlineTab,
  DatesTab,
  ProgressTab,
  LiveTab,
  GoalUnsubscribe,
  PreferencesUnsubscribe,
  PageNotFound,
  CourseAccessErrorPage,
  TabContainer,
} from './lazyComponents';

import { fetchDatesTab, fetchOutlineTab, fetchProgressTab } from './course-home/data';
import { fetchCourse } from './courseware/data';
import { store } from './store';
import NoticesProvider from './generic/notices';
import PathFixesProvider from './generic/path-fixes';
import DecodePageRoute from './decode-page-route';
import { DECODE_ROUTES, ROUTES } from './constants';
import PluginProvider from './PluginProvider';
import { preloadCriticalComponents } from './utils/preloadComponents';

// Simple test component for debugging
const TestComponent = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Test Component Working!</h1>
    <p>If you can see this, React Router is working.</p>
  </div>
);

subscribe(APP_READY, () => {
  const root = createRoot(document.getElementById('root'));

  // Start preloading critical components
  preloadCriticalComponents();

  root.render(
    <StrictMode>
      <AppProvider store={store} wrapWithRouter={false}>
        <BrowserRouter basename="/learning">
          <PluginProvider>
            <Helmet>
              <link rel="shortcut icon" href={getConfig().FAVICON_URL} type="image/x-icon" />
            </Helmet>
            <PathFixesProvider>
              <NoticesProvider>
                <UserMessagesProvider>
                  <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
                    <Routes>
                    <Route path="/" element={<PageWrap><LearningHome /></PageWrap>} />
                    <Route path="/enrollment-status" element={<PageWrap><EnrollmentStatusRoute /></PageWrap>} />
                    <Route path="/test-series" element={<PageWrap><TestSeriesPage /></PageWrap>} />
                    <Route
                      path={DECODE_ROUTES.HOME}
                      element={(
                        <DecodePageRoute>
                          <TabContainer tab="outline" fetch={fetchOutlineTab} slice="courseHome">
                            <OutlineTab />
                          </TabContainer>
                        </DecodePageRoute>
                  )}
                    />
                    <Route
                      path={DECODE_ROUTES.LIVE}
                      element={(
                        <DecodePageRoute>
                          <TabContainer tab="lti_live" fetch={fetchLiveTab} slice="courseHome">
                            <LiveTab />
                          </TabContainer>
                        </DecodePageRoute>
                  )}
                    />
                    <Route
                      path={DECODE_ROUTES.DATES}
                      element={(
                        <DecodePageRoute>
                          <TabContainer tab="dates" fetch={fetchDatesTab} slice="courseHome">
                            <DatesTab />
                          </TabContainer>
                        </DecodePageRoute>
                  )}
                    />
                    {DECODE_ROUTES.PROGRESS.map((route) => (
                      <Route
                        key={route}
                        path={route}
                        element={(
                          <DecodePageRoute>
                            <TabContainer
                              tab="progress"
                              fetch={fetchProgressTab}
                              slice="courseHome"
                              isProgressTab
                            >
                              <ProgressTab />
                            </TabContainer>
                          </DecodePageRoute>
                    )}
                      />
                    ))}
                    <Route
                      path={DECODE_ROUTES.SUBSEQUENCE_PROGRESS}
                      element={(
                        <PageWrap>
                          <ProgressPage />
                        </PageWrap>
                    )}
                    />
                    {DECODE_ROUTES.COURSEWARE.map((route) => (
                      <Route
                        key={route}
                        path={route}
                        element={(
                          <DecodePageRoute>
                            <CoursewareContainer />
                          </DecodePageRoute>
                    )}
                      />
                    ))}
                    {/* Learning Courseware Routes */}
                    <Route
                      path="/course/:courseId/:sequenceId/:unitId"
                      element={(
                        <DecodePageRoute>
                          <CoursewareContainer />
                        </DecodePageRoute>
                    )}
                    />
                    <Route
                      path="/course/:courseId/:sequenceId"
                      element={(
                        <DecodePageRoute>
                          <CoursewareContainer />
                        </DecodePageRoute>
                    )}
                    />
                    <Route path="/payment" element={<PageWrap><PaymentPage /></PageWrap>} />
                    <Route path="/payment/success" element={<PageWrap><PaymentSuccess /></PageWrap>} />
                    <Route path="/payment/cancel" element={<PageWrap><PaymentCancel /></PageWrap>} />
                    <Route path={ROUTES.UNSUBSCRIBE} element={<PageWrap><GoalUnsubscribe /></PageWrap>} />
                    <Route path={ROUTES.REDIRECT} element={<PageWrap><CoursewareRedirectLandingPage /></PageWrap>} />
                    <Route path={ROUTES.PREFERENCES_UNSUBSCRIBE} element={<PageWrap><PreferencesUnsubscribe /></PageWrap>} />
                    <Route path="*" element={<PageWrap><PageNotFound /></PageWrap>} />
                    </Routes>
                  </Suspense>
                </UserMessagesProvider>
              </NoticesProvider>
            </PathFixesProvider>
          </PluginProvider>
        </BrowserRouter>
      </AppProvider>
    </StrictMode>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  const root = createRoot(document.getElementById('root'));

  root.render(
    <StrictMode>
      <ErrorPage message={error.message} />
    </StrictMode>,
  );
});

initialize({
  handlers: {
    config: () => {
      mergeConfig({
        CONTACT_URL: process.env.CONTACT_URL || null,
        CREDENTIALS_BASE_URL: process.env.CREDENTIALS_BASE_URL || null,
        CREDIT_HELP_LINK_URL: process.env.CREDIT_HELP_LINK_URL || null,
        DISCUSSIONS_MFE_BASE_URL: process.env.DISCUSSIONS_MFE_BASE_URL || null,
        ENTERPRISE_LEARNER_PORTAL_HOSTNAME: process.env.ENTERPRISE_LEARNER_PORTAL_HOSTNAME || null,
        ENABLE_JUMPNAV: process.env.ENABLE_JUMPNAV || null,
        ENABLE_NOTICES: process.env.ENABLE_NOTICES || null,
        INSIGHTS_BASE_URL: process.env.INSIGHTS_BASE_URL || null,
        SEARCH_CATALOG_URL: process.env.SEARCH_CATALOG_URL || null,
        SOCIAL_UTM_MILESTONE_CAMPAIGN: process.env.SOCIAL_UTM_MILESTONE_CAMPAIGN || null,
        STUDIO_BASE_URL: process.env.STUDIO_BASE_URL || null,
        SUPPORT_URL: process.env.SUPPORT_URL || null,
        SUPPORT_URL_CALCULATOR_MATH: process.env.SUPPORT_URL_CALCULATOR_MATH || null,
        SUPPORT_URL_ID_VERIFICATION: process.env.SUPPORT_URL_ID_VERIFICATION || null,
        SUPPORT_URL_VERIFIED_CERTIFICATE: process.env.SUPPORT_URL_VERIFIED_CERTIFICATE || null,
        TERMS_OF_SERVICE_URL: process.env.TERMS_OF_SERVICE_URL || null,
        TWITTER_HASHTAG: process.env.TWITTER_HASHTAG || null,
        TWITTER_URL: process.env.TWITTER_URL || null,
        LEGACY_THEME_NAME: process.env.LEGACY_THEME_NAME || null,
        EXAMS_BASE_URL: process.env.EXAMS_BASE_URL || null,
        PROCTORED_EXAM_FAQ_URL: process.env.PROCTORED_EXAM_FAQ_URL || null,
        PROCTORED_EXAM_RULES_URL: process.env.PROCTORED_EXAM_RULES_URL || null,
        CHAT_RESPONSE_URL: process.env.CHAT_RESPONSE_URL || null,
        PRIVACY_POLICY_URL: process.env.PRIVACY_POLICY_URL || null,
        SHOW_UNGRADED_ASSIGNMENT_PROGRESS: process.env.SHOW_UNGRADED_ASSIGNMENT_PROGRESS || false,
        ENABLE_XPERT_AUDIT: process.env.ENABLE_XPERT_AUDIT || false,
      }, 'LearnerAppConfig');
    },
  },
  messages,
});
