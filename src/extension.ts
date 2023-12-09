import path = require("path");
import * as vscode from "vscode";

const styledComponentsFiles = [
  {
    name: "index.ts",
    body: ["export { default as {{Component}} } from './{{Component}}';"],
    selected: true,
  },
  {
    name: `{{Component}}.tsx`,
    body: [
      "import * as S from './{{Component}}.styled';",
      "import { {{Component}}Props } from './{{Component}}.types';",
      "",
      "const {{Component}} = ({ children }: {{Component}}Props) => {",
      "  return <S.{{Component}}>{children}</S.{{Component}}>;",
      "};",
      "",
      "export default {{Component}};",
      "",
    ],
    selected: true,
  },
  {
    name: `{{Component}}.styled.ts`,
    body: [
      "import styled from 'styled-components';",
      "",
      "export const {{Component}} = styled.div``;",
      "",
    ],
    selected: true,
  },
  {
    name: `{{Component}}.types.ts`,
    body: [
      "export interface {{Component}}Props {",
      "  children: React.ReactNode;",
      "};",
    ],
    selected: true,
  },
  {
    name: `{{Component}}.utils.ts`,
    body: [""],
    selected: true,
    optional: true,
  },
  {
    name: `{{Component}}.constants.ts`,
    body: [""],
    selected: true,
    optional: true,
  },
];

const cssModuleFiles = [
  {
    name: "index.ts",
    body: ["export { default as {{Component}} } from './{{Component}}';"],
    selected: true,
  },
  {
    name: `{{Component}}.tsx`,
    body: [
      "import classNames from 'classnames/bind';",
      "",
      "import { {{Component}}Props } from './{{Component}}.types';",
      "import styles from './{{Component}}.module.scss';",
      "",
      "const {{Component}} = ({}: {{Component}}Props) => {",
      "  return <div className={cx('wrapper')}></div>;",
      "};",
      "",
      "export default {{Component}};",
      "",
    ],
    selected: true,
  },
  {
    name: `{{Component}}.module.scss`,
    body: [
      "@import '../../styles/mixin';",
      "",
      ".wrapper {",
      "  @include container-spacing('fl','m');",
      "}",
      "",
    ],
    selected: true,
  },
  {
    name: `{{Component}}.types.ts`,
    body: ["export interface {{Component}}Props {", "", "};"],
    selected: true,
  },
  {
    name: `{{Component}}.utils.ts`,
    body: [""],
    selected: true,
    optional: true,
  },
  {
    name: `{{Component}}.constants.ts`,
    body: [""],
    selected: true,
    optional: true,
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

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "component-folder-boilerplate.init",
    async (resource: vscode.Uri) => {
      const uri = resource
        ? resource
        : await getDirectoryUri(vscode.window.activeTextEditor?.document.uri);

      if (!uri) {
        return;
      }

      const stylingWay = await vscode.window.showQuickPick(
        ["styled-components", "css module(scss)"],
        {
          title: "스타일링 방식을 선택해주세요. 🍕",
        }
      );

      if (!stylingWay) {
        vscode.window.showErrorMessage("스타일링 방식을 선택해야됩니다. 🥒");
        return;
      }

      // 컴포넌트명 입력받기
      const componentName = await vscode.window.showInputBox({
        title: "컴포넌트명을 입력하세요 🍕",
      });

      if (!componentName) {
        vscode.window.showErrorMessage("컴포넌트명을 입력해야됩니다. 🥒");
        return;
      }

      const qp = vscode.window.createQuickPick();
      qp.canSelectMany = true;
      qp.title = "🍕 추가로 필요한 파일을 선택해주세요. 🍕";
      qp.items = styledComponentsFiles
        .filter((file) => file.optional)
        .map((file) => {
          return {
            label: file.name.replace(/{{Component}}/g, componentName),
            picked: file.selected,
          };
        });

      qp.show();

      qp.onDidAccept(async () => {
        const selectedStylingWayFile =
          stylingWay === "styled-components"
            ? styledComponentsFiles
            : cssModuleFiles;

        const requiredFiles = selectedStylingWayFile.filter(
          (file) => !file.optional
        );
        for (let file of requiredFiles) {
          const fileName = file.name.replace(/{{Component}}/g, componentName);
          const fileUri = vscode.Uri.joinPath(uri, componentName, fileName);
          const fileBody = file.body
            .join("\n")
            .replace(/{{Component}}/g, componentName);
          const fileData = new Uint8Array(Buffer.from(fileBody));

          await vscode.workspace.fs.writeFile(fileUri, fileData);
        }

        const selectedItemLabel = qp.selectedItems.map((item) => item.label);

        for (let label of selectedItemLabel) {
          const file: any = selectedStylingWayFile.find(
            (file) =>
              file.name === label.replace(componentName, "{{Component}}")
          );
          const fileUrl = vscode.Uri.joinPath(uri, componentName, label);
          const fileBody = file?.body
            .join("\n")
            .replace(/{{Component}}/g, componentName);
          const fileData = new Uint8Array(Buffer.from(fileBody ?? ""));

          await vscode.workspace.fs.writeFile(fileUrl, fileData);
        }

        qp.dispose();

        await vscode.window.showInformationMessage("컴포넌트 생성 완료 🥒");
      });
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
