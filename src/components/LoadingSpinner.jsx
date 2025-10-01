import React from 'react';
import { Spinner } from '@openedx/paragon';

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '2rem',
    textAlign: 'center'
  }}>
    <Spinner
      animation="border"
      variant="primary"
      size="lg"
      style={{ marginBottom: '1rem' }}
    />
    <p style={{ 
      color: '#666', 
      fontSize: '1rem',
      margin: 0,
      fontFamily: "'Noto Serif JP', 'Noto Sans JP', 'Kosugi Maru', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    }}>
      {message}
    </p>
  </div>
);

export default LoadingSpinner;
