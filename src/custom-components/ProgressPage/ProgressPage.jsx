import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';
import { Button, Card, ProgressBar, useWindowSize } from '@openedx/paragon';
import LearningHeader from '../Header/src/learning-header/LearningHeader';
import Footer from '../Footer';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const ProgressPage = () => {
  const { courseId, subsequenceId } = useParams();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const windowWidth = useWindowSize().width;

  useEffect(() => {
    const fetchProgress = async () => {
      if (!subsequenceId) {
        console.error('Missing subsequence ID');
        setError('Missing subsequence ID');
        return;
      }

      try {
        // Log configuration
        console.log('Config:', {
          LMS_BASE_URL: getConfig().LMS_BASE_URL,
          courseId,
          subsequenceId,
        });
        
        const apiUrl = `${getConfig().LMS_BASE_URL}/api/courseware/v1/subsequence/${courseId}/${subsequenceId}/progress`;
        const response = await fetch(apiUrl, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();


        setProgressData(data);
      } catch (err) {
        console.error('Error fetching progress:', err);
        setError(err.message);
      }
    };

    fetchProgress();
  }, [courseId, subsequenceId]);

  const handleStartLearning = () => {
    navigate(`/course/${courseId}/${subsequenceId}`);
  };

  if (windowWidth === undefined) {
    return null;
  }

  const renderContent = () => {
    if (error) {
      return (
        <Card className="p-4">
          <h3 className="text-danger">Error loading progress</h3>
          <p>{error}</p>
          <pre className="bg-light p-3 rounded">Debug Info:
            LMS Base URL: {getConfig().LMS_BASE_URL}
            Course ID: {courseId}
            Subsequence ID: {subsequenceId}
          </pre>
        </Card>
      );
    }

    if (!progressData) {
      return (
        <Card className="p-4 text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading progress...</p>
        </Card>
      );
    }

    const completeCount = progressData.complete_count || 0;
    const incompleteCount = progressData.incomplete_count || 0;
    const lockedCount = progressData.locked_count || 0;
    console.log('Progress Data:', {
      completeCount,
      incompleteCount,
      lockedCount,
      rawProgressData: progressData
    });
    const totalUnits = progressData.total_units || 0;
    const remainingCount = totalUnits - completeCount;

    const donutData = [
      { name: '練習済みの問題', value: completeCount },
      { name: '残りの問題', value: remainingCount },
    ];
    const COLORS = ['#2196f3', '#e0e0e0']; // blue, light grey

    return (
      <div
        style={{
          width: '100vw',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#fff',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 24, textAlign: 'center' }}>
          {totalUnits > 0 ? `${totalUnits}問中${completeCount}問を練習しました` : '問題がありません'}
        </div>
        <div style={{ padding: 32, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PieChart width={400} height={400}>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={110}
              outerRadius={160}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {donutData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
          {/* Custom Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, gap: 32 }}>
            {donutData.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 600, color: COLORS[index % COLORS.length] }}>
                <span style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: COLORS[index % COLORS.length],
                  marginRight: 8,
                }} />
                {entry.name}
              </div>
            ))}
          </div>
          {/* Start Practice Button */}
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Button 
              variant="danger" 
              size="lg" 
              onClick={handleStartLearning}
              style={{ 
                backgroundColor: '#dc3545',
                borderColor: '#dc3545',
                '&:hover': {
                  backgroundColor: '#c82333',
                  borderColor: '#bd2130'
                }
              }}
            >
                   練習開始
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <LearningHeader 
        courseId={courseId}
        courseTitle={progressData?.title || 'Course Progress'}
      />
      {/* Fullscreen, no container, no footer */}
      <div style={{ width: '100vw', minHeight: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: '#fff' }}>
          {renderContent()}
      </div>
    </>
  );
};

export default ProgressPage; 