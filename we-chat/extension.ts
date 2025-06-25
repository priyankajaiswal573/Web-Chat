import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "we-chat" is now active!');

  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  context.subscriptions.push(
    vscode.commands.registerCommand("we-chat.start", () => {
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
      } else {
        currentPanel = vscode.window.createWebviewPanel(
          "weChat",
          "WeChat",
          columnToShowIn || vscode.ViewColumn.One,
          {
            enableScripts: true,
            localResourceRoots: [
              vscode.Uri.file(path.join(context.extensionPath, "media")),
            ],
          }
        );

        const webviewPath = vscode.Uri.file(
          path.join(context.extensionPath, "media", "dist", "index.html")
        );
        currentPanel.webview.html = getWebviewContent(webviewPath.toString());

        currentPanel.webview.onDidReceiveMessage(
          (message) => {
            switch (message.type) {
              case "userMessage":
                vscode.window.showInformationMessage(
                  `User Message: ${message.text}`
                );
                // TODO: Integrate with AI model here and send response back
                currentPanel?.webview.postMessage({
                  type: "aiResponse",
                  content: `AI received: ${message.text}`,
                });
                return;
              case "readFile":
                const filePath = path.join(
                  vscode.workspace.rootPath || "",
                  message.filePath
                );
                vscode.workspace.fs
                  .readFile(vscode.Uri.file(filePath))
                  .then((content) => {
                    currentPanel?.webview.postMessage({
                      type: "fileContent",
                      content: content.toString(),
                      originalText: message.originalText,
                    });
                  })
                  .then(undefined, (err) => {
                    vscode.window.showErrorMessage(
                      `Error reading file: ${err.message}`
                    );
                  });
                return;
              case "listFiles":
                // This is a simplified example. In a real scenario, you'd want to list files
                // more intelligently, perhaps based on a glob pattern or user input.
                vscode.workspace
                  .findFiles("**/*", "**/{node_modules,dist,build}/**", 100)
                  .then((files) => {
                    const fileNames = files.map((file) =>
                      vscode.workspace.asRelativePath(file)
                    );
                    currentPanel?.webview.postMessage({
                      type: "fileList",
                      files: fileNames,
                    });
                  })
                  .then(undefined, (err) => {
                    vscode.window.showErrorMessage(
                      `Error listing files: ${err.message}`
                    );
                  });
                return;
            }
          },
          undefined,
          context.subscriptions
        );

        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
          },
          null,
          context.subscriptions
        );
      }
    })
  );
}

export function deactivate() {}

function getWebviewContent(webviewUri: string) {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WeChat</title>
    </head>
    <body>
        <div id="root"></div>
        <script src="${webviewUri}"></script>
    </body>
    </html>`;
}

