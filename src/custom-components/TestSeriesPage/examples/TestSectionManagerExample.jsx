import React, { useState, useEffect } from 'react';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Button, Card, Alert, Badge } from '@openedx/paragon';
import { 
  getTestSections, 
  isTestSection, 
  getCurrentTestSection, 
  clearCurrentTestSection,
  checkTestModeFromURL,
  getTestSequences,
  getSequencesForTestSection,
  hasSequencesForTestSection,
  extractCourseInfoFromURL
} from '../utils/testSectionManager';

/**
 * Example component demonstrating TestSectionManager usage
 */
const TestSectionManagerExample = ({ intl }) => {
  const [testSections, setTestSections] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [currentURL, setCurrentURL] = useState(window.location.pathname);
  const [urlTestInfo, setUrlTestInfo] = useState(null);
  const [testSequences, setTestSequences] = useState({});

  // Load test sections from localStorage
  useEffect(() => {
    const sections = getTestSections();
    setTestSections(sections);
    
    const current = getCurrentTestSection();
    setCurrentTest(current);
    
    const testInfo = checkTestModeFromURL(currentURL);
    setUrlTestInfo(testInfo);
    
    const sequences = getTestSequences();
    setTestSequences(sequences);
  }, [currentURL]);

  // Simulate starting a test
  const startTest = (sectionId, courseId, sequenceId) => {
    // This would normally be called when user clicks "Start Test"
    const testInfo = {
      sectionId,
      courseId,
      sequenceId,
      startTime: Date.now(),
      isActive: true
    };
    
    localStorage.setItem('current_test_section', JSON.stringify(testInfo));
    setCurrentTest(testInfo);
    
    // Simulate navigation to test URL
    const testURL = `/learning/course/${courseId}/subsequence/${sequenceId}/progress`;
    setCurrentURL(testURL);
  };

  // Simulate ending a test
  const endTest = () => {
    clearCurrentTestSection();
    setCurrentTest(null);
    setCurrentURL('/learning/test-series');
  };

  // Simulate different URLs
  const simulateURL = (url) => {
    setCurrentURL(url);
  };

  return (
    <div className="container py-4">
      <h1>Test Section Manager Example</h1>
      
      {/* Current Status */}
      <Card className="mb-4">
        <Card.Header>
          <h3>Current Status</h3>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Current URL:</strong> <code>{currentURL}</code></p>
              <p><strong>Current Test:</strong> {currentTest ? 'Active' : 'None'}</p>
              {currentTest && (
                <div className="mt-2">
                  <p><strong>Test Section ID:</strong> {currentTest.sectionId}</p>
                  <p><strong>Course ID:</strong> {currentTest.courseId}</p>
                  <p><strong>Sequence ID:</strong> {currentTest.sequenceId}</p>
                  <p><strong>Start Time:</strong> {new Date(currentTest.startTime).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="col-md-6">
              <p><strong>URL Test Detection:</strong></p>
              {urlTestInfo ? (
                <Alert variant="success">
                  <strong>Test Mode Detected!</strong><br/>
                  Course: {urlTestInfo.courseId}<br/>
                  Section: {urlTestInfo.sectionId}<br/>
                  Sequence: {urlTestInfo.sequenceId}
                </Alert>
              ) : (
                <Alert variant="info">No test mode detected from URL</Alert>
              )}
              
              <div className="mt-3">
                <p><strong>URL Parsing:</strong></p>
                {(() => {
                  const courseInfo = extractCourseInfoFromURL(currentURL);
                  return courseInfo ? (
                    <div className="small">
                      <p><strong>Course ID:</strong> {courseInfo.courseId}</p>
                      <p><strong>Sequence ID:</strong> {courseInfo.sequenceId}</p>
                      <p><strong>Is Sequential:</strong> {courseInfo.isSequential ? 'Yes' : 'No'}</p>
                      <p><strong>Is Vertical:</strong> {courseInfo.isVertical ? 'Yes' : 'No'}</p>
                    </div>
                  ) : (
                    <p className="text-muted">No course info found in URL</p>
                  );
                })()}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Test Sections */}
      <Card className="mb-4">
        <Card.Header>
          <h3>Test Sections in localStorage</h3>
        </Card.Header>
        <Card.Body>
          {testSections.length > 0 ? (
            <div className="row">
              {testSections.map((section, index) => {
                const sequences = getSequencesForTestSection(section.id);
                const hasSequences = hasSequencesForTestSection(section.id);
                
                return (
                  <div key={index} className="col-md-6 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">{section.name}</h5>
                        <p className="card-text">
                          <strong>ID:</strong> {section.id}<br/>
                          <strong>Course:</strong> {section.courseId}<br/>
                          <strong>Sequences:</strong> {hasSequences ? (
                            <Badge variant="success">{sequences.length} sequences</Badge>
                          ) : (
                            <Badge variant="warning">No sequences cached</Badge>
                          )}
                        </p>
                        
                        {hasSequences && (
                          <div className="mt-2">
                            <p className="small text-muted">Sequences:</p>
                            <div className="small">
                              {sequences.slice(0, 3).map((seq, seqIndex) => (
                                <div key={seqIndex} className="text-truncate" title={seq.display_name}>
                                  {seq.display_name || seq.id}
                                </div>
                              ))}
                              {sequences.length > 3 && (
                                <div className="text-muted">... and {sequences.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="d-flex gap-2 mt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => startTest(section.id, section.courseId, `seq-${section.id}`)}
                          >
                            Start Test
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => simulateURL(`/learning/course/${section.courseId}/subsequence/seq-${section.id}/progress`)}
                          >
                            Simulate URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Alert variant="warning">
              No test sections found in localStorage. 
              Go to Test Series page to load test sections first.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* URL Simulation */}
      <Card className="mb-4">
        <Card.Header>
          <h3>URL Simulation</h3>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <h5>Test URLs</h5>
              <Button
                variant="outline-primary"
                className="me-2 mb-2"
                onClick={() => simulateURL('/learning/test-series')}
              >
                Test Series Page
              </Button>
              <Button
                variant="outline-primary"
                className="me-2 mb-2"
                onClick={() => simulateURL('/learning/course/test-course/subsequence/test-seq/progress')}
              >
                Test Course URL
              </Button>
              <Button
                variant="outline-primary"
                className="me-2 mb-2"
                onClick={() => simulateURL('/learning/course/course-v1:Manabi+N51+2026/block-v1:Manabi+N51+2026+type@sequential+block@26bda9b5c2b54e6d855bc6259903286d/block-v1:Manabi+N51+2026+type@vertical+block@833840f30afa4b30926faaa76f078c92')}
              >
                Open edX Quiz URL
              </Button>
            </div>
            <div className="col-md-6">
              <h5>Regular URLs</h5>
              <Button
                variant="outline-secondary"
                className="me-2 mb-2"
                onClick={() => simulateURL('/learning/course/regular-course/subsequence/regular-seq/progress')}
              >
                Regular Course URL
              </Button>
              <Button
                variant="outline-secondary"
                className="me-2 mb-2"
                onClick={() => simulateURL('/learning/dashboard')}
              >
                Dashboard
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Actions */}
      <Card>
        <Card.Header>
          <h3>Actions</h3>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2">
            <Button
              variant="danger"
              onClick={endTest}
              disabled={!currentTest}
            >
              End Current Test
            </Button>
            <Button
              variant="outline-info"
              onClick={() => {
                setTestSections(getTestSections());
                setCurrentTest(getCurrentTestSection());
              }}
            >
              Refresh Data
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

TestSectionManagerExample.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(TestSectionManagerExample);
