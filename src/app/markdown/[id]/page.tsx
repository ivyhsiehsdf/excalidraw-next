"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { mdToExcalidraw } from "~/utils/markdownUtils";
import type { ExportedDataV2 } from "~/lib/excalidraw/schema";
import { z } from "zod";
import "@excalidraw/excalidraw/index.css";
// keep types lightweight to match the working markdown page

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

type ExcalidrawPropsLike = {
  initialData?:
    | ExportedDataV2
    | Promise<ExportedDataV2>
    | (() => Promise<ExportedDataV2>);
  viewModeEnabled?: boolean;
  zenModeEnabled?: boolean;
  gridModeEnabled?: boolean;
  langCode?: string;
};

const ExcalidrawTyped =
  Excalidraw as unknown as React.ComponentType<ExcalidrawPropsLike & Record<string, unknown>>;

function MarkdownPageContent({ id }: { id: string }) {
  const defaultScene = useCallback((): ExportedDataV2 => ({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: [],
    appState: { gridSize: null, viewBackgroundColor: "#ffffff" },
    files: {},
  }), []);

  // keep appState minimal and strip non-serializable fields like collaborators (Map)
  const sanitizeAppState = useCallback((input: unknown): ExportedDataV2["appState"] => {
    const obj = (input ?? {}) as Record<string, unknown>;
  const gridSize = typeof obj.gridSize === "number" ? obj.gridSize : null;
  const viewBackgroundColor = typeof obj.viewBackgroundColor === "string" ? obj.viewBackgroundColor : "#ffffff";
    return { gridSize, viewBackgroundColor };
  }, []);

  // localStorage helpers
  const storageKey = useMemo(() => `excalidraw:markdown:${id}`, [id]);
  type LocalScene = { version: 1; savedAt: number; data: ExportedDataV2 };

  const readLocal = useCallback((): LocalScene | null => {
    try {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LocalScene;
      if (parsed && parsed.version === 1 && parsed.data) return parsed;
      return null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const writeLocal = useCallback((data: ExportedDataV2) => {
    try {
      if (typeof window === "undefined") return;
      const sanitized: ExportedDataV2 = {
        ...data,
        appState: sanitizeAppState(data.appState),
      };
      const payload: LocalScene = { version: 1, savedAt: Date.now(), data: sanitized };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [storageKey, sanitizeAppState]);

  // initialData loader: prefer local unless server has newer data
  const loadInitialData = useCallback(async (): Promise<ExportedDataV2> => {
    const local = readLocal();
    try {
      const response = await fetch(`/api/md2excaildraw?id=${id}`);
      if (!response.ok) {
        return local ? { ...local.data, appState: sanitizeAppState(local.data.appState) } : defaultScene();
      }
      const dataUnknown = (await response.json()) as unknown;
      const respSchema = z.object({
        markdown: z.string().min(1),
        options: z
          .object({
            fontFamily: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
            fontSize: z.number().optional(),
            color: z.string().optional(),
            lineHeight: z.number().optional(),
          })
          .optional(),
        createdAt: z.string().optional(),
      });
      const data = respSchema.parse(dataUnknown);
      const serverTs = data.createdAt ? new Date(data.createdAt).getTime() : 0;
      const localTs = local?.savedAt ?? 0;

      if (local && localTs >= serverTs) {
        return { ...local.data, appState: sanitizeAppState(local.data.appState) };
      }

      const generated = (await mdToExcalidraw(data.markdown, data.options)) as unknown as ExportedDataV2;
      const finalData: ExportedDataV2 = { ...generated, appState: sanitizeAppState(generated.appState) };
      writeLocal(finalData);
      return finalData;
    } catch {
      return local ? { ...local.data, appState: sanitizeAppState(local.data.appState) } : defaultScene();
    }
  }, [id, readLocal, writeLocal, defaultScene, sanitizeAppState]);

  // no memo needed; render conditionally below

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <ExcalidrawTyped
        initialData={loadInitialData}
        langCode="zh-TW"
        {...({
          onChange: (
            elements: ExportedDataV2["elements"],
            appState: unknown,
            files: ExportedDataV2["files"],
          ) => {
            try {
              const data: ExportedDataV2 = {
                type: "excalidraw",
                version: 2,
                source: "https://excalidraw.com",
                elements,
                appState: sanitizeAppState(appState),
                files: files ?? {},
              };
              writeLocal(data);
            } catch {
              // ignore
            }
          },
        } as Record<string, unknown>)}
      />
    </div>
  );
}

export default function MarkdownPage() {
  const params = useParams();
  const raw = (params as Record<string, string | string[] | undefined>)?.id;
  const id = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return <div>Loading...</div>;
  }
  if (!id) {
    return <div style={{ color: "red" }}>Invalid id.</div>;
  }
  return <MarkdownPageContent id={id} />;
}
