export const DEFAULT_MERMAID = `graph TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Action 1]
    C -->|No| E[Action 2]
    D --> F[End]
    E --> F`;

export interface MermaidData {
  mermaid: string;
  fontSize: number;
  createdAt: string;
}

export async function convertMermaidToExcalidraw(mermaidText: string, fontSize: number) {
  const { parseMermaidToExcalidraw } = await import("@excalidraw/mermaid-to-excalidraw");
  const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

  const { elements, files } = await parseMermaidToExcalidraw(mermaidText, {
    themeVariables: {
      fontSize: `${fontSize}px`,
    },
  });

  const excalidrawElements = convertToExcalidrawElements(elements);

  return {
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
}

export async function saveMermaidDiagram(mermaidText: string, fontSize: number) {
  const response = await fetch('/api/mermaid2excalidraw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mermaid: mermaidText,
      fontSize: fontSize,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '儲存圖表失敗');
  }

  return await response.json();
}

export async function loadMermaidDiagram(id: string): Promise<MermaidData> {
  const response = await fetch(`/api/mermaid2excalidraw?id=${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('找不到 Mermaid 圖表。連結可能無效或已過期。');
    }
    throw new Error('載入 Mermaid 圖表失敗。');
  }

  return await response.json();
}