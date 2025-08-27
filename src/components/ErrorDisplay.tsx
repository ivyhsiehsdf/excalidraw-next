interface ErrorDisplayProps {
  error: string;
  onCreateNew: () => void;
  onSecondaryAction: () => void;
  secondaryActionText: string;
}

export function ErrorDisplay({ error, onCreateNew, onSecondaryAction, secondaryActionText }: ErrorDisplayProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #f5c6cb',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Error</h2>
        <p style={{ margin: '0' }}>{error}</p>
      </div>
      <div>
        <button
          onClick={onCreateNew}
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
          Create New Diagram
        </button>
        <button
          onClick={onSecondaryAction}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {secondaryActionText}
        </button>
      </div>
    </div>
  );
}