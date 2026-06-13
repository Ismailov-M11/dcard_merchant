import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './features/auth/AuthContext';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { CurtainProvider } from './providers/CurtainProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <CurtainProvider>
              <App />
            </CurtainProvider>
          </BrowserRouter>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
