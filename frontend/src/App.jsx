import React, { useEffect, useState } from 'react';
import { readStorage, writeStorage } from './utils/storage.js';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PasswordRecoveryPage from './pages/PasswordRecoveryPage.jsx';
import EmailVerificationPage from './pages/EmailVerificationPage.jsx';
import { navigate } from './utils/navigation.js';

function getPageFromLocation() {
    const route = window.location.pathname.slice(1) + window.location.search;
    const sharedPost = /^home_post_([A-Za-z0-9_-]+)$/.exec(window.location.pathname.slice(1));
    // Keep feed selection consistent for both new links and older bookmarks.
    if (sharedPost) return `home?post=${sharedPost[1]}`;
    const base = route.split(/[/?]/)[0];
    return ['login', 'signup', 'verify-email', 'home', 'projects', 'profile', 'peers', 'messages', 'forgot-password', 'reset-password'].includes(base) ? route : 'login';
}

export default function App() {
    const [page, setPage] = useState(getPageFromLocation);
    // Tokens live in HttpOnly cookies. This flag only controls frontend navigation.
    const [authenticated, setAuthenticated] = useState(false);
    const requiresSession = !['login', 'signup', 'verify-email', 'forgot-password', 'reset-password'].includes(page.split(/[/?]/)[0]);

    useEffect(() => {
        if (requiresSession && !authenticated) navigate('/login', { replace: true });
    }, [requiresSession, authenticated, page]);
    const [theme, setTheme] = useState(() => {
        return readStorage('suf-theme', 'dark');
    });

    useEffect(() => {
        function handleNavigation() {
            setPage(getPageFromLocation());
        }

        function handleLinkClick(event) {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const link = event.target.closest('a[href]');
            if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
            const destination = new URL(link.href);
            if (destination.origin !== window.location.origin || destination.hash) return;
            event.preventDefault();
            navigate(destination.pathname + destination.search);
        }

        window.addEventListener('popstate', handleNavigation);
        document.addEventListener('click', handleLinkClick);
        return () => {
            window.removeEventListener('popstate', handleNavigation);
            document.removeEventListener('click', handleLinkClick);
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle('light-theme', theme === 'light');
        writeStorage('suf-theme', theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((currentTheme) =>
            currentTheme === 'dark' ? 'light' : 'dark',
        );
    }

    const recoveryPage = page.split('?')[0];
    if (requiresSession && !authenticated) return null;
    if (recoveryPage === 'verify-email') return <EmailVerificationPage />;
    if (['forgot-password', 'reset-password'].includes(recoveryPage)) {
        return (
            <PasswordRecoveryPage
                key={page}
                reset={recoveryPage === 'reset-password'}
                theme={theme}
                onToggleTheme={toggleTheme}
            />
        );
    }

    if (!['login', 'signup'].includes(page.split('?')[0])) {
        return (
            <HomePage
                section={page.split(/[/?]/)[0]}
                messageUsername={page.startsWith('messages/') ? page.slice(9).split('?')[0] : null}
                profileUsername={page.startsWith('profile/') ? page.slice(8).split('?')[0] : null}
                postId={page.startsWith('home?') ? new URLSearchParams(page.split('?')[1]).get('post') : null}
                projectId={page.startsWith('projects?') ? new URLSearchParams(page.split('?')[1]).get('project') : null}
                onLogOut={() => {
                    setAuthenticated(false);
                    navigate('/login');
                }}
                theme={theme}
                onToggleTheme={toggleTheme}
            />
        );
    }

    return (
        <LoginPage
            key={page}
            mode={page.split('?')[0]}
            initialNotice={new URLSearchParams(page.split('?')[1]).get('verification') === 'success'
                ? 'You have registered successfully. You can now log in to SUF.'
                : new URLSearchParams(page.split('?')[1]).get('verification') === 'expired'
                    ? 'Your verification link is invalid, expired, or already used. Please sign up again to get a new link. If you already verified your email, try logging in.'
                    : ''}
            onEnter={() => {
                setAuthenticated(true);
                navigate('/home');
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
        />
    );
}

