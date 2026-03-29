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
      <main className="h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your username"
            className="p-2 rounded-lg bg-gray-800 text-white"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
          />
          <button
            className="p-2 rounded-lg bg-amber-50 text-gray-950 font-bold"
            onClick={handleJoin}
          >
            Connect
          </button>
        </div>
      </main>
    );
  }

  // Show the Editor once a username is provided
  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-2">
      <aside className="h-full w-1/4 bg-amber-50 rounded-lg overflow-y-auto p-4">
        <h2 className="font-bold text-xl mb-4 text-gray-950">Room details</h2>
        <div className="flex flex-col gap-2">
          {users.map((user, idx) => (
            <div key={idx} className="flex items-center gap-2 text-gray-800">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium">
                {user.name} {user.name === username ? "(You)" : ""}
              </span>
            </div>
          ))}
          {/* Fallback for when users array might be empty momentarily */}
          {users.length === 0 && (
            <div className="flex items-center gap-2 text-gray-800">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium">{username} (You)</span>
            </div>
          )}
        </div>
      </aside>
      <section
        className="h-full w-3/4 bg-neutral-800 rounded-lg overflow-hidden relative"
      >
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false }
          }}
        />
      </section>
    </main>
  );
}

export default App;
