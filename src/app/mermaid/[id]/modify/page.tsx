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
      alert(`儲存 Mermaid 圖表時發生錯誤：${error instanceof Error ? error.message : '請檢查您的語法並重試。'}`);
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
        secondaryActionText="返回檢視"
      />
    );
  }

  return (
    <>
      {isLoadingData && <LoadingOverlay message="載入圖表以供編輯..." />}
      {isLoading && <LoadingOverlay message="儲存變更中..." />}
      
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
          <h1>修改 Mermaid 圖表</h1>
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
              返回檢視
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
              建立新的
            </button>
          </div>
        </div>

        <p>在下方修改您的 Mermaid 圖表語法。變更將建立一個具有新 URL 的新版本。</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              字型大小：
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
            placeholder={`請在此輸入您的 Mermaid 語法，例如：
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
              {isLoading ? '儲存中...' : '儲存為新版本'}
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
              取消
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
            <strong>注意：</strong> 修改會建立一個具有新 URL 的新版本。原始圖表將在其目前的 URL 保持不變。
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
        載入中...
      </div>
    }>
      <MermaidModifyContent />
    </Suspense>
  );
}