'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Get token from URL parameters
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('No token received from authentication provider.');
          return;
        }

        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
      } catch (error) {
        console.error('Error storing token:', error);
        setStatus('error');
        setMessage('Failed to store authentication token.');
      }
    };

    handleCallback();
  }, [searchParams]);

  const handleManualRedirect = () => {
    window.location.href = '/';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Status Icon */}
        <div style={{ marginBottom: '20px', fontSize: '48px' }}>
          {status === 'processing' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>

        {/* Status Title */}
        <h1 style={{
          margin: '0 0 15px 0',
          fontSize: '24px',
          color: status === 'error' ? '#e74c3c' : '#333'
        }}>
          {status === 'processing' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>

        {/* Status Message */}
        <p style={{
          margin: '0 0 30px 0',
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* Manual Redirect Button (shown on success or error) */}
        {status !== 'processing' && (
          <button
            onClick={handleManualRedirect}
            style={{
              padding: '12px 24px',
              backgroundColor: status === 'success' ? '#27ae60' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 
                status === 'success' ? '#229954' : '#2980b9';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 
                status === 'success' ? '#27ae60' : '#3498db';
            }}
          >
            {status === 'success' ? 'Continue to Home' : 'Go to Home'}
          </button>
        )}

        {/* Loading animation for processing state */}
        {status === 'processing' && (
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}>
          </div>
        )}
      </div>

      {/* CSS for loading animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}