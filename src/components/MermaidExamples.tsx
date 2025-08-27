export function MermaidExamples() {
  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
      <h3>Mermaid 範例：</h3>
      <details style={{ marginBottom: '10px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>流程圖</summary>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>{`graph TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[End]
    C -->|No| B`}</pre>
      </details>

      <details style={{ marginBottom: '10px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>循序圖</summary>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>{`sequenceDiagram
    participant A as Client
    participant B as Server
    A->>B: Request
    B-->>A: Response`}</pre>
      </details>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>類別圖</summary>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>{`classDiagram
    class Animal {
        +String name
        +eat()
        +sleep()
    }`}</pre>
      </details>
    </div>
  );
}