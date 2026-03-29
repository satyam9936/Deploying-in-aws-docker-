import './App.css'
import Editor from '@monaco-editor/react';  

function App() {
  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-2">
      <aside
        className="h-full w-1/4 bg-amber-50 rounded-lg overflow-y-auto"
      ></aside>
      <section
        className="h-full w-3/4 bg-neutral-800 rounded-lg overflow-hidden relative"
      >
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// write your code here"
          theme="vs-dark"
        />
      </section>
    </main>
  )
}

export default App
