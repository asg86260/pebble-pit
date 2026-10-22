// The Playwright MCP server (.mcp.json), started with the flags this machine
// needs, so one project config serves the owner's desk and a cloud container
// alike: Claude drives the game in a real browser, clicks, reads the page's
// accessibility tree and takes shots, alongside look.mjs and the suites.
//
// - A container with browsers preinstalled (PLAYWRIGHT_BROWSERS_PATH holding
//   a `chromium` launcher, downloads blocked) is given that browser, headless,
//   and no sandbox when run as root; elsewhere playwright uses its own
//   browser, fetched on first use.
// - No display (a container, CI) is headless; a desk shows the window, so
//   the owner can watch what is being clicked.
// - What it writes (shots, traces) goes to .playwright-mcp/, which is ignored.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';

const VERSION = '0.0.83';
const args = ['-y', `@playwright/mcp@${VERSION}`, '--isolated', '--output-dir', '.playwright-mcp'];
const pre = process.env.PLAYWRIGHT_BROWSERS_PATH && `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium`;
if (pre && existsSync(pre)) args.push('--executable-path', pre);
if (process.env.CI || (platform() === 'linux' && !process.env.DISPLAY)) args.push('--headless');
if (process.getuid?.() === 0) args.push('--no-sandbox');

const child = spawn(platform() === 'win32' ? 'npx.cmd' : 'npx', args, { stdio: 'inherit', shell: platform() === 'win32' });
child.on('exit', code => process.exit(code ?? 1));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
