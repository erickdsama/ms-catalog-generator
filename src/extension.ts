// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { join, posix } from 'path';
import { window, ProgressLocation } from 'vscode';

export async function writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<void> {
	await vscode.workspace.fs.writeFile(uri, content);
	
}
export async function spaceToCamelCase(str: string): Promise<string> {
	const camelCase = str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
		return index === 0 ? word.toLowerCase() : word.toUpperCase();
	}).replace(/\s+/g, '');
	return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

export async function readFile(uri: vscode.Uri): Promise<string> {
	const readData = await vscode.workspace.fs.readFile(uri);
	return Buffer.from(readData).toString('utf8');
}

interface DataObject {
	[key: string]: {
		template: string;
		output: string;
	};
}

const Data: DataObject = {
	
	domainModel: {
		"template": "src/resources/DomainModel.txt",
		"output": "src/modules/catalog/domain/models"
	},
	domainDoctype: {
		"template": "src/resources/DomainModel.txt",
		"output": "src/modules/catalog/domain/doctypes"
	},
	service: {
		"template": "src/resources/DomainModel.txt",
		"output": "src/modules/catalog/services"
	},
	fetcher: {
		"template": "src/resources/Fetcher.txt",
		"output": "src/modules/catalog/http"
	},
	domainRepo: {
		"template": "src/resources/Fetcher.txt",
		"output": "src/modules/catalog/domain/repositories"
	}

};
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "cataloggenerator" is now active!');

	let disposable = vscode.commands.registerCommand('cataloggenerator.GenerateFiles', async (uri = vscode.Uri)  => {
		const folderUri = vscode.workspace.workspaceFolders![0].uri;

		const doctypeName = await window.showInputBox({placeHolder: 'Enter the name of the Doctype'});

		const docUpperCase = await spaceToCamelCase(doctypeName!);
		console.log(docUpperCase);
		window.withProgress({
			location: ProgressLocation.Notification,
				title: "Generating Files",
				cancellable: true
			}, (progress, token) => {
				token.onCancellationRequested(() => {
					console.log("User canceled the long running operation");
				});
				const extensionPath = vscode.extensions.getExtension('erickdsama.cataloggenerator')?.extensionUri.fsPath;
				

				const p = new Promise<void>(async (resolve) => {
					console.log("Progress started");
					Object.keys(Data).forEach(async (key) => {
						const data = await readFile(vscode.Uri.file(join(extensionPath!, Data[key].template)));
						var newData: string = data.replaceAll('Template', docUpperCase);
						newData = newData.replaceAll('DOCTYPE_NAME', doctypeName!);

						const outputPath = Data[key].output;
						const templateUri = folderUri.with({ path: posix.join(folderUri.path, outputPath, docUpperCase+'.ts') });
						await writeFile(
							templateUri, 
							Buffer.from(newData, 'utf8'), { create: true, overwrite: true }
							);
							progress.report({ increment: 25, message: `${key} Created` });
					});

					resolve();
				});
				return p;
			});

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
