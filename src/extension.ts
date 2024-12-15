import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const standardHeaders = new Set([
    'algorithm', 'any', 'array', 'atomic', 'bitset', 'cassert', 'ccomplex', 'cctype', 'cerrno', 'cfenv', 'cfloat', 'charconv', 'chrono', 'cinttypes', 'ciso646', 'climits', 'clocale', 'cmath', 'codecvt', 'complex', 'condition_variable', 'csetjmp', 'csignal', 'cstdalign', 'cstdarg', 'cstdbool', 'cstddef', 'cstdint', 'cstdio', 'cstdlib', 'cstring', 'ctgmath', 'ctime', 'cuchar', 'cwchar', 'cwctype', 'deque', 'exception', 'filesystem', 'forward_list', 'fstream', 'functional', 'future', 'initializer_list', 'iomanip', 'ios', 'iosfwd', 'iostream', 'istream', 'iterator', 'limits', 'list', 'locale', 'map', 'memory_resource', 'memory', 'mutex', 'new', 'numeric', 'optional', 'ostream', 'queue', 'random', 'ratio', 'regex', 'scoped_allocator', 'set', 'shared_mutex', 'sstream', 'stack', 'stdexcept', 'streambuf', 'string_view', 'string', 'system_error', 'thread', 'tuple', 'type_traits', 'typeindex', 'typeinfo', 'unordered_map', 'unordered_set', 'utility', 'valarray', 'variant', 'vector'
]);

function parseFile(filePath: string, visited: Set<string> = new Set(), allDeps: Record<string, Set<string>> = {}): void
{
    if (visited.has(filePath)) return;
    visited.add(filePath);

    const fileDir = path.dirname(filePath);
    const includeRegex = /^\s*#include\s+["<](.*?)[">]/;

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        const dependencies: Set<string> = new Set();
        
        for (const line of lines) {
            const match = includeRegex.exec(line);
            if (match) {
                const includePath = match[1];

                // TODO: Shouldn't work with target_include_directories in CMake
                if (!includePath.startsWith('<')) {
                    const fullPath = path.resolve(fileDir, includePath);
                    dependencies.add(fullPath);
                    parseFile(fullPath, visited, allDeps);
                }
            }
        }

        allDeps[filePath] = dependencies;
    } catch (err) {
        console.error(`Failed to read file: ${filePath}`, err);
    }
}

function depsToGraphStr(allDeps: Record<string, Set<string>>, baseDir: string): string {
    let graphStr = 'graph TD\n';

    for (var [file, dependencies] of Object.entries(allDeps)) {
        file = file.replaceAll('\\', '/');
        file = file.startsWith(baseDir) ? '.' + file.substring(baseDir.length) : file;

        for (var dep of dependencies) {
            dep = dep.replaceAll('\\', '/');
            dep = dep.startsWith(baseDir) ? '.' + dep.substring(baseDir.length) : dep;
            dep = standardHeaders.has(dep.substring(dep.lastIndexOf('/') + 1)) ? dep.substring(dep.lastIndexOf('/') + 1) : dep;
            graphStr += `  ${file} --> ${dep}\n`;
        }
    }

    return graphStr;
}

function analyzeIncludes(): void
{
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor window');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const baseDir = path.dirname(filePath)
    const allDeps: Record<string, Set<string>> = {};
    const visited = new Set<string>();

    parseFile(filePath, visited, allDeps);

    const graphStr = depsToGraphStr(allDeps, baseDir);

    const panel = vscode.window.createWebviewPanel(
        'cppIncludes.graph',
        'Dependecies Graph',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
        }
    );

    const htmlContent = `
        <html>
        <head>
            <script type="module">
                import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
                mermaid.initialize({ startOnLoad: true });
            </script>
        </head>
        <body>
            <div class="mermaid">
                ${graphStr}
            </div>
        </body>
        </html>
    `;

    panel.webview.html = htmlContent;
}

function activate(context: vscode.ExtensionContext): void
{
    const command = vscode.commands.registerCommand('cppIncludes.analyze', analyzeIncludes);
    context.subscriptions.push(command);
}

function deactivate(): void
{ }

export { activate, deactivate };
