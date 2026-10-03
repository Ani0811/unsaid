#!/usr/bin/env node

/**
 * Unsaid - Native Terminal Shell (CLI REPL)
 * A private terminal for the things you don't know how to say out loud.
 * Linked bidirectionally with the Unsaid Desktop Application.
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

// Terminal ANSI styling
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  amber: '\x1b[38;2;245;158;11m',
  sky: '\x1b[38;2;56;189;248m',
  purple: '\x1b[38;2;192;132;252m',
  emerald: '\x1b[38;2;52;211;153m',
  rose: '\x1b[38;2;251;113;133m',
  zinc: '\x1b[38;2;161;161;170m',
  white: '\x1b[38;2;244;244;245m'
};

const STORAGE_DIR = path.join(os.homedir(), '.unsaid');
const STORAGE_FILE = path.join(STORAGE_DIR, 'reflections.json');

const LM_STUDIO_URL = process.env.VITE_LM_STUDIO_BASE_URL || 'http://localhost:1234/v1';
const DESKTOP_URL = 'http://localhost:5173';
let activeModel = process.env.VITE_LM_STUDIO_MODEL || '';
let piiMasking = false;
let currentMode = null; // 'talk' | 'unload' | 'unsaid' | null

// Ensure storage dir exists
try {
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
} catch {}

function loadHistory() {
  try {
    if (!fs.existsSync(STORAGE_FILE)) return [];
    return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveReflection(mode, userText, aiText) {
  try {
    const list = loadHistory();
    const now = Date.now();
    const convo = {
      id: 'convo_term_' + now + '_' + Math.random().toString(36).substring(2, 6),
      title: userText.slice(0, 48) + (userText.length > 48 ? '...' : ''),
      mode,
      messages: [
        { id: 'msg_' + now, role: 'user', content: userText, timestamp: now },
        { id: 'asst_' + now, role: 'assistant', content: aiText, timestamp: now }
      ],
      createdAt: now,
      updatedAt: now,
      source: 'terminal_shell'
    };

    list.unshift(convo);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list.slice(0, 100), null, 2));

    // Optional background sync with desktop server if active
    fetch(`${DESKTOP_URL}/api/bridge/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([convo])
    }).catch(() => {});
  } catch {}
}

const COMMON_BOUNDARIES = `
You are Unsaid, a calm, private local AI companion designed for personal reflection.
You are NOT an AI therapist, counselor, psychologist, medical professional, or diagnostic system.
Rules:
1. NON-CLINICAL: Never diagnose conditions. Use gentle conversational language ("It sounds like this has been weighing heavily on you").
2. NO MIND-READING: Never pretend to know what another person thinks or feels.
3. USER AUTONOMY: Avoid unsolicited advice lists or fixing behaviors.
4. CALM & GROUNDED: Keep your tone warm, concise, and spacious.
`;

const PROMPTS = {
  talk: `${COMMON_BOUNDARIES}\nMODE: TALK. Listen actively, validate without diagnosing, ask 1 gentle follow-up question when appropriate.`,
  unload: `${COMMON_BOUNDARIES}\nMODE: UNLOAD. Hold space for a thought dump. Reflect core themes. Do NOT provide advice or action items.`,
  unsaid: `${COMMON_BOUNDARIES}\nMODE: UNSAID. Explore words left unexpressed to someone else. Help clarify what the user wishes was understood without guessing the other person's thoughts.`
};

const SELF_HARM_REGEX = /\b(kill\s*myself|want\s*to\s*die|end\s*(my\s*life|it\s*all)|commit\s*suicide|suicidal|hang\s*myself|slit\s*my\s*(wrists|throat)|overdose\s*(on|myself)|don'?t\s*want\s*to\s*(live|wake\s*up)\s*anymore|better\s*off\s*dead|no\s*reason\s*to\s*live|hurt\s*myself|self[\s-]harm|cutting\s*myself)\b/i;

function printBanner() {
  console.clear();
  console.log(`
${C.amber}   _   _                 _     _ ${C.reset}
${C.amber}  | | | |_ __  ___  __ _(_) __| |${C.reset}    ${C.bold}${C.white}UNSAID TERMINAL SHELL${C.reset}
${C.amber}  | | | | '_ \\/ __|/ _\` | |/ _\` |${C.reset}    ${C.dim}Linked with Unsaid Desktop App${C.reset}
${C.amber}  | |_| | | | \\__ \\ (_| | | (_| |${C.reset}    ${C.zinc}Local Gemma · LM Studio · Zero Cloud${C.reset}
${C.amber}   \\___/|_| |_|___/\\__,_|_|\\__,_|${C.reset}    ${C.emerald}● Bridge: ~/.unsaid/reflections.json${C.reset}
`);
  console.log(`${C.dim}────────────────────────────────────────────────────────────────────────────${C.reset}`);
  console.log(`  Commands: ${C.bold}help${C.reset}, ${C.amber}talk${C.reset}, ${C.sky}unload${C.reset}, ${C.purple}unsaid${C.reset}, ${C.emerald}app${C.reset} (open desktop app), ${C.white}sync${C.reset}`);
  console.log(`${C.dim}────────────────────────────────────────────────────────────────────────────${C.reset}\n`);
}

async function checkConnection() {
  process.stdout.write(`${C.zinc}Testing connection to LM Studio (${LM_STUDIO_URL})... ${C.reset}`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${LM_STUDIO_URL}/models`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const models = Array.isArray(data?.data) ? data.data.map(m => m.id) : [];
      const gemma = models.find(m => m.toLowerCase().includes('gemma')) || models[0];
      if (gemma) activeModel = gemma;

      console.log(`${C.emerald}CONNECTED${C.reset}`);
      console.log(`  ${C.dim}Active Model:${C.reset} ${C.bold}${C.white}${activeModel || 'Auto-select'}${C.reset}`);
      console.log(`  ${C.dim}Available Models:${C.reset} ${models.join(', ') || 'None reported'}`);
      return true;
    }
  } catch {}

  console.log(`${C.rose}OFFLINE${C.reset}`);
  console.log(`  ${C.dim}LM Studio is not reachable at ${LM_STUDIO_URL}.${C.reset}`);
  console.log(`  ${C.zinc}Start LM Studio, load your Gemma model, and start the local server on port 1234.${C.reset}`);
  return false;
}

function launchDesktopApp() {
  console.log(`${C.emerald}Launching Desktop App window (${DESKTOP_URL})...${C.reset}`);
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', 'start-desktop.bat'], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else {
    spawn('open', [DESKTOP_URL], { detached: true, stdio: 'ignore' }).unref();
  }
}

async function syncWithDesktop() {
  process.stdout.write(`${C.zinc}Syncing with Unsaid Desktop App... ${C.reset}`);
  try {
    const localHistory = loadHistory();
    const res = await fetch(`${DESKTOP_URL}/api/bridge/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localHistory)
    });
    if (res.ok) {
      const result = await res.json();
      if (Array.isArray(result.data)) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(result.data, null, 2));
      }
      console.log(`${C.emerald}SYNCED (${result.count || localHistory.length} reflections shared)${C.reset}`);
      return;
    }
  } catch {}

  console.log(`${C.amber}SAVED LOCALLY${C.reset}`);
  console.log(`  ${C.dim}Desktop server is offline. Reflections stored in ~/.unsaid/reflections.json${C.reset}`);
}

async function streamReflection(mode, userText) {
  // Safety check
  if (SELF_HARM_REGEX.test(userText)) {
    console.log(`\n${C.rose}${C.bold}[SAFETY NOTICE] You are not alone, and help is available right now.${C.reset}`);
    console.log(`${C.zinc}Unsaid is an automated reflection tool, not clinical care. Please connect with trusted support:${C.reset}`);
    console.log(`  • ${C.white}US/Canada: Call or text ${C.bold}988${C.reset} (Free 24/7 Lifeline)`);
    console.log(`  • ${C.white}Crisis Text Line: Text ${C.bold}HOME to 741741${C.reset}`);
    console.log(`  • ${C.white}UK: Call ${C.bold}111${C.reset} (NHS) or ${C.bold}116 123${C.reset} (Samaritans)`);
    console.log(`  • ${C.white}International: ${C.sky}https://findahelpline.com${C.reset}\n`);
    return;
  }

  // PII masking if active
  let processed = userText;
  if (piiMasking) {
    processed = processed
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[email]')
      .replace(/\b(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g, '[phone]');
  }

  console.log(`\n${C.dim}Gemma is reflecting...${C.reset}\n`);

  try {
    const payload = {
      model: activeModel || 'gemma',
      messages: [
        { role: 'system', content: PROMPTS[mode] },
        { role: 'user', content: processed }
      ],
      temperature: 0.7,
      stream: true
    };

    const res = await fetch(`${LM_STUDIO_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`LM Studio returned status ${res.status} (${res.statusText})`);
    }

    let fullResponse = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    process.stdout.write(`${C.white}`);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              process.stdout.write(delta);
            }
          } catch {}
        }
      }
    }

    process.stdout.write(`${C.reset}\n\n`);
    saveReflection(mode, userText, fullResponse);
  } catch {
    console.log(`${C.rose}Could not reach local Gemma model via LM Studio.${C.reset}`);
    console.log(`${C.dim}Tip: Start LM Studio, load Gemma, and start server on port 1234. (Or use the web preview at localhost:5173)${C.reset}\n`);
  }
}

function promptText() {
  if (currentMode) {
    const color = currentMode === 'talk' ? C.amber : currentMode === 'unload' ? C.sky : C.purple;
    return `${color}unsaid:${currentMode}${C.reset}> `;
  }
  return `${C.amber}unsaid${C.reset}> `;
}

export function startShell() {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: promptText()
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const raw = line.trim();

    // Mode-specific input
    if (currentMode) {
      if (raw.toLowerCase() === 'exit' || raw.toLowerCase() === 'back' || raw === ':q') {
        console.log(`${C.dim}Leaving ${currentMode.toUpperCase()} mode.${C.reset}\n`);
        currentMode = null;
        rl.setPrompt(promptText());
        rl.prompt();
        return;
      }

      if (raw) {
        await streamReflection(currentMode, raw);
      }
      rl.prompt();
      return;
    }

    // Root shell commands
    const [cmd, ...args] = raw.split(' ');
    const rest = args.join(' ').trim();

    switch (cmd.toLowerCase()) {
      case 'help':
      case '?':
        console.log(`
${C.bold}Commands:${C.reset}
  ${C.amber}talk${C.reset} [thought]       Enter conversational TALK mode or say a thought
  ${C.sky}unload${C.reset} [dump]        Enter UNLOAD mode to dump thoughts without fixing
  ${C.purple}unsaid${C.reset} [words]       Enter UNSAID mode to explore words meant for someone
  ${C.emerald}app / desktop${C.reset}       Launch the Unsaid standalone Desktop App window
  ${C.emerald}sync${C.reset}                Bidirectionally synchronize with Desktop App
  ${C.white}status${C.reset}               Check LM Studio & Gemma connection
  ${C.white}history${C.reset}              View recent local reflections
  ${C.white}mask [on|off]${C.reset}        Toggle client-side PII scrubbing (${piiMasking ? C.emerald + 'ON' : C.zinc + 'OFF'}${C.reset})
  ${C.white}clear${C.reset}                Clear terminal screen
  ${C.white}exit / quit${C.reset}          Exit Unsaid shell
`);
        break;

      case 'app':
      case 'desktop':
      case 'gui':
        launchDesktopApp();
        break;

      case 'sync':
        await syncWithDesktop();
        console.log('');
        break;

      case 'status':
        await checkConnection();
        console.log('');
        break;

      case 'talk':
        if (rest) {
          await streamReflection('talk', rest);
        } else {
          currentMode = 'talk';
          console.log(`\n${C.amber}Entered TALK mode.${C.reset} ${C.dim}Say what's on your mind. (Type 'back' to exit mode)${C.reset}\n`);
          rl.setPrompt(promptText());
        }
        break;

      case 'unload':
        if (rest) {
          await streamReflection('unload', rest);
        } else {
          currentMode = 'unload';
          console.log(`\n${C.sky}Entered UNLOAD mode.${C.reset} ${C.dim}Dump thoughts without needing to solve them. (Type 'back' to exit mode)${C.reset}\n`);
          rl.setPrompt(promptText());
        }
        break;

      case 'unsaid':
        if (rest) {
          await streamReflection('unsaid', rest);
        } else {
          currentMode = 'unsaid';
          console.log(`\n${C.purple}Entered UNSAID mode.${C.reset} ${C.dim}Explore what you wish you could say. (Type 'back' to exit mode)${C.reset}\n`);
          rl.setPrompt(promptText());
        }
        break;

      case 'history': {
        const items = loadHistory();
        if (items.length === 0) {
          console.log(`\n${C.dim}No reflections recorded yet in ~/.unsaid/reflections.json.${C.reset}\n`);
        } else {
          console.log(`\n${C.bold}Recent Reflections (${items.length}):${C.reset}`);
          items.slice(0, 10).forEach((item, idx) => {
            const time = new Date(item.updatedAt || item.timestamp).toLocaleString();
            const modeColor = item.mode === 'talk' ? C.amber : item.mode === 'unload' ? C.sky : C.purple;
            const userMsg = item.messages ? item.messages.find(m => m.role === 'user')?.content : item.userText;
            const aiMsg = item.messages ? item.messages.find(m => m.role === 'assistant')?.content : item.aiText;

            console.log(`  ${C.dim}${idx + 1}.${C.reset} [${modeColor}${(item.mode || 'talk').toUpperCase()}${C.reset}] ${C.dim}${time}${C.reset} ${item.source === 'terminal_shell' ? C.emerald + '· Terminal' : C.sky + '· Desktop'}${C.reset}`);
            if (userMsg) console.log(`     ${C.white}You:${C.reset} ${userMsg.slice(0, 60)}${userMsg.length > 60 ? '...' : ''}`);
            if (aiMsg) console.log(`     ${C.zinc}Unsaid:${C.reset} ${aiMsg.slice(0, 80).replace(/\n/g, ' ')}...\n`);
          });
        }
        break;
      }

      case 'mask':
        if (rest.toLowerCase() === 'on') piiMasking = true;
        else if (rest.toLowerCase() === 'off') piiMasking = false;
        else piiMasking = !piiMasking;
        console.log(`\nPII Masking is now ${piiMasking ? C.emerald + 'ENABLED' : C.zinc + 'DISABLED'}${C.reset}\n`);
        break;

      case 'clear':
      case 'cls':
        printBanner();
        break;

      case 'exit':
      case 'quit':
        console.log(`\n${C.zinc}Take care of yourself. Exiting Unsaid shell.${C.reset}`);
        rl.close();
        process.exit(0);
        break;

      case '':
        break;

      default:
        console.log(`${C.rose}Unknown command: "${cmd}". Type "help" for available commands.${C.reset}`);
        break;
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

// If executed directly from CLI
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  startShell();
}
