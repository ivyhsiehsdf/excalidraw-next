"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { ErrorDisplay } from "~/components/ErrorDisplay";
import { loadMermaidDiagram, convertMermaidToExcalidraw } from "~/utils/mermaidUtils";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

function MermaidViewerContent() {
  const params = useParams();
  const router = useRouter();
  const [excalidrawData, setExcalidrawData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadMermaidFromId(params.id as string);
    }
  }, [params.id]);

  const loadMermaidFromId = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadMermaidDiagram(id);
      const excalidrawData = await convertMermaidToExcalidraw(data.mermaid, data.fontSize);
      setExcalidrawData(excalidrawData);
    } catch (error) {
      console.error('Error loading Mermaid data:', error);
      setError(error instanceof Error ? error.message : 'Error loading Mermaid diagram. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Error state
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onCreateNew={() => router.push('/mermaid')}
        onSecondaryAction={() => window.location.reload()}
        secondaryActionText="Try Again"
      />
    );
  }

  return (
    <>
      {isLoading && <LoadingOverlay message="載入 Mermaid 圖表中..." />}
      <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
        {/* Navigation Bar - Bottom Center */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: '15px'
        }}>
          <button
            onClick={() => router.push('/mermaid')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            建立新的
          </button>
          <button
            onClick={() => router.push(`/mermaid/${params.id}/modify`)}
            style={{
              padding: '12px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            編輯
          </button>
        </div>

        {excalidrawData ? (
          <Excalidraw initialData={excalidrawData} langCode="zh-TW" />
        ) : (
          !isLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              fontSize: '18px',
              color: '#666'
            }}>
              無可用的圖表資料。
            </div>
          )
        )}
      </div>
    </>
  );
}

export default function MermaidViewerPage() {
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
        載入中...
      </div>
    }>
      <MermaidViewerContent />
    </Suspense>
  );
}
