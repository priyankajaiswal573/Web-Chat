import * as vscode from 'vscode';
import OpenAI from 'openai';
const openai = new OpenAI({
    apiKey: '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',
});



export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.startChat', () => {
            const panel = vscode.window.createWebviewPanel(
                'chatAI',
                'AI Chat Assistant',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                }
            );

            panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

            panel.webview.onDidReceiveMessage(async message => {
                switch (message.type) {
					case 'userMessage': {
    					const userInput = message.text;

    					try {
        					const completion = await openai.chat.completions.create({
            					model: "gpt-4", // or "gpt-3.5-turbo"
            					messages: [{ role: 'user', content: userInput }],
        					});

        					const aiResponse = completion.choices[0].message.content;

        					panel.webview.postMessage({
            					type: 'aiResponse',
            					content: aiResponse
        					});

    					} catch (err) {
        					console.error("OpenAI API error:", (err as Error));
        					panel.webview.postMessage({
            					type: 'aiResponse',
            					content: "Error contacting AI: " + (err as Error).message
       						 });
    					}

    					break;
					}


                    case 'listFiles':
                        const files = await vscode.workspace.findFiles('**/*');
                        panel.webview.postMessage({
  							type: 'fileList',
  							files: files.map(f => f.fsPath)
						});

                        break;

                    case 'readFile':
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
  			const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, message.filePath);
  			const fileContent = await vscode.workspace.fs.readFile(fileUri);
  			const decoded = Buffer.from(fileContent).toString('utf8');
  			panel.webview.postMessage({
    			type: 'fileContent',
    			content: decoded,
    			originalText: message.originalText
  			});
		}

    } catch (error) {
        panel.webview.postMessage({
            type: 'fileContent',
            content: 'Error reading file: ' + error,
            originalText: message.originalText
        });
    }
    break;

                }
            });
        })
    );
}


function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'dist', 'assets', 'main.js'));
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Chat</title>
        </head>
        <body>
            <div id="root"></div>
            <script type="module" src="${scriptUri}"></script>
        </body>
        </html>
    `;
}

