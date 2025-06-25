import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const vscode = acquireVsCodeApi(); // VS Code API available in WebView
const sendMessageToExtension = (message) => {
    vscode.postMessage({
        type: 'userMessage',
        text: message,
    });
};
const App = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [fileList, setFileList] = useState([]);
    // Listen for messages from VS Code Extension backend
    useEffect(() => {
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'aiResponse') {
                // Append AI message to chat
                setMessages(prevMessages => [
                    ...prevMessages,
                    { role: 'assistant', content: message.content }
                ]);
            }
        });
        return () => {
            window.removeEventListener('message', () => { });
        };
    }, []);
    // Handle sending message
    const handleSend = () => {
        if (!inputValue.trim())
            return;
        // Extract @filename if present
        const match = inputValue.match(/@(\S+)/);
        if (match) {
            const fileName = match[1]; // e.g. package.json
            vscode.postMessage({
                type: 'readFile',
                filePath: fileName,
                originalText: inputValue // Send original message too
            });
        }
        else {
            // No file mention, send normal user message
            sendUserMessage(inputValue);
        }
        setMessages(prev => [...prev, { role: 'user', content: inputValue }]);
        setInputValue('');
    };
    const sendUserMessage = (text) => {
        vscode.postMessage({
            type: 'userMessage',
            text,
        });
    };
    // Detect '@' key for file suggestions
    const handleChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        if (value.includes('@')) {
            vscode.postMessage({ type: 'listFiles' });
        }
    };
    const handleMessage = (event) => {
        const message = event.data;
        if (message.type === 'aiResponse') {
            setMessages(prev => [...prev, { role: 'assistant', content: message.content }]);
        }
        else if (message.type === 'fileContent') {
            const modifiedText = `${message.originalText}\n\nAttached File Content:\n${message.content}`;
            // Resend the modified message to backend as AI prompt
            sendUserMessage(modifiedText);
        }
    };
    return (_jsxs("div", { children: [_jsx("div", { style: { height: '400px', overflowY: 'scroll' }, children: messages.map((msg, i) => (_jsxs("div", { children: [_jsxs("b", { children: [msg.sender, ":"] }), " ", msg.text] }, i))) }), _jsx("input", { value: inputValue, onChange: handleChange }), _jsx("button", { onClick: handleSend, children: "Send" }), fileList.length > 0 && (_jsxs("div", { children: [_jsx("h4", { children: "Select file to attach:" }), fileList.map((file, idx) => (_jsx("div", { onClick: () => {
                            vscode.postMessage({ type: 'readFile', filePath: file });
                        }, children: file }, idx)))] }))] }));
};
export default App;
