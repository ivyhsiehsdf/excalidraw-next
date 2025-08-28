/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  createExportedData,
  type ExportedDataV2,
} from "../lib/excalidraw/schema";
// Note: keep this module runtime-agnostic (avoid Node-only imports here)

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export type FontFamily = 1 | 2 | 3; // 1: Virgil, 2: Helvetica, 3: Cascadia

export interface Md2ExOptions {
  fontFamily?: FontFamily;
  fontSize?: number; // base font size
  color?: string;
  lineHeight?: number; // pixel spacing between blocks
}

const defaultOptions: Required<Md2ExOptions> = {
  fontFamily: 2,
  fontSize: 20,
  color: "#1e1e1e",
  lineHeight: 28,
};

// Note: We manually split markdown into blocks below; no unified/remark used.

export async function mdToExcalidraw(
  md: string,
  options: Md2ExOptions = {},
): Promise<ExportedDataV2> {
  const { parseMermaidToExcalidraw } = await import(
    "@excalidraw/mermaid-to-excalidraw"
  );
  const { convertToExcalidrawElements } = await import(
    "@excalidraw/excalidraw"
  );
  const opts = { ...defaultOptions, ...options };
  // unified/remark not used in this implementation

  const elements: any[] = [];
  const files: Record<string, any> = {};
  const { textContent, flowcharts } = splitContent(md);
  let flowBBox = null;
  // debug: mermaid blocks found
  if (process.env.NODE_ENV === "development") {
    console.debug("[mdToExcalidraw] flowcharts count:", flowcharts.length);
  }
  // 解析所有 Mermaid 區塊
  if (flowcharts.length) {
    for (const fc of flowcharts) {
      try {
        const { elements: mermaidElements, files: mermaidFiles } =
          await parseMermaidToExcalidraw(fc);
        const converted = convertToExcalidrawElements(mermaidElements);
        elements.push(...converted);
        flowBBox = mergeBBox(flowBBox, getBBox(converted));
        Object.assign(files, mermaidFiles);
      } catch (e) {
        console.error("Error parsing Mermaid flowchart:", errorMessage(e));
        if (process.env.NODE_ENV === "development") {
          console.debug("[FLOWCHART RAW BLOCK] =>\n" + fc);
        }
      }
    }
  }

  // 處理 Markdown 文字內容
  if (textContent) {
    const { elements: textElements, files: textFiles } =
      await createMarkdownElements(textContent, { flowBBox, config: opts });
    elements.push(...textElements);
    Object.assign(files, textFiles);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return createExportedData(
    elements as unknown as Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>,
    files as Record<string, unknown>,
  );
}

// 將 Markdown 文字拆出 mermaid 區塊 + 其他文字
function splitContent(md: string): {
  textContent: string;
  flowcharts: string[];
} {
  // precompiled patterns
  const RE_MERMAID_FENCE = /^mermaid($|\b|=|:)/;
  const RE_MERMAID_LINE_START = /^(flowchart|graph)\b/i;
  const lines: string[] = md.replace(/\r\n?/g, "\n").split("\n");
  const flowcharts = [];
  const textLines = [];

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const t = raw.trim();

    // ```mermaid 區塊
    if (t.startsWith("```")) {
      const lang = t.slice(3).trim().toLowerCase();
      const buf = [];
      let j = i + 1;
      while (j < lines.length && !(lines[j] ?? "").trim().startsWith("```")) {
        buf.push(lines[j] ?? "");
        j++;
      }
      const hasClosing =
        j < lines.length && (lines[j] ?? "").trim().startsWith("```");
      const blockText = buf.join("\n").trim();
      const isMermaidFence =
        (lang && RE_MERMAID_FENCE.test(lang)) ||
        (!lang && RE_MERMAID_LINE_START.test(blockText));

      if (isMermaidFence) {
        flowcharts.push(blockText);
      } else {
        for (let k = i; k <= (hasClosing ? j : j - 1); k++) {
          textLines.push(lines[k] ?? "");
        }
      }
      i = hasClosing ? j + 1 : j;
      continue;
    }

    // 非 fenced：行首 flowchart|graph
    if (RE_MERMAID_LINE_START.test(t)) {
      const buf = [raw];
      i++;
      while (i < lines.length) {
        const nt = (lines[i] ?? "").trim();
        if (nt === "") {
          const next = lines.slice(i + 1).find((l) => (l ?? "").trim() !== "");
          if (!next || !isMermaidLine(next.trim())) {
            i++;
            break;
          }
          buf.push(lines[i] ?? "");
          i++;
          continue;
        }
        if (isMermaidLine(nt)) {
          buf.push(lines[i] ?? "");
          i++;
        } else {
          break;
        }
      }
      flowcharts.push(buf.join("\n"));
      continue;
    }

    // 其他文字
    textLines.push(raw);
    i++;
  }

  return { textContent: textLines.join("\n").trim(), flowcharts };
}

// 判定是否為 Mermaid 行（非 fenced 區塊用）
function isMermaidLine(line: string) {
  if (!line) return false;
  if (/^(flowchart|graph)\b/.test(line)) return true;
  if (
    line === "end" ||
    line.startsWith("subgraph") ||
    line.startsWith("direction ")
  )
    return true;
  if (/(-->|---|==>|--\||\|--|:::|==)/.test(line)) return true;
  if (/^[A-Za-z0-9_]+\s*(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?$/.test(line))
    return true;
  return false;
}

type BBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

// 合併 bbox
function mergeBBox(a: BBox | null, b: BBox | null): BBox | null {
  if (!a) return b;
  if (!b) return a;
  const minX = Math.min(a.minX, b.minX);
  const minY = Math.min(a.minY, b.minY);
  const maxX = Math.max(a.maxX, b.maxX);
  const maxY = Math.max(a.maxY, b.maxY);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// 取得元素的邊界框
function getBBox(
  els: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    isDeleted?: boolean;
  }>,
) {
  const drawable = els.filter(
    (e) =>
      !e.isDeleted &&
      e.x != null &&
      e.y != null &&
      e.width != null &&
      e.height != null,
  );
  if (!drawable.length) return null;
  const minX = Math.min(...drawable.map((e) => e.x));
  const minY = Math.min(...drawable.map((e) => e.y));
  const maxX = Math.max(...drawable.map((e) => e.x + (e.width || 0)));
  const maxY = Math.max(...drawable.map((e) => e.y + (e.height || 0)));
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// 創建Markdown元素
type CreateElementsOptions = {
  flowBBox?: BBox | null;
  config: {
    fontFamily: number;
    fontSize: number;
    strokeColor?: string;
    color?: string;
  };
};

async function createMarkdownElements(
  markdown: string,
  opts: CreateElementsOptions,
) {
  const { flowBBox = null, config } = opts;
  const elements: any[] = [];
  const localFiles: Record<string, any> = {};

  const margin = 60;
  const defaultX = 80;
  const defaultY = 100;
  const xBase = flowBBox ? flowBBox.maxX + margin : defaultX;
  let yOffset = flowBBox ? flowBBox.minY : defaultY;

  const fontBody = getFontFamilyCode(config.fontFamily);
  const fontMono = 3; // Monospace
  const baseSize = config.fontSize;
  const lineHeight = 1.25;
  const maxChars = 42; // 換行基準
  const stroke = config.strokeColor ?? config.color ?? "#1e1e1e";

  const blocks = mdToBlocks(markdown);

  for (const block of blocks) {
    let fontSize = baseSize;
    let fontFamily = fontBody;
    let text = block.text;

    if (block.type === "heading") {
      const sizes: Record<number, number> = {
        1: 28,
        2: 24,
        3: 20,
        4: 18,
        5: 16,
        6: 16,
      };
      fontSize = sizes[Number(block.level)] ?? baseSize;
    } else if (block.type === "code") {
      // 代碼區塊處理
      fontFamily = fontMono;
      fontSize = 16;

      const lines = wrapText(text, maxChars);
      const longest = Math.max(...lines.map((l) => l.length), 1);
      const width = Math.max(120, Math.round(longest * fontSize * 0.62));
      const height = Math.round(lines.length * fontSize * lineHeight);
      const textBlock = lines.join("\n");

      // 背景框
      const padX = 8,
        padY = 6;
      elements.push(
        createRectangleElement({
          x: xBase - padX,
          y: yOffset - padY,
          width: width + padX * 2,
          height: height + padY * 2,
          strokeColor: "#e5e7eb",
          backgroundColor: "#f6f8fa",
          fillStyle: "solid",
          roughness: 0,
        }),
      );

      elements.push(
        createTextElement({
          x: xBase,
          y: yOffset,
          width,
          height,
          text: textBlock,
          fontSize,
          fontFamily,
          strokeColor: stroke,
        }),
      );

      yOffset += height + 12;
      continue;
    } else if (block.type === "list-item") {
      text = `${block.ordered ? `${block.index}.` : "•"} ${text}`;
    } else if (block.type === "blockquote") {
      text = `❝ ${text}`;
      fontSize = 18;
    }

    // 處理內聯圖片和文字
    const segments = parseInlineSegments(text);
    const indentX = block.type === "list-item" ? 16 * (block.indent ?? 0) : 0;

    for (const seg of segments) {
      if (seg.type === "image") {
        try {
          if (!isLikelyImageURL(seg.url)) {
            console.warn("[Skip Non-Image URL]", seg.url);
            continue;
          }
          const { element, fileRecord, captionElement, additionalElements } =
            await imageUrlToExcalidraw(
              seg.url,
              xBase + indentX,
              yOffset,
              seg.alt,
            );
          elements.push(element);

          // 添加文件記錄（如果有）
          if (fileRecord) {
            localFiles[fileRecord.id] = fileRecord;
          }

          // 添加說明文字
          if (captionElement) elements.push(captionElement);

          // 添加額外元素（如占位符的圖標和URL）
          if (additionalElements && Array.isArray(additionalElements)) {
            elements.push(...additionalElements);
          }

          const gap = 12;
          yOffset +=
            element.height +
            (captionElement ? captionElement.height + gap : gap);
        } catch (err) {
          console.warn("[Inline Image Skip]", seg.url, errorMessage(err));
        }
        continue;
      }

      // 文字片段
      const lines = wrapText(seg.text, maxChars);
      const longest = Math.max(...lines.map((l) => l.length), 1);
      const width = Math.max(120, Math.round(longest * fontSize * 0.62));
      const height = Math.round(lines.length * fontSize * lineHeight);
      const textBlock = lines.join("\n");

      elements.push(
        createTextElement({
          x: xBase + indentX,
          y: yOffset,
          width,
          height,
          text: textBlock,
          fontSize,
          fontFamily,
          strokeColor: stroke,
        }),
      );

      yOffset += height + (block.type === "heading" ? 18 : 12);
    }
  }

  return { elements, files: localFiles };
}

// 創建文字元素
type TextProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: number;
  strokeColor?: string;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  roughness?: number;
  strokeWidth?: number;
};

function createTextElement(props: TextProps) {
  return {
    type: "text",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 32),
    isDeleted: false,
    id: generateId(),
    fillStyle: "hachure",
    strokeWidth: props.strokeWidth ?? 1,
    strokeStyle: "solid",
    roughness: props.roughness ?? 1,
    opacity: 100,
    angle: 0,
    x: props.x,
    y: props.y,
    strokeColor: props.strokeColor ?? "#000000",
    backgroundColor: "transparent",
    width: props.width,
    height: props.height,
    seed: Math.floor(Math.random() * 2 ** 32),
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    fontSize: props.fontSize,
    fontFamily: props.fontFamily,
    text: props.text,
    textAlign: props.textAlign ?? "left",
    verticalAlign: props.verticalAlign ?? "top",
    containerId: null,
    originalText: props.text,
    baseline: Math.round(props.fontSize * 1.25),
    lineHeight: 1.25,
  };
}

// 創建矩形元素
type RectProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?:
    | "solid"
    | "hachure"
    | "cross-hatch"
    | "zigzag"
    | "dashed"
    | "dotted";
  strokeWidth?: number;
  roughness?: number;
};

function createRectangleElement(props: RectProps) {
  return {
    type: "rectangle",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 32),
    isDeleted: false,
    id: generateId(),
    fillStyle: props.fillStyle ?? "solid",
    strokeWidth: props.strokeWidth ?? 1,
    strokeStyle: "solid",
    roughness: props.roughness ?? 1,
    opacity: 100,
    angle: 0,
    x: props.x,
    y: props.y,
    strokeColor: props.strokeColor ?? "#000000",
    backgroundColor: props.backgroundColor ?? "transparent",
    width: props.width,
    height: props.height,
    seed: Math.floor(Math.random() * 2 ** 32),
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

// 將一行文字拆為文字與圖片片段（保持順序）
type Segment =
  | { type: "text"; text: string }
  | { type: "image"; alt: string; url: string };

function parseInlineSegments(text: string): Segment[] {
  const regex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const segments = [];
  let lastIndex = 0;
  let match;
  const str = String(text || "");

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: str.slice(lastIndex, match.index) });
    }
    segments.push({
      type: "image",
      alt: (match[1] ?? "").trim(),
      url: (match[2] ?? "").trim(),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    segments.push({ type: "text", text: str.slice(lastIndex) });
  }

  if (!segments.length) {
    return [{ type: "text", text: str }];
  }

  // 將空文字片段濾掉但保留純換行
  const cleaned = segments.filter(
    (s) => !(s.type === "text" && (s as any).text === ""),
  );
  // Normalize to our Segment union with runtime check
  return cleaned.map((s) =>
    s.type === "image"
      ? { type: "image", alt: (s as any).alt ?? "", url: (s as any).url ?? "" }
      : { type: "text", text: (s as any).text ?? "" },
  ) as Segment[];
}

// 判斷是否為圖片URL
function isLikelyImageURL(url: string) {
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff?|ico)$/i.test(url);
}

// 下載圖片並建立 Excalidraw 圖片元素
type ImageExResult = {
  element: any;
  fileRecord: any;
  captionElement: { height: number } | null;
  additionalElements?: any[];
};

async function imageUrlToExcalidraw(
  url: string,
  x: number,
  y: number,
  alt?: string,
): Promise<ImageExResult> {
  const resolvedUrl = resolveImageUrl(url);
  const dataUrl = await fetchImageAsDataURL(resolvedUrl);

  // 在服務器環境中，如果無法獲取圖片，創建一個圖片占位符
  if (!dataUrl) {
    return createImagePlaceholder(url, x, y, alt);
  }

  const mimeType =
    dataUrl.substring(dataUrl.indexOf(":") + 1, dataUrl.indexOf(";")) ||
    "image/png";
  const id = generateId();

  // 嘗試從圖片數據中獲取真實尺寸
  const dim = (await getImageDimensions(dataUrl)) as {
    width: number;
    height: number;
  };
  let { width, height } = dim;

  console.log(`[Image Dimensions] Original: ${width}x${height} for ${url}`);

  // 更保守的縮放策略 - 保持原始比例
  const maxWidth = 400; // 增加最大寬度
  const maxHeight = 300; // 增加最大高度

  if (width > maxWidth || height > maxHeight) {
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY); // 使用較小的縮放比例以保持比例

    width = Math.round(width * scale);
    height = Math.round(height * scale);

    console.log(
      `[Image Dimensions] Scaled to: ${width}x${height} (scale: ${scale.toFixed(
        3,
      )})`,
    );
  }

  const element = {
    type: "image",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 32),
    isDeleted: false,
    id,
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x,
    y,
    strokeColor: "transparent",
    backgroundColor: "transparent",
    width,
    height,
    seed: Math.floor(Math.random() * 2 ** 32),
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    status: "pending",
    fileId: id,
    scale: [1, 1],
  };

  const fileRecord = {
    id,
    dataURL: dataUrl,
    mimeType,
    created: Date.now(),
    lastRetrieved: Date.now(),
  };

  let captionElement = null;
  if (alt) {
    captionElement = createTextElement({
      x,
      y: y + height + 4,
      width: Math.max(80, Math.round(alt.length * 8)),
      height: 18,
      text: alt,
      fontSize: 14,
      fontFamily: 1,
      strokeColor: "#555555",
    });
    captionElement.textAlign = "center";
  }

  return { element, fileRecord, captionElement, additionalElements: undefined };
}

function resolveImageUrl(url: string) {
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  // 在服务器环境中，相对路径直接返回原URL，让客户端处理
  if (url.startsWith("/")) return url;
  return url.replace(/^\.\//, "");
}

// 創建圖片占位符（當無法下載圖片時使用）
function createImagePlaceholder(
  url: string,
  x: number,
  y: number,
  alt?: string,
) {
  const width = 200;
  const height = 150;
  const id = generateId();

  // 創建占位符圖片元素（而不是矩形）
  const placeholderElement = {
    type: "image",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 32),
    isDeleted: false,
    id,
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x,
    y,
    strokeColor: "transparent",
    backgroundColor: "transparent",
    width,
    height,
    seed: Math.floor(Math.random() * 2 ** 32),
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    status: "pending",
    fileId: id,
    scale: [1, 1],
  };

  // 創建占位符背景矩形
  const backgroundRect = createRectangleElement({
    x,
    y,
    width,
    height,
    strokeColor: "#cccccc",
    backgroundColor: "#f9f9f9",
    fillStyle: "solid",
    strokeWidth: 2,
  });

  // 創建圖片圖標文字
  const iconElement = createTextElement({
    x: x + width / 2 - 20,
    y: y + height / 2 - 20,
    width: 40,
    height: 20,
    text: "🖼️",
    fontSize: 24,
    fontFamily: 1,
    strokeColor: "#666666",
  });
  iconElement.textAlign = "center";

  // 創建圖片URL文字（縮短顯示）
  const shortUrl = url.length > 40 ? url.substring(0, 37) + "..." : url;
  const urlElement = createTextElement({
    x: x + 10,
    y: y + height - 30,
    width: width - 20,
    height: 16,
    text: shortUrl,
    fontSize: 10,
    fontFamily: 3, // monospace
    strokeColor: "#0066cc",
  });

  // 創建占位符圖片的 dataURL（1x1透明像素）
  const placeholderDataURL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

  // 創建文件記錄
  const fileRecord = {
    id,
    dataURL: placeholderDataURL,
    mimeType: "image/png",
    created: Date.now(),
    lastRetrieved: Date.now(),
  };

  let captionElement: any = null;
  if (alt) {
    captionElement = createTextElement({
      x,
      y: y + height + 4,
      width: Math.max(80, Math.round(alt.length * 8)),
      height: 18,
      text: alt,
      fontSize: 14,
      fontFamily: 1,
      strokeColor: "#555555",
    });
    captionElement.textAlign = "center";
  }

  return {
    element: placeholderElement,
    fileRecord,
    captionElement,
    additionalElements: [backgroundRect, iconElement, urlElement],
  };
}

async function fetchImageAsDataURL(url: string) {
  try {
    if (url.startsWith("data:")) return url;

    console.log("[Server environment] Fetching image:", url);

    // 使用 Node.js fetch API 下載圖片
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      // @ts-expect-error: timeout may not be typed in some runtimes
      timeout: 10000, // 10秒超時
    });

    if (!response.ok) {
      console.warn(`[fetchImageAsDataURL] HTTP ${response.status} for ${url}`);
      return null;
    }

    // 檢查內容類型
    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      console.warn(
        `[fetchImageAsDataURL] Invalid content type: ${contentType} for ${url}`,
      );
      return null;
    }

    // 獲取圖片數據
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 轉換為 base64
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    console.log(
      `[fetchImageAsDataURL] Successfully fetched ${url} (${buffer.length} bytes)`,
    );
    return dataUrl;
  } catch (e) {
    console.warn("[fetchImageAsDataURL failed]", url, (e as any)?.message);
    return null;
  }
}

// 從圖片數據中獲取尺寸信息
async function getImageDimensions(dataUrl: string) {
  try {
    if (typeof Image !== "undefined") {
      // 瀏覽器環境 - 使用 Image 對象
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          console.warn("[getImageDimensions] Failed to load image in browser");
          resolve({ width: 200, height: 150 });
        };
        img.src = dataUrl;
      });
    } else {
      // 服務器環境 - 解析圖片頭部信息
      const dimensions = parseImageDimensions(dataUrl);
      return dimensions;
    }
  } catch (e) {
    console.warn("[getImageDimensions] Error:", (e as any)?.message);
    return { width: 200, height: 150 };
  }
}

// 解析圖片頭部信息獲取尺寸（服務器環境）
function parseImageDimensions(dataUrl: string) {
  try {
    // 提取 base64 數據
    const base64Data = dataUrl.split(",")[1] ?? "";
    const buffer = Buffer.from(base64Data, "base64");

    // PNG 格式解析
    if (dataUrl.includes("image/png")) {
      return parsePNGDimensions(buffer);
    }

    // JPEG 格式解析
    if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) {
      return parseJPEGDimensions(buffer);
    }

    // GIF 格式解析
    if (dataUrl.includes("image/gif")) {
      return parseGIFDimensions(buffer);
    }

    // 其他格式使用默認尺寸
    console.warn(
      "[parseImageDimensions] Unsupported format, using default dimensions",
    );
    return { width: 200, height: 150 };
  } catch (e) {
    console.warn("[parseImageDimensions] Parse error:", (e as any)?.message);
    return { width: 200, height: 150 };
  }
}

// 解析 PNG 圖片尺寸
function parsePNGDimensions(buffer: Buffer) {
  try {
    // PNG 文件格式：前8字節是簽名，然後是 IHDR chunk
    // IHDR chunk 的結構：4字節長度 + 4字節類型 + 數據 + 4字節CRC
    // 寬度和高度各佔4字節，位於第16-23字節
    if (
      buffer.length >= 24 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      console.log(`[parsePNGDimensions] Parsed PNG: ${width}x${height}`);
      return { width, height };
    }
  } catch (e) {
    console.warn("[parsePNGDimensions] Parse error:", (e as any)?.message);
  }
  return { width: 200, height: 150 };
}

// 解析 JPEG 圖片尺寸
function parseJPEGDimensions(buffer: Buffer) {
  try {
    // JPEG 文件格式比較複雜，需要查找 SOF (Start of Frame) 標記
    if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] === 0xff) {
          const marker = buffer[offset + 1] ?? 0;
          // SOF0, SOF1, SOF2 標記
          if (marker >= 0xc0 && marker <= 0xc3) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            console.log(
              `[parseJPEGDimensions] Parsed JPEG: ${width}x${height}`,
            );
            return { width, height };
          }
          // 跳過當前段
          const segmentLength = buffer.readUInt16BE(offset + 2);
          offset += segmentLength + 2;
        } else {
          offset++;
        }
      }
    }
  } catch (e) {
    console.warn("[parseJPEGDimensions] Parse error:", (e as any)?.message);
  }
  return { width: 200, height: 150 };
}

// 解析 GIF 圖片尺寸
function parseGIFDimensions(buffer: Buffer) {
  try {
    // GIF 文件格式：前6字節是簽名，然後是邏輯屏幕寬度和高度
    if (buffer.length >= 10 && buffer.toString("ascii", 0, 3) === "GIF") {
      const width = buffer.readUInt16LE(6); // 小端序
      const height = buffer.readUInt16LE(8);
      console.log(`[parseGIFDimensions] Parsed GIF: ${width}x${height}`);
      return { width, height };
    }
  } catch (e) {
    console.warn("[parseGIFDimensions] Parse error:", (e as any)?.message);
  }
  return { width: 200, height: 150 };
}

// Note: blobToDataURL is unused in server runtime

// 文字換行
function wrapText(text: string, maxChars: number) {
  const result = [];
  const paras = String(text).split(/\n/);
  for (const para of paras) {
    let buf = "";
    const words = para.split(/\s+/);
    for (const w of words) {
      const test = buf ? buf + " " + w : w;
      if (test.length > maxChars) {
        if (buf) result.push(buf);
        buf = w;
      } else {
        buf = test;
      }
    }
    if (buf) result.push(buf);
    if (para === "") result.push("");
  }
  return result.length ? result : [""];
}

// 將Markdown解析為區塊
type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "blockquote"; text: string }
  | {
      type: "list-item";
      ordered: boolean;
      index?: number;
      indent?: number;
      text: string;
    }
  | { type: "code"; text: string }
  | { type: "paragraph"; text: string };

function mdToBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let inCode = false;
  let codeBuf = [];
  const RE_HEAD = /^(#{1,6})\s+(.*)$/;
  const RE_QUOTE = /^>\s+(.*)$/;
  const RE_OL = /^(\d+)[\.)]\s+(.*)$/;
  const RE_UL = /^([*+-])\s+(.*)$/;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "    ");
    const t = line.trim();

    if (t.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeBuf = [];
      } else {
        inCode = false;
        blocks.push({ type: "code", text: codeBuf.join("\n") });
        codeBuf = [];
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(raw);
      continue;
    }

    const mHead = RE_HEAD.exec(t);
    if (mHead) {
      const level = mHead[1]?.length ?? 1;
      const text = mHead[2] ?? "";
      blocks.push({ type: "heading", level, text });
      continue;
    }

    const mQuote = RE_QUOTE.exec(t);
    if (mQuote) {
      blocks.push({ type: "blockquote", text: mQuote[1] ?? "" });
      continue;
    }

    const mOl = RE_OL.exec(t);
    if (mOl) {
      blocks.push({
        type: "list-item",
        ordered: true,
        index: Number(mOl[1]),
        indent: indentLevel(line),
        text: mOl[2] ?? "",
      });
      continue;
    }

    const mUl = RE_UL.exec(t);
    if (mUl) {
      blocks.push({
        type: "list-item",
        ordered: false,
        indent: indentLevel(line),
        text: mUl[2] ?? "",
      });
      continue;
    }

    if (t === "") {
      blocks.push({ type: "paragraph", text: "" });
      continue;
    }

    blocks.push({ type: "paragraph", text: t });
  }

  // 合併連續的段落
  const merged: Block[] = [];
  for (const b of blocks) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push(b);
      continue;
    }
    if (b.type === "paragraph" && last.type === "paragraph") {
      last.text = (last.text ? last.text + "\n" : "") + b.text;
    } else {
      merged.push(b);
    }
  }
  return merged;
}

function indentLevel(line: string) {
  const m = /^\s+/.exec(line);
  const leading = m?.[0]?.length ?? 0;
  return Math.floor(leading / 2);
}

// 生成隨機ID
function generateId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 字體映射
function getFontFamilyCode(fontFamily: number | string) {
  // 若已是數字，直接回傳（限制在 1~3 範圍）
  if (typeof fontFamily === "number") {
    return [1, 2, 3].includes(fontFamily) ? fontFamily : 1;
  }
  // 也支援字串輸入，做向後相容
  const fontMap: Record<string, number> = {
    Virgil: 1,
    Helvetica: 2,
    Cascadia: 3,
  };
  return fontMap[String(fontFamily)] ?? 1;
}
