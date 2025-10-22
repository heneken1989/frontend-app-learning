import React, { useState, useEffect } from 'react';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Button, Card, Alert } from '@openedx/paragon';
import TestAwareLearningHeader from '../components/TestAwareLearningHeader';
import useTestDetection from '../hooks/useTestDetection';
import { getAllTestSequences } from '../utils/testDetection';

/**
 * Example component demonstrating how to use test detection
 */
const TestDetectionExample = ({ intl }) => {
  const [currentUnitId, setCurrentUnitId] = useState('unit-123');
  const [currentCourseId, setCurrentCourseId] = useState('course-456');
  const [preloadedData, setPreloadedData] = useState({});
  const [testSequences, setTestSequences] = useState([]);

  // Use test detection hook
  const { 
    testConfig, 
    isLoading, 
    isTestUnit, 
    testId, 
    testName, 
    testTimeInMinutes 
  } = useTestDetection(currentUnitId, currentCourseId, null, preloadedData);

  // Load test sequences
  useEffect(() => {
    const sequences = getAllTestSequences(preloadedData);
    setTestSequences(sequences);
  }, [preloadedData]);

  // Simulate different unit scenarios
  const simulateUnit = (unitId, courseId) => {
    setCurrentUnitId(unitId);
    setCurrentCourseId(courseId);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <TestAwareLearningHeader
        intl={intl}
        courseId={currentCourseId}
        unitId={currentUnitId}
        preloadedData={preloadedData}
      />
      
      <main className="flex-grow-1 p-4">
        <div className="container">
          <h1>Test Detection Example</h1>
          
          {/* Current Status */}
          <Card className="mb-4">
            <Card.Header>
              <h3>Current Status</h3>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Unit ID:</strong> {currentUnitId}</p>
                  <p><strong>Course ID:</strong> {currentCourseId}</p>
                  <p><strong>Is Test Unit:</strong> {isTestUnit ? 'Yes' : 'No'}</p>
                </div>
                <div className="col-md-6">
                  {isTestUnit ? (
                    <div>
                      <p><strong>Test ID:</strong> {testId}</p>
                      <p><strong>Test Name:</strong> {testName}</p>
                      <p><strong>Test Time:</strong> {testTimeInMinutes} minutes</p>
                    </div>
                  ) : (
                    <p className="text-muted">This is a regular quiz unit</p>
                  )}
                </div>
              </div>
              
              {isTestUnit && (
                <Alert variant="info" className="mt-3">
                  <strong>Test Mode Detected!</strong> The timer will show total test time instead of individual quiz time.
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Test Sequences */}
          <Card className="mb-4">
            <Card.Header>
              <h3>Available Test Sequences</h3>
            </Card.Header>
            <Card.Body>
              {testSequences.length > 0 ? (
                <div className="row">
                  {testSequences.map((sequence, index) => (
                    <div key={index} className="col-md-6 mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h5 className="card-title">{sequence.name}</h5>
                          <p className="card-text">
                            <strong>Course:</strong> {sequence.courseName}<br/>
                            <strong>Section:</strong> {sequence.sectionName}<br/>
                            <strong>Units:</strong> {sequence.unitCount}
                          </p>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => simulateUnit(`unit-${sequence.id}`, sequence.courseId)}
                          >
                            Simulate Unit in This Test
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No test sequences found. Load some course data first.</p>
              )}
            </Card.Body>
          </Card>

          {/* Simulation Controls */}
          <Card>
            <Card.Header>
              <h3>Simulation Controls</h3>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <h5>Test Units</h5>
                  <Button
                    variant="primary"
                    className="me-2 mb-2"
                    onClick={() => simulateUnit('test-unit-1', 'test-course-1')}
                  >
                    Test Unit 1
                  </Button>
                  <Button
                    variant="primary"
                    className="me-2 mb-2"
                    onClick={() => simulateUnit('test-unit-2', 'test-course-2')}
                  >
                    Test Unit 2
                  </Button>
                </div>
                <div className="col-md-6">
                  <h5>Regular Quiz Units</h5>
                  <Button
                    variant="outline-secondary"
                    className="me-2 mb-2"
                    onClick={() => simulateUnit('quiz-unit-1', 'regular-course-1')}
                  >
                    Quiz Unit 1
                  </Button>
                  <Button
                    variant="outline-secondary"
                    className="me-2 mb-2"
                    onClick={() => simulateUnit('quiz-unit-2', 'regular-course-2')}
                  >
                    Quiz Unit 2
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </main>
    </div>
  );
};

TestDetectionExample.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(TestDetectionExample);
