// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path = require("path");
import * as vscode from "vscode";

const files = [
  {
    name: "index.ts",
    body: `
		export { default as {{Component}} } from './{{Component}}';
		`,
    selected: true,
  },
];

async function getDirectoryUri(uri?: vscode.Uri) {
  if (!uri) {
    throw new Error("No directory selected");
  }
  const fileStat = await vscode.workspace.fs.stat(uri);
  if (fileStat.type !== vscode.FileType.Directory) {
    return getParentDirectoryUri(uri);
  }

  return uri;
}

function getParentDirectoryUri(uri: vscode.Uri) {
  const filePath = uri.fsPath;
  const parentFolderPath = path.dirname(filePath);

  return vscode.Uri.file(parentFolderPath);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "component-folder-boilerplate" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "component-folder-boilerplate.init",
    async (resource: vscode.Uri) => {
      const uri = resource
        ? resource
        : await getDirectoryUri(vscode.window.activeTextEditor?.document.uri);

      if (!uri) {
        return;
      }

      // console.log(
      //   "설정",
      //   vscode.workspace.getConfiguration().get("hello.index")
      // );

      // 컴포넌트명 입력받기
      const componentName = await vscode.window.showInputBox({
        placeHolder: "Input your component name",
      });

      // 생성할 파일 선택
      const fileList = await vscode.window.showQuickPick(
        [
          { label: `index.ts`, picked: true },
          { label: `${componentName}.styled.ts`, picked: true },
          { label: `${componentName}.types.ts`, picked: true },
          { label: `${componentName}.utils.ts`, picked: true },
          { label: `${componentName}.constants.ts`, picked: true },
        ],
        {
          canPickMany: true,
          placeHolder: "Select the files you want to create",
        }
      );

      // TODO: 설정 값에 따라 파일 생성 지금은 하드 코딩 (가능할지 모르겠음 - 파일 선택 여부에 따라 import가 달라지고 해야해서)
      files.forEach((file) => {
        file.body = file.body.replace(/{{Component}}/g, componentName || "");
        const fileUri = vscode.Uri.joinPath(
          uri,
          componentName || "",
          file.name
        );
        const fileData = new Uint8Array(Buffer.from(file.body));

        vscode.workspace.fs.writeFile(fileUri, fileData);
        // vscode.window.showInformationMessage("파일 생성 완료");
      });

      // TODO: 선택한 것들에 따라 파일 다르게 생성

      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      // vscode.window.showInformationMessage(
      //   "Hello World from component-folder-boilerplate!"
      // );
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
