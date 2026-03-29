import { useRef, useEffect, useState } from 'react';
import './App.css';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { MonacoBinding } from 'y-monaco';

function App() {
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  // We need two states: one for the input field, and one for the finalized username
  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("username") || "";
  });
  const [users, setUsers] = useState([]);

  const handleJoin = () => {
    if (usernameInput.trim()) {
      const name = usernameInput.trim();
      setUsername(name);

      // Update the URL without reloading the page
      const url = new URL(window.location);
      url.searchParams.set("username", name);
      window.history.pushState({}, '', url);
    }
  };

  const handleDisconnect = () => {
    if (bindingRef.current) bindingRef.current.destroy();
    if (providerRef.current) providerRef.current.destroy();
    if (ydocRef.current) ydocRef.current.destroy();
    
    setUsername("");
    setUsernameInput("");
    setUsers([]);

    const url = new URL(window.location);
    url.searchParams.delete("username");
    window.history.replaceState({}, '', url);
  };

  const handleInvite = () => {
    const url = new URL(window.location);
    url.searchParams.delete("username");
    navigator.clipboard.writeText(url.toString());
    alert("Invite link copied to clipboard!");
  };

  const handleEditorDidMount = (editor, monaco) => {
    // 1. Create the Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // 2. Define a shared text type within the document
    const ytext = ydoc.getText('monaco');

    // 3. Connect to the setup YSocketIO backend server (from earlier)
    const provider = new SocketIOProvider(
      'http://localhost:3000', // Must match your backend
      'monaco-room',           // Room ID for this file
      ydoc,
      { autoConnect: true }
    );
    providerRef.current = provider;

    // Optional: Save the user's name to the yjs awareness state
    // so other users can see who is editing!
    provider.awareness.setLocalStateField('user', {
      name: username
    });

    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().values());
      const currentUsers = states
        .map(state => state.user)
        .filter(user => user && Boolean(user.name));
      setUsers(currentUsers);
    });

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField('user', null);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    // 4. Bind the shared Yjs text to the Monaco Editor specifically
    const binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;
  };

  useEffect(() => {
    // Cleanup on unmount avoiding memory leaks across hot reloads
    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
      if (providerRef.current) providerRef.current.destroy();
      if (ydocRef.current) ydocRef.current.destroy();
    };
  }, []);

  // Show the Connect screen if no username is set
  if (!username) {
    return (
      <main className="connect-container">
        <div className="glass-panel connect-card">
          <h1 className="connect-title">CodeSync Pro</h1>
          <input
            type="text"
            placeholder="Enter your username"
            className="connect-input"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
          />
          <button className="btn-primary" onClick={handleJoin}>
            Join Workspace
          </button>
        </div>
      </main>
    );
  }

  // Show the Editor once a username is provided
  return (
    <main className="app-container">
      <aside className="glass-panel sidebar">
        <h2 className="sidebar-header">Collaborators</h2>
        <div className="users-list">
          {users.map((user, idx) => (
            <div key={idx} className="user-chip">
              <div className="user-dot"></div>
              <span className={`user-name ${user.name === username ? 'self' : ''}`}>
                {user.name} {user.name === username ? "(You)" : ""}
              </span>
            </div>
          ))}
          {users.length === 0 && (
            <div className="user-chip">
              <div className="user-dot"></div>
              <span className="user-name self">{username} (You)</span>
            </div>
          )}
        </div>
        <div className="sidebar-actions" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleInvite}>
            Copy Invite Link
          </button>
          <button className="btn-danger" onClick={handleDisconnect}>
            Leave Room
          </button>
        </div>
      </aside>
      <section className="glass-panel editor-container">
        <div className="editor-header">
          <div className="mac-btn mac-close"></div>
          <div className="mac-btn mac-min"></div>
          <div className="mac-btn mac-max"></div>
          <span className="editor-title">index.js — Shared Workspace</span>
        </div>
        <div className="editor-wrapper">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              padding: { top: 16 }
            }}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
