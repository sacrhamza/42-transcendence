import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './style.css';
import './home.css';
import './projects.css';
import './profile.css';
import './rooms.css';
import './peers.css';

// Keep old bookmarks working while using clean paths from now on.
if (window.location.hash.startsWith('#/')) {
    window.history.replaceState(null, '', window.location.hash.slice(1));
} else if (window.location.pathname === '/') {
    window.history.replaceState(null, '', '/login' + window.location.search);
}

createRoot(document.getElementById('root')).render(<App />);
import './community.css';
import './messages.css';
