import React, { useEffect, useState } from 'react';
import { readStorage, writeStorage } from './utils/storage.js';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PasswordRecoveryPage from './pages/PasswordRecoveryPage.jsx';
import { navigate } from './utils/navigation.js';

function getPageFromLocation() {
    const route = window.location.pathname.slice(1) + window.location.search;
    const base = route.split(/[/?]/)[0];
    return ['login', 'signup', 'home', 'projects', 'profile', 'peers', 'messages', 'forgot-password', 'reset-password'].includes(base) ? route : 'login';
}

export default function App() {
    const [page, setPage] = useState(getPageFromLocation);
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
                onLogOut={() => navigate('/login')}
                theme={theme}
                onToggleTheme={toggleTheme}
            />
        );
    }

    return (
        <LoginPage
            key={page.split('?')[0]}
            mode={page.split('?')[0]}
            onEnter={() => navigate('/home')}
            theme={theme}
            onToggleTheme={toggleTheme}
        />
    );
}

