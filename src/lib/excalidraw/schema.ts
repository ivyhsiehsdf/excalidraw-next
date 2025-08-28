export type ExcalidrawElement = {
  x: number;
  y: number;
  width: number;
  height: number;
  // Allow additional props from Excalidraw elements
  [key: string]: unknown;
};

export type ExcalidrawFiles = Record<string, unknown>;

export interface ExportedDataV2 {
  type: "excalidraw";
  version: 2;
  source: string;
  elements: ExcalidrawElement[];
  appState: {
    gridSize: number | null;
    viewBackgroundColor: string;
  };
  files: ExcalidrawFiles;
}

export function createExportedData(
  elements: ExcalidrawElement[],
  files: ExcalidrawFiles,
): ExportedDataV2 {
  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff",
    },
    files: files || {},
  };
}
