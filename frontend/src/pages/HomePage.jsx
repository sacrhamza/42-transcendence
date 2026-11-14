import React, { useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage } from '../utils/storage.js';
import { createId } from '../utils/createId.js';
import { navigate } from '../utils/navigation.js';
import { loadProfile } from '../utils/profile.js';
import PostComposer from '../components/PostComposer.jsx';
import { validatePostFile } from '../utils/community.js';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';
import RightPanel from '../components/RightPanel.jsx';
import MessagesPage from './MessagesPage.jsx';
import useBrowserState from '../hooks/useBrowserState.js';
import { initialConversations, normalizeConversations, sendDirectMessage, toggleMessageLike } from '../data/messagesData.js';
import PeersPage from './PeersPage.jsx';
import PublicProfilePage from './PublicProfilePage.jsx';
import { peerDirectory, initialRelationships, changeRelationship } from '../data/peersData.js';
import ProfilePage from './ProfilePage.jsx';
import ProjectsPage from './ProjectsPage.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { initialPosts } from '../data/homeData.js';

const POSTS_PER_PAGE = 20;

export default function HomePage({ onLogOut, theme, onToggleTheme, section = 'home', profileUsername = null, projectId = null, postId = null, messageUsername = null }) {
    const [conversations, setConversations, messageStorageNotice, messagesReady] = useBrowserState('messages', () => {
        try {
            return normalizeConversations(JSON.parse(readStorage('suf-direct-messages', 'null')), peerDirectory.map((peer) => peer.username));
        } catch {
            return initialConversations();
        }
    });
    function readConversation(username) {
        setConversations((current) => !current[username]?.unread ? current : {
            ...current,
            [username]: { ...current[username], unread: 0 },
        });
    }

    function startConversation(username) {
        if (!peerDirectory.some((peer) => peer.username === username)) return;
        if (!conversations[username] && relationships[username] !== 'connected') return;
        setConversations((current) => current[username] ? current : {
            ...current, [username]: { username, messages: [], unread: 0 },
        });
        navigate('/messages/' + username);
    }

    const [currentProfile, setCurrentProfile] = useState(loadProfile);
    const [relationships, setRelationships] = useState(() => {
        try {
            const stored = JSON.parse(readStorage('suf-peer-relationships', 'null'));
            if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return initialRelationships;
            return Object.fromEntries(peerDirectory.map((peer) => [
                peer.username,
                ['none', 'outgoing', 'incoming', 'connected'].includes(stored[peer.username]) ? stored[peer.username] : 'none',
            ]));
        } catch {
            return initialRelationships;
        }
    });
    const [peerNotice, setPeerNotice] = useState('');

    function handlePeerAction(username, action) {
        const updated = changeRelationship(relationships, username, action);
        if (updated === relationships) return;
        setRelationships(updated);
        const messages = {
            send: 'Request added to Sent.',
            cancel: 'Request cancelled.',
            accept: 'Request accepted. You are now peers.',
            decline: 'Request declined.',
        };
        const saved = writeStorage('suf-peer-relationships', JSON.stringify(updated));
        setPeerNotice(messages[action] + (saved ? ' Preview only; no real request was sent.' : ' Browser storage is unavailable; this change lasts for this session.'));
    }

    useEffect(() => {
        setQuery('');
        setPeerNotice('');
    }, [section, profileUsername]);

    const [activeItem, setActiveItem] = useState('Home');

    function updatePost(id, change) {
        setPosts((current) => current.map((post) => post.id === id ? change(post) : post));
    }
    const [posts, setPosts, postStorageNotice, postsReady] = useBrowserState('posts', initialPosts);
    const [query, setQuery] = useState('');
    const [pageNotice, setPageNotice] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [savedIds, setSavedIds] = useState(() => {
        try {
            const saved = JSON.parse(readStorage('suf-saved-posts', '[]'));
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    });

    function toggleSaved(postId) {
        setSavedIds((current) => {
            const updated = current.includes(postId)
                ? current.filter((id) => id !== postId)
                : [...current, postId];
            if (!writeStorage('suf-saved-posts', JSON.stringify(updated))) {
                setPageNotice('Browser storage is unavailable. Saved posts will stay available until you leave this page.');
            }
            return updated;
        });
        setCurrentPage(1);
    }

    const visiblePosts = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase().replace('#', '');

        return posts.filter((post) => {
            if (postId) return String(post.id) === postId;
            if (activeItem === 'Saved posts' && !savedIds.includes(post.id)) {
                return false;
            }
            const searchableText = [
                post.author,
                post.title,
                post.body,
                ...post.tags,
            ]
                .join(' ')
                .toLowerCase();

            return searchableText.includes(normalizedQuery);
        });
    }, [posts, query, activeItem, savedIds, postId]);

    const totalPages = Math.max(
        1,
        Math.ceil(visiblePosts.length / POSTS_PER_PAGE),
    );
    const displayedPage = Math.min(currentPage, totalPages);
    const firstPostIndex = (displayedPage - 1) * POSTS_PER_PAGE;
    const postsOnCurrentPage = visiblePosts.slice(
        firstPostIndex,
        firstPostIndex + POSTS_PER_PAGE,
    );

    function changeSearch(event) {
        setQuery(event.target.value);
        setCurrentPage(1);
    }

    function changePage(nextPage) {
        setCurrentPage(nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function selectNavigation(item) {
        if (['Projects', 'Peers', 'Messages'].includes(item)) {
            navigate('/' + item.toLowerCase());
            setQuery('');
            setPageNotice('');
        } else {
            navigate('/home');
        }
        setActiveItem(['Projects', 'Peers', 'Messages'].includes(item) ? 'Home' : item);
        setCurrentPage(1);
        setPageNotice(
            (item === 'Home' || item === 'Saved posts' || item === 'Projects' || item === 'Peers' || item === 'Messages')
                ? ''
                : `${item} will be built in the next frontend steps.`,
        );
    }

    async function publishPost(text, files) {
        const id = createId();
        const attachments = files.map((file, index) => {
            const info = validatePostFile(file);
            return { id: id + '-' + index, name: file.name, size: file.size, file: file.slice(0, file.size, info.mime), kind: info.kind, mime: info.mime };
        });
        await setPosts((current) => [{
            id, author: 'you', initials: 'YO', verified: false, time: 'now',
            tags: ['community'], title: 'New community update', body: text,
            attachments, likes: 0, comments: 0, thread: [],
        }, ...current]);
        setCurrentPage(1);
        setActiveItem('Home');
        setQuery('');
        navigate('/home');
    }

    if (!messagesReady || !postsReady) return <p role="status">Loading your local preview…</p>;

    return (
        <main className="home-page">
            <header className="home-topbar">
                <a
                    className="home-logo"
                    href="/home"
                    aria-label="SUF Home"
                >
                    <img
                        src="/logo.png"
                        style={theme === 'light' ? {
                            filter: 'invert(1) hue-rotate(180deg) contrast(1.35)',
                            mixBlendMode: 'multiply',
                        } : undefined}
                        alt="SUF"
                    />
                </a>

                <label className="global-search">
                    <span aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        value={query}
                        onChange={changeSearch}
                        placeholder="Search peers, projects, posts, or #tags"
                    />
                </label>

                <div className="topbar-actions">
                    <button
                        type="button"
                        aria-label="Notifications"
                    >
                        ♢<i />
                    </button>
                    <button
                        className="theme-toggle"
                        type="button"
                        onClick={onToggleTheme}
                        aria-label={
                            theme === 'dark'
                                ? 'Switch to light mode'
                                : 'Switch to dark mode'
                        }
                        title={
                            theme === 'dark'
                                ? 'Switch to light mode'
                                : 'Switch to dark mode'
                        }
                    >
                        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
                    </button>
                    <a className="profile-header-link" href="/profile" aria-label="Open your profile">
                        <Avatar initials="YO" photo={currentProfile.photo} small />
                    </a>
                    <button
                        className="logout-button"
                        type="button"
                        onClick={onLogOut}
                    >
                        Log out
                    </button>
                </div>
            </header>

            {postStorageNotice && <p className="page-notice" role="status">{postStorageNotice}</p>}
            {messageStorageNotice && section !== 'messages' && <p className="page-notice" role="status">{messageStorageNotice}</p>}

            <div className={section !== 'home' ? 'home-grid projects-grid' : 'home-grid'}>
                <Sidebar
                    messageCount={Object.values(conversations).reduce((count, item) => count + (item.unread || 0), 0)}
                    activeItem={section === 'messages' ? 'Messages' : section === 'peers' || (section === 'profile' && profileUsername) ? 'Peers' : section === 'projects' ? 'Projects' : section === 'profile' ? '' : activeItem}
                    onSelect={selectNavigation}
                />

                {section === 'messages' ? (
                    <MessagesPage
                        conversations={conversations}
                        selectedUsername={messageUsername}
                        relationships={relationships}
                        onStart={startConversation}
                        onRead={readConversation}
                        onSend={(username, text) => setConversations((current) => sendDirectMessage(current, username, text, relationships[username] === 'connected'))}
                        onLike={(username, id) => setConversations((current) => toggleMessageLike(current, username, id))}
                        storageNotice={messageStorageNotice}
                    />
                ) : section === 'peers' ? (
                    <PeersPage query={query} relationships={relationships} onAction={handlePeerAction} notice={peerNotice} />
                ) : section === 'profile' && profileUsername && profileUsername !== 'you' ? (
                    <PublicProfilePage
                        key={profileUsername}
                        username={profileUsername}
                        posts={posts}
                        onUpdatePost={updatePost}
                        relationships={relationships}
                        onAction={handlePeerAction}
                        savedIds={savedIds}
                        onToggleSaved={toggleSaved}
                        notice={peerNotice}
                    />
                ) : section === 'profile' ? (
                    <ProfilePage
                        currentProfile={currentProfile}
                        onProfileChange={setCurrentProfile}
                        posts={posts}
                        onUpdatePost={updatePost}
                        account={{ peerCount: Object.values(relationships).filter((status) => status === 'connected').length }}
                        savedIds={savedIds}
                        onToggleSaved={toggleSaved}
                    />
                ) : section === 'projects' ? (
                    <ProjectsPage query={query} initialProjectId={projectId} />
                ) : (
                <section className="feed-column">
                    {pageNotice && (
                        <p
                            className="page-notice"
                            role="status"
                        >
                            {pageNotice}
                        </p>
                    )}

                    {peerNotice && <p className="page-notice" role="status">{peerNotice}</p>}

                    <PostComposer photo={currentProfile.photo} onPublish={publishPost} />

                    {postId && <p className="page-notice"><a href="/home">← Back to all posts</a> · Public post preview</p>}
                    {query && !postId && (
                        <p className="search-summary">
                            {visiblePosts.length} result
                            {visiblePosts.length === 1 ? '' : 's'} for “{query}”
                        </p>
                    )}

                    <div className="post-list">
                        {postsOnCurrentPage.map((post) => (
                            <PostCard
                                post={post}
                                authorPhoto={post.author === 'you' ? currentProfile.photo : null}
                                onUpdatePost={updatePost}
                                key={post.id}
                                saved={savedIds.includes(post.id)}
                                onToggleSaved={() => toggleSaved(post.id)}
                                peerStatus={relationships[post.author]}
                                onPeerAction={handlePeerAction}
                            />
                        ))}

                        {visiblePosts.length === 0 && (
                            <div className="empty-results">
                                <b>{postId ? 'This post is unavailable in this preview session.' : activeItem === 'Saved posts' ? 'No saved posts found.' : 'No matching posts yet.'}</b>
                                <span>Try another name, project, or #tag.</span>
                            </div>
                        )}
                    </div>

                    {visiblePosts.length > 0 && (
                        <nav
                            className="pagination"
                            aria-label="Post pages"
                        >
                            <button
                                type="button"
                                disabled={displayedPage === 1}
                                onClick={() => changePage(displayedPage - 1)}
                            >
                                ← Previous
                            </button>
                            <span>
                                Page {displayedPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={displayedPage === totalPages}
                                onClick={() => changePage(displayedPage + 1)}
                            >
                                Next →
                            </button>
                        </nav>
                    )}
                </section>

                )}

                {section === 'home' && <RightPanel relationships={relationships} onPeerAction={handlePeerAction} />}
            </div>

            <footer className="home-footer">
                <strong>SUF · Stack Under Flow</strong>
                <span>Team and project information will be added here.</span>
            </footer>
        </main>
    );
}
