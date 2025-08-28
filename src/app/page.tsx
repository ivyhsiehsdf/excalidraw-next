"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExportedDataV2 } from "~/lib/excalidraw/schema";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

type ExProps = {
  initialData?:
    | ExportedDataV2
    | Promise<ExportedDataV2>
    | (() => Promise<ExportedDataV2>);
  langCode?: string;
  onChange?: (
    elements: ExportedDataV2["elements"],
    appState: unknown,
    files: ExportedDataV2["files"],
  ) => void;
};

const ExcalidrawTyped = Excalidraw as unknown as React.ComponentType<ExProps>;

export default function Home() {
  const storageKey = "excalidraw";
  const [initialData, setInitialData] = useState<ExportedDataV2 | null>(null);

  const defaultScene = useMemo<ExportedDataV2>(
    () => ({
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements: [] as ExportedDataV2["elements"],
      appState: { gridSize: null, viewBackgroundColor: "#ffffff" },
      files: {} as ExportedDataV2["files"],
    }),
    [],
  );

  const sanitizeAppState = (input: unknown): ExportedDataV2["appState"] => {
    const obj = (input ?? {}) as Record<string, unknown>;
    const gridSize = typeof obj.gridSize === "number" ? obj.gridSize : null;
    const viewBackgroundColor =
      typeof obj.viewBackgroundColor === "string"
        ? obj.viewBackgroundColor
        : "#ffffff";
    return { gridSize, viewBackgroundColor };
  };

  function isExportedDataV2(data: unknown): data is ExportedDataV2 {
    if (!data || typeof data !== "object") return false;
    const obj = data as Record<string, unknown>;
    if (obj.type !== "excalidraw") return false;
    if (!Array.isArray(obj.elements)) return false;
    return true;
  }

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(storageKey)
          : null;
      if (raw) {
        const parsedUnknown = JSON.parse(raw) as unknown;
        if (isExportedDataV2(parsedUnknown)) {
          const pu = parsedUnknown as unknown as Record<string, unknown>;
          const parsed: ExportedDataV2 = {
            type: "excalidraw",
            version: 2,
            source:
              typeof pu.source === "string"
                ? pu.source
                : "https://excalidraw.com",
            elements: (pu.elements as ExportedDataV2["elements"]) ?? [],
            appState: sanitizeAppState(pu.appState),
            files: (pu.files as ExportedDataV2["files"]) ?? {},
          };
          setInitialData(parsed);
          return;
        }
      }
      setInitialData(defaultScene);
    } catch {
      setInitialData(defaultScene);
    }
  }, [defaultScene]);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      {initialData && (
        <ExcalidrawTyped
          initialData={initialData}
          langCode="zh-TW"
          onChange={(elements, appState, files) => {
            try {
              const payload: ExportedDataV2 = {
                type: "excalidraw",
                version: 2,
                source: "https://excalidraw.com",
                elements,
                appState: sanitizeAppState(appState),
                files: files ?? {},
              };
              window.localStorage.setItem(storageKey, JSON.stringify(payload));
            } catch {
              // ignore write failures
            }
          }}
        />
      )}
    </div>
  );
}
