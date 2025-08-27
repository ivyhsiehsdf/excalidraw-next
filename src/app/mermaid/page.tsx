"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

function MermaidPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mermaidInput, setMermaidInput] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [excalidrawData, setExcalidrawData] = useState<any>(null);
  const [showForm, setShowForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const defaultMermaid = `graph TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Action 1]
    C -->|No| E[Action 2]
    D --> F[End]
    E --> F`;

  // Load Mermaid data from URL parameter if present
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      loadMermaidFromId(id);
    }
  }, [searchParams]);

  const loadMermaidFromId = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mermaid2excalidraw?id=${id}`);
      if (!response.ok) {
        alert('Failed to load Mermaid diagram. The link may be invalid or expired.');
        return;
      }

      const data = await response.json();
      setMermaidInput(data.mermaid);
      setFontSize(data.fontSize);

      // Automatically convert to Excalidraw
      const { parseMermaidToExcalidraw } = await import("@excalidraw/mermaid-to-excalidraw");
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      const { elements, files } = await parseMermaidToExcalidraw(data.mermaid, {
        themeVariables: {
          fontSize: `${data.fontSize}px`,
        },
      });

      const excalidrawElements = convertToExcalidrawElements(elements);

      const excalidrawData = {
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: excalidrawElements,
        appState: {
          gridSize: null,
          viewBackgroundColor: "#ffffff",
        },
        files: files || {},
      };

      setExcalidrawData(excalidrawData);
      setShowForm(false);
    } catch (error) {
      console.error('Error loading Mermaid data:', error);
      alert('Error loading Mermaid diagram from URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First validate the input with the API
      const response = await fetch('/api/mermaid2excalidraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mermaid: mermaidInput,
          fontSize: fontSize,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to validate: ${errorData.error}`);
        return;
      }

      // Get the new ID from the response
      const responseData = await response.json();
      const newId = responseData.id;

      // Update the URL with the new ID
      router.push(`/mermaid?id=${newId}`, { scroll: false });

      // Now do the client-side conversion
      const { parseMermaidToExcalidraw } = await import("@excalidraw/mermaid-to-excalidraw");
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      const { elements, files } = await parseMermaidToExcalidraw(mermaidInput, {
        themeVariables: {
          fontSize: `${fontSize}px`,
        },
      });

      const excalidrawElements = convertToExcalidrawElements(elements);

      const excalidrawData = {
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: excalidrawElements,
        appState: {
          gridSize: null,
          viewBackgroundColor: "#ffffff",
        },
        files: files || {},
      };

      setExcalidrawData(excalidrawData);
      setShowForm(false);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting Mermaid diagram. Please check your syntax and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDefault = async () => {
    setMermaidInput(defaultMermaid);
    setIsLoading(true);

    try {
      // Validate with API
      const response = await fetch('/api/mermaid2excalidraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mermaid: defaultMermaid,
          fontSize: fontSize,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to validate: ${errorData.error}`);
        return;
      }

      // Get the new ID from the response
      const responseData = await response.json();
      const newId = responseData.id;

      // Update the URL with the new ID
      router.push(`/mermaid?id=${newId}`, { scroll: false });

      // Client-side conversion
      const { parseMermaidToExcalidraw } = await import("@excalidraw/mermaid-to-excalidraw");
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      const { elements, files } = await parseMermaidToExcalidraw(defaultMermaid, {
        themeVariables: {
          fontSize: `${fontSize}px`,
        },
      });

      const excalidrawElements = convertToExcalidrawElements(elements);

      const excalidrawData = {
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: excalidrawElements,
        appState: {
          gridSize: null,
          viewBackgroundColor: "#ffffff",
        },
        files: files || {},
      };

      setExcalidrawData(excalidrawData);
      setShowForm(false);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error loading default example.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading overlay component
  const LoadingOverlay = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007cba',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{
        marginTop: '20px',
        fontSize: '16px',
        color: '#666',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Converting Mermaid diagram...
      </p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (showForm) {
    return (
      <>
        {isLoading && <LoadingOverlay />}
        <div style={{
          padding: '20px',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1>Mermaid to Excalidraw Converter</h1>
        <p>Enter your Mermaid diagram syntax below and convert it to an interactive Excalidraw diagram:</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Font Size:
            </label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min="8"
              max="48"
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100px'
              }}
            />
          </div>

          <textarea
            value={mermaidInput}
            onChange={(e) => setMermaidInput(e.target.value)}
            placeholder={`Enter your Mermaid syntax here, for example:
${defaultMermaid}`}
            style={{
              width: '100%',
              height: '300px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />

          <div style={{ marginTop: '15px' }}>
            <button
              type="submit"
              disabled={isLoading || !mermaidInput.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: isLoading ? '#ccc' : '#007cba',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {isLoading ? 'Converting...' : 'Convert to Excalidraw'}
            </button>

            <button
              type="button"
              onClick={handleUseDefault}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: isLoading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              Use Default Example
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setExcalidrawData(null);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Go to Viewer
            </button>
          </div>
        </form>

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h3>Mermaid Examples:</h3>
          <details style={{ marginBottom: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Flowchart</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>{`graph TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[End]
    C -->|No| B`}</pre>
          </details>

          <details style={{ marginBottom: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Sequence Diagram</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>{`sequenceDiagram
    participant A as Client
    participant B as Server
    A->>B: Request
    B-->>A: Response`}</pre>
          </details>

          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Class Diagram</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>{`classDiagram
    class Animal {
        +String name
        +eat()
        +sleep()
    }`}</pre>
          </details>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>

      {excalidrawData ? (
        <Excalidraw initialData={excalidrawData} />
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          fontSize: '18px',
          color: '#666'
        }}>
          No diagram data. Please convert a Mermaid diagram first.
        </div>
      )}
    </div>
    </>
  );
}

export default function MermaidPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    }>
      <MermaidPageContent />
    </Suspense>
  );
}
