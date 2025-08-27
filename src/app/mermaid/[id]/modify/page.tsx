"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { MermaidExamples } from "~/components/MermaidExamples";
import { ErrorDisplay } from "~/components/ErrorDisplay";
import { DEFAULT_MERMAID, loadMermaidDiagram, saveMermaidDiagram } from "~/utils/mermaidUtils";

function MermaidModifyContent() {
  const params = useParams();
  const router = useRouter();
  const [mermaidInput, setMermaidInput] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadExistingMermaid(params.id as string);
    }
  }, [params.id]);

  const loadExistingMermaid = async (id: string) => {
    setIsLoadingData(true);
    setError(null);
    try {
      const data = await loadMermaidDiagram(id);
      setMermaidInput(data.mermaid);
      setFontSize(data.fontSize);
    } catch (error) {
      console.error('Error loading Mermaid data:', error);
      setError(error instanceof Error ? error.message : 'Error loading Mermaid diagram for editing.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const responseData = await saveMermaidDiagram(mermaidInput, fontSize);
      router.push(`/mermaid/${responseData.id}`);
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error saving Mermaid diagram: ${error instanceof Error ? error.message : 'Please check your syntax and try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsNew = async () => {
    await handleSubmit(new Event('submit') as any);
  };

  // Error state
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onCreateNew={() => router.push('/mermaid')}
        onSecondaryAction={() => router.push(`/mermaid/${params.id}`)}
        secondaryActionText="Back to View"
      />
    );
  }

  return (
    <>
      {isLoadingData && <LoadingOverlay message="Loading diagram for editing..." />}
      {isLoading && <LoadingOverlay message="Saving changes..." />}
      
      <div style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Navigation Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #ddd'
        }}>
          <h1>Modify Mermaid Diagram</h1>
          <div>
            <button
              onClick={() => router.push(`/mermaid/${params.id}`)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Back to View
            </button>
            <button
              onClick={() => router.push('/mermaid')}
              style={{
                padding: '8px 15px',
                backgroundColor: '#007cba',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create New
            </button>
          </div>
        </div>

        <p>Modify your Mermaid diagram syntax below. Changes will create a new version with a new URL.</p>

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
${DEFAULT_MERMAID}`}
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
              disabled={isLoading || isLoadingData || !mermaidInput.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: (isLoading || isLoadingData) ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (isLoading || isLoadingData) ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {isLoading ? 'Saving...' : 'Save as New Version'}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/mermaid/${params.id}`)}
              disabled={isLoading || isLoadingData}
              style={{
                padding: '10px 20px',
                backgroundColor: (isLoading || isLoadingData) ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (isLoading || isLoadingData) ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        <MermaidExamples />

        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#d1ecf1', 
          borderRadius: '4px',
          border: '1px solid #bee5eb'
        }}>
          <p style={{ margin: '0', color: '#0c5460' }}>
            <strong>Note:</strong> Modifications create a new version with a new URL. The original diagram will remain unchanged at its current URL.
          </p>
        </div>
      </div>
    </>
  );
}

export default function MermaidModifyPage() {
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
      <MermaidModifyContent />
    </Suspense>
  );
}