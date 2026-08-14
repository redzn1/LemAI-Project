import { ParsedCodeBlock } from '../types';

export interface SupportedLanguageInfo {
  id: string;
  name: string;
  extension: string;
  defaultFilename: string;
  category: 'web' | 'general' | 'data' | 'system';
  previewable: boolean;
  aliases: string[];
}

export const LANGUAGE_REGISTRY: Record<string, SupportedLanguageInfo> = {
  // Web Programming (Previewable)
  html: {
    id: 'html',
    name: 'HTML',
    extension: '.html',
    defaultFilename: 'index.html',
    category: 'web',
    previewable: true,
    aliases: ['html', 'htm', 'xhtml'],
  },
  css: {
    id: 'css',
    name: 'CSS',
    extension: '.css',
    defaultFilename: 'style.css',
    category: 'web',
    previewable: true,
    aliases: ['css', 'scss', 'sass', 'less'],
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    defaultFilename: 'script.js',
    category: 'web',
    previewable: true,
    aliases: ['javascript', 'js', 'mjs', 'cjs', 'node'],
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    extension: '.ts',
    defaultFilename: 'main.ts',
    category: 'web',
    previewable: true,
    aliases: ['typescript', 'ts'],
  },
  jsx: {
    id: 'jsx',
    name: 'JSX (React)',
    extension: '.jsx',
    defaultFilename: 'App.jsx',
    category: 'web',
    previewable: true,
    aliases: ['jsx', 'react'],
  },
  tsx: {
    id: 'tsx',
    name: 'TSX (React + TS)',
    extension: '.tsx',
    defaultFilename: 'App.tsx',
    category: 'web',
    previewable: true,
    aliases: ['tsx'],
  },
  svg: {
    id: 'svg',
    name: 'SVG Vector',
    extension: '.svg',
    defaultFilename: 'icon.svg',
    category: 'web',
    previewable: true,
    aliases: ['svg', 'xml'],
  },

  // General & Backend Programming (Not live browser preview)
  python: {
    id: 'python',
    name: 'Python',
    extension: '.py',
    defaultFilename: 'main.py',
    category: 'general',
    previewable: false,
    aliases: ['python', 'py', 'python3'],
  },
  java: {
    id: 'java',
    name: 'Java',
    extension: '.java',
    defaultFilename: 'Main.java',
    category: 'general',
    previewable: false,
    aliases: ['java'],
  },
  c: {
    id: 'c',
    name: 'C',
    extension: '.c',
    defaultFilename: 'main.c',
    category: 'general',
    previewable: false,
    aliases: ['c'],
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    defaultFilename: 'main.cpp',
    category: 'general',
    previewable: false,
    aliases: ['cpp', 'c++', 'cc', 'cxx'],
  },
  csharp: {
    id: 'csharp',
    name: 'C#',
    extension: '.cs',
    defaultFilename: 'Program.cs',
    category: 'general',
    previewable: false,
    aliases: ['csharp', 'c#', 'cs'],
  },
  go: {
    id: 'go',
    name: 'Go',
    extension: '.go',
    defaultFilename: 'main.go',
    category: 'general',
    previewable: false,
    aliases: ['go', 'golang'],
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    extension: '.rs',
    defaultFilename: 'main.rs',
    category: 'general',
    previewable: false,
    aliases: ['rust', 'rs'],
  },
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin',
    extension: '.kt',
    defaultFilename: 'Main.kt',
    category: 'general',
    previewable: false,
    aliases: ['kotlin', 'kt', 'kts'],
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    extension: '.swift',
    defaultFilename: 'main.swift',
    category: 'general',
    previewable: false,
    aliases: ['swift'],
  },
  dart: {
    id: 'dart',
    name: 'Dart',
    extension: '.dart',
    defaultFilename: 'main.dart',
    category: 'general',
    previewable: false,
    aliases: ['dart', 'flutter'],
  },
  php: {
    id: 'php',
    name: 'PHP',
    extension: '.php',
    defaultFilename: 'index.php',
    category: 'general',
    previewable: false,
    aliases: ['php'],
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    extension: '.rb',
    defaultFilename: 'main.rb',
    category: 'general',
    previewable: false,
    aliases: ['ruby', 'rb'],
  },
  lua: {
    id: 'lua',
    name: 'Lua',
    extension: '.lua',
    defaultFilename: 'main.lua',
    category: 'general',
    previewable: false,
    aliases: ['lua'],
  },
  r: {
    id: 'r',
    name: 'R',
    extension: '.r',
    defaultFilename: 'script.R',
    category: 'data',
    previewable: false,
    aliases: ['r'],
  },
  sql: {
    id: 'sql',
    name: 'SQL',
    extension: '.sql',
    defaultFilename: 'query.sql',
    category: 'data',
    previewable: false,
    aliases: ['sql', 'mysql', 'postgresql', 'sqlite', 'plsql'],
  },
  bash: {
    id: 'bash',
    name: 'Bash',
    extension: '.sh',
    defaultFilename: 'script.sh',
    category: 'system',
    previewable: false,
    aliases: ['bash', 'sh', 'shell', 'zsh'],
  },
  powershell: {
    id: 'powershell',
    name: 'PowerShell',
    extension: '.ps1',
    defaultFilename: 'script.ps1',
    category: 'system',
    previewable: false,
    aliases: ['powershell', 'ps1', 'pwsh'],
  },
  json: {
    id: 'json',
    name: 'JSON',
    extension: '.json',
    defaultFilename: 'data.json',
    category: 'data',
    previewable: false,
    aliases: ['json'],
  },
  yaml: {
    id: 'yaml',
    name: 'YAML',
    extension: '.yaml',
    defaultFilename: 'config.yaml',
    category: 'system',
    previewable: false,
    aliases: ['yaml', 'yml'],
  },
  markdown: {
    id: 'markdown',
    name: 'Markdown',
    extension: '.md',
    defaultFilename: 'README.md',
    category: 'general',
    previewable: true,
    aliases: ['markdown', 'md'],
  },
};

/**
 * Resolve language identifier to normalized language info
 */
export function resolveLanguage(langRaw?: string): SupportedLanguageInfo {
  if (!langRaw) {
    return {
      id: 'text',
      name: 'Plain Text',
      extension: '.txt',
      defaultFilename: 'snippet.txt',
      category: 'general',
      previewable: false,
      aliases: ['text', 'txt', 'plaintext'],
    };
  }

  const normalized = langRaw.trim().toLowerCase().replace(/[^a-z0-9#+]/g, '');

  for (const lang of Object.values(LANGUAGE_REGISTRY)) {
    if (lang.aliases.includes(normalized) || lang.id === normalized) {
      return lang;
    }
  }

  return {
    id: normalized,
    name: normalized.toUpperCase(),
    extension: `.${normalized}`,
    defaultFilename: `code.${normalized}`,
    category: 'general',
    previewable: false,
    aliases: [normalized],
  };
}

/**
 * Checks if code is preview-compatible
 */
export function isWebPreviewable(langRaw?: string, codeContent?: string): boolean {
  const lang = resolveLanguage(langRaw);
  if (lang.previewable) return true;

  // Check if content itself is HTML or contains full <!DOCTYPE html> or <html>
  if (codeContent) {
    const trimmed = codeContent.trim().toLowerCase();
    if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || (trimmed.includes('<body') && trimmed.includes('</body>'))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate sandbox HTML srcdoc string with safety isolation
 */
export function generateSandboxSrcdoc(code: string, language: string): string {
  const lang = resolveLanguage(language);

  // If already full HTML document
  if (code.trim().toLowerCase().startsWith('<!doctype') || code.trim().toLowerCase().startsWith('<html')) {
    return code;
  }

  // If HTML snippet
  if (lang.id === 'html' || lang.id === 'svg') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 1.5rem; background: #0e0e0e; color: #f0f0f0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
  }

  // If CSS
  if (lang.id === 'css') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    ${code}
  </style>
</head>
<body class="p-8 font-sans">
  <div class="demo-card">
    <h2>CSS Preview Sample</h2>
    <p>This is a live preview demonstrating your custom CSS styling rules.</p>
    <button>Interactive Button</button>
  </div>
</body>
</html>`;
  }

  // If JavaScript / TypeScript snippet
  if (lang.id === 'javascript' || lang.id === 'typescript') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 1.5rem; background: #0a0a0a; color: #e5e5e5; font-family: monospace; }
    #console { background: #141414; padding: 1rem; border-radius: 8px; border: 1px solid #262626; min-height: 200px; overflow: auto; }
    .log-line { border-bottom: 1px solid #1f1f1f; padding: 4px 0; font-size: 13px; color: #4ade80; }
    .error-line { border-bottom: 1px solid #1f1f1f; padding: 4px 0; font-size: 13px; color: #f87171; }
  </style>
</head>
<body>
  <div class="mb-4">
    <h3 class="text-white font-semibold mb-1">JavaScript Runtime Output</h3>
    <p class="text-xs text-neutral-400">Captured console.log output from script</p>
  </div>
  <div id="console"></div>
  <div id="app" class="mt-4"></div>
  <script>
    const consoleDiv = document.getElementById('console');
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = function(...args) {
      originalLog(...args);
      const line = document.createElement('div');
      line.className = 'log-line';
      line.textContent = '> ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      consoleDiv.appendChild(line);
    };

    console.error = function(...args) {
      originalError(...args);
      const line = document.createElement('div');
      line.className = 'error-line';
      line.textContent = '❌ Error: ' + args.join(' ');
      consoleDiv.appendChild(line);
    };

    try {
      ${code}
    } catch(err) {
      console.error(err.message);
    }
  </script>
</body>
</html>`;
  }

  // If JSX / TSX
  if (lang.id === 'jsx' || lang.id === 'tsx') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0a0a0a; color: #eaeaea; font-family: system-ui, sans-serif; padding: 1.5rem; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    // Attempt to render if App or default component exists
    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    } else if (typeof Component !== 'undefined') {
      ReactDOM.createRoot(document.getElementById('root')).render(<Component />);
    }
  </script>
</body>
</html>`;
  }

  return code;
}

/**
 * Parses markdown text to identify pure text vs code blocks
 */
export function extractCodeBlocks(markdown: string): ParsedCodeBlock[] {
  const codeBlockRegex = /```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/g;
  const blocks: ParsedCodeBlock[] = [];
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const langRaw = match[1] || 'text';
    const code = match[2];
    const lang = resolveLanguage(langRaw);
    blocks.push({
      id: `block-${index++}`,
      language: lang.id,
      code: code.trim(),
      isPreviewable: isWebPreviewable(lang.id, code),
      filename: lang.defaultFilename,
    });
  }

  return blocks;
}

/**
 * Downloads a code string as a file with the proper extension
 */
export function triggerCodeDownload(filename: string, code: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([code], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
