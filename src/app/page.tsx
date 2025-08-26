"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

export default function Home() {
  const [jsonData, setJsonData] = useState("");
  const [currentData, setCurrentData] = useState(null);
  const [showForm, setShowForm] = useState(true);

  const defaultJsonObj = {
    elements: [
      {
        type: "rectangle",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "actor1",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 100,
        y: 100,
        strokeColor: "#1e1e1e",
        backgroundColor: "#a5d8ff",
        width: 120,
        height: 60,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
      },
      {
        type: "text",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "text1",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 130,
        y: 120,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        width: 60,
        height: 20,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        fontSize: 16,
        fontFamily: 1,
        text: "Client",
        textAlign: "center",
        verticalAlign: "middle",
        containerId: null,
        originalText: "Client",
        lineHeight: 1.25,
      },
      {
        type: "rectangle",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "actor2",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 400,
        y: 100,
        strokeColor: "#1e1e1e",
        backgroundColor: "#ffec99",
        width: 120,
        height: 60,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
      },
      {
        type: "text",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "text2",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 430,
        y: 120,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        width: 60,
        height: 20,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        fontSize: 16,
        fontFamily: 1,
        text: "Server",
        textAlign: "center",
        verticalAlign: "middle",
        containerId: null,
        originalText: "Server",
        lineHeight: 1.25,
      },
      {
        type: "line",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "lifeline1",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "dashed",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 160,
        y: 160,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        width: 0,
        height: 300,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: null,
        points: [
          [0, 0],
          [0, 300],
        ],
      },
      {
        type: "line",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "lifeline2",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "dashed",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 460,
        y: 160,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        width: 0,
        height: 300,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: null,
        points: [
          [0, 0],
          [0, 300],
        ],
      },
      {
        type: "arrow",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "message1",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 160,
        y: 200,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        width: 300,
        height: 0,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: "arrow",
        points: [
          [0, 0],
          [300, 0],
        ],
      },
      {
        type: "text",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "messageText1",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 250,
        y: 180,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        width: 120,
        height: 20,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        fontSize: 14,
        fontFamily: 1,
        text: "1. Request",
        textAlign: "center",
        verticalAlign: "middle",
        containerId: null,
        originalText: "1. Request",
        lineHeight: 1.25,
      },
      {
        type: "arrow",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "message2",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 460,
        y: 260,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        width: 300,
        height: 0,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: "arrow",
        points: [
          [0, 0],
          [-300, 0],
        ],
      },
      {
        type: "text",
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        id: "messageText2",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: 250,
        y: 240,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        width: 120,
        height: 20,
        seed: 1,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: 1,
        link: null,
        locked: false,
        fontSize: 14,
        fontFamily: 1,
        text: "2. Response",
        textAlign: "center",
        verticalAlign: "middle",
        containerId: null,
        originalText: "2. Response",
        lineHeight: 1.25,
      },
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const parsedJson = JSON.parse(jsonData);

      const response = await fetch('/api/excalidraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedJson),
      });

      if (response.ok) {
        setCurrentData(parsedJson);
        setShowForm(false);
      } else {
        alert('Failed to submit JSON. Please check the format.');
      }
    } catch (error) {
      alert('Invalid JSON format. Please check your input.');
    }
  };

  const displayData = currentData || defaultJsonObj;

  if (showForm) {
    return (
      <div style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1>Excalidraw JSON Viewer</h1>
        <p>Paste your Excalidraw JSON data below and click submit to visualize it:</p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            placeholder={`Paste your JSON here, for example:
${JSON.stringify(defaultJsonObj, null, 2)}`}
            style={{
              width: '100%',
              height: '400px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
          />
          <div style={{ marginTop: '10px' }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007cba',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Submit JSON
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentData(defaultJsonObj);
                setShowForm(false);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Use Default Example
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Excalidraw initialData={displayData} langCode="zh-TW" />
    </div>
  );
}
