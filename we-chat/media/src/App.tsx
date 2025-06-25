import React, { useState, useEffect } from 'react';
declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

const vscode = acquireVsCodeApi(); // VS Code API available in WebView

const sendMessageToExtension = (message: string) => {
    vscode.postMessage({
        type: 'userMessage',
        text: message,
    });
};


const App: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [fileList, setFileList] = useState<string[]>([]);

    // Listen for messages from VS Code Extension backend
    useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;

    if (message.type === 'aiResponse') {
      setMessages(prev => [...prev, { role: 'assistant', content: message.content }]);
    } else if (message.type === 'fileContent') {
      const modifiedText = `${message.originalText}\n\nAttached File Content:\n${message.content}`;
      sendUserMessage(modifiedText);
    } else if (message.type === 'fileList') {
      setFileList(message.files);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}, []);


    // Handle sending message
    const handleSend = () => {
    if (!inputValue.trim()) return;

    // Extract @filename if present
    const match = inputValue.match(/@(\S+)/);
    if (match) {
        const fileName = match[1]; // e.g. package.json
        vscode.postMessage({
            type: 'readFile',
            filePath: fileName,
            originalText: inputValue // Send original message too
        });
    } else {
        // No file mention, send normal user message
        sendUserMessage(inputValue);
    }

    setMessages(prev => [...prev, { role: 'user', content: inputValue }]);
    setInputValue('');
};
  const sendUserMessage = (text: string) => {
    vscode.postMessage({
        type: 'userMessage',
        text,
    });
};

    // Detect '@' key for file suggestions
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (value.includes('@')) {
            vscode.postMessage({ type: 'listFiles' });
        }
    };
    const handleMessage = (event: MessageEvent) => {
        const message = event.data;

        if (message.type === 'aiResponse') {
          const content = message.content || '[No response from AI]';
          setMessages(prev => [...prev, { role: 'assistant', content}]);
        } else if (message.type === 'fileContent') {
            const modifiedText = `${message.originalText}\n\nAttached File Content:\n${message.content}`;

            // Resend the modified message to backend as AI prompt
            sendUserMessage(modifiedText);
        }
    };

    return (
        <div>
            <div style={{ height: '400px', overflowY: 'scroll' }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '5px 0' }}>
                    <b>{msg.role === 'user' ? 'You' : 'AI'}:</b> {msg.content}
                    </div>

                ))}
            </div>
            <input value={inputValue} onChange={handleChange} />
            <button onClick={handleSend}>Send</button>

            {fileList.length > 0 && (
                <div>
                    <h4>Select file to attach:</h4>
                    {fileList.map((file, idx) => (
                      <div key={idx} onClick={() => {
                        vscode.postMessage({
                          type: 'readFile',
                          filePath: file,
                          originalText: inputValue,
                        });
                      }}>{file}</div>
                    ))}

                </div>
            )}
        </div>
    );
};

export default App;

