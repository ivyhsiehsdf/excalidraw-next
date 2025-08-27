"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { MermaidExamples } from "~/components/MermaidExamples";
import { DEFAULT_MERMAID, saveMermaidDiagram } from "~/utils/mermaidUtils";

function MermaidPageContent() {
  const router = useRouter();
  const [mermaidInput, setMermaidInput] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const responseData = await saveMermaidDiagram(mermaidInput, fontSize);
      router.push(`/mermaid/${responseData.id}`);
    } catch (error) {
      console.error('Conversion error:', error);
      alert(`轉換 Mermaid 圖表時發生錯誤：${error instanceof Error ? error.message : '請檢查您的語法並重試。'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDefault = async () => {
    setMermaidInput(DEFAULT_MERMAID);
    setIsLoading(true);

    try {
      const responseData = await saveMermaidDiagram(DEFAULT_MERMAID, fontSize);
      router.push(`/mermaid/${responseData.id}`);
    } catch (error) {
      console.error('Conversion error:', error);
      alert(`載入預設範例時發生錯誤：${error instanceof Error ? error.message : '請重試。'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay message="轉換 Mermaid 圖表中..." />}
      <div style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1>Mermaid 轉 Excalidraw 轉換器</h1>
        <p>請在下方輸入您的 Mermaid 圖表語法，並將其轉換為互動式 Excalidraw 圖表：</p>

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
              {isLoading ? '轉換中...' : '轉換為 Excalidraw'}
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
              使用預設範例
            </button>

          </div>
        </form>

        <MermaidExamples />
      </div>
    </>
  );
}

export default function MermaidPage() {
  return <MermaidPageContent />;
}
