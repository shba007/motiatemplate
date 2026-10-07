---------------------------------------------------------
// .dockerignore
# Git
.git
.gitignore

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# Node
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Local development
.env

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
---

***

---

// .husky/commit-msg
#!/usr/bin/env sh

#Lint Commit
bun x commitlint --edit $1

---

---

// .husky/pre-commit
#!/usr/bin/env sh
set -e

# Get the list of staged files

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g')

# If gitleaks is available, scan each staged file

if command -v gitleaks >/dev/null 2>&1; then
for file in $STAGED_FILES; do
[ -f "$file" ] && gitleaks detect --source="$file" --no-git --no-banner --verbose
done
else
echo "⚠️ gitleaks not found; skipping secret scan"
fi

# Lint the staged files

bun lint $STAGED_FILES

# Format the staged files, ignoring unknown files

bun format $STAGED_FILES --ignore-unknown

# Update the index to mark the changes in the staged files

git update-index --again

---

---

// .prettierignore

# Nuxt dev/build outputs

.cache
.data
.nuxt
.nitro
.output
dist

# Node dependencies

node_modules

# Package Manager

package.json
bun.lock

# Logs

logs
*.log

# Misc

.DS_Store
.fleet
.idea

# Env files

.env*
!.env.example
---------------------------------------------------------

---

// config.yaml

# config.yaml

workers:

- name: configuration
  config:
  adapter:
  name: fs
  config:
  directory: /data/config
- name: iii-worker-manager
  config:
  host: 0.0.0.0
  port: 49134

---

---

// docker-compose.yml
services:
engine:
image: iiidev/iii:latest
restart: unless-stopped
ports: - '49134:49134' # Engine WebSocket (SDK worker connections) - '3111:3111' # HTTP Ingress - '3113:3113' # Web Console
volumes: - ./config.yaml:/app/config.yaml:ro - engine_data:/data
command: ['--config', '/app/config.yaml', '--no-update-check']

caller-worker:
build:
context: .
dockerfile: Dockerfile
restart: unless-stopped
depends_on: - engine
environment: - III_URL=ws://engine:49134

volumes:
engine_data:

---

---

// eslint.config.js
import unjs from 'eslint-config-unjs'

export default unjs({
ignores: ['node_modules', 'dist', 'static'],
rules: {
'unicorn/no-anonymous-default-export': 0,
},
})

---

---

// package.json
{
"name": "iii-template",
"version": "0.1.0",
"description": "iii + TypeScript Worker Template",
"type": "module",
"private": true,
"engines": {
"node": ">=22.0.0",
"bun": ">=1.2.0"
},
"packageManager": "bun@1.4.2",
"scripts": {
"dev": "iii",
"console": "iii console",
"worker:dev": "bun run --cwd workers/caller-worker dev",
"worker:build": "bun run --cwd workers/caller-worker build",
"lint": "eslint . --fix",
"format": "prettier . --write",
"docker:build": "docker compose build",
"docker:up": "docker compose up -d"
},
"devDependencies": {
"@commitlint/config-conventional": "^21.2.3",
"@types/node": "^26.6.4",
"eslint": "^10.12.0",
"eslint-config-unjs": "^0.6.2",
"prettier": "^3.9.9",
"typescript": "^7.0.2"
}
}

---

---

// prettier.config.js
/**

- @see https://prettier.io/docs/en/configuration.html
- @type {import("prettier").Config}
  */
  export default {
  bracketSameLine: true,
  printWidth: 200,
  trailingComma: 'es5',
  semi: false,
  singleQuote: true,
  plugins: [],
  }

---

---

// renovate.json
{
"extends": ["github>unjs/renovate-config"]
}

---

---

// workers/caller-worker/iii.worker.yaml
name: caller-worker
runtime:
language: typescript
package_manager: bun
entry: src/worker.ts
scripts:
install: bun install
start: bun run src/worker.ts

---

---

// workers/caller-worker/package.json
{
"name": "caller-worker",
"version": "0.1.0",
"type": "module",
"description": "TypeScript API & worker services for iii",
"scripts": {
"dev": "bun --watch src/worker.ts",
"build": "tsc"
},
"dependencies": {
"iii-sdk": "^0.11.0",
"zod": "^3.24.2"
},
"devDependencies": {
"@types/node": "^22.0.0",
"typescript": "^5.8.0"
}
}

---

---

// workers/caller-worker/src/worker.ts
import { registerWorker, Logger } from 'iii-sdk'

const engineUrl = process.env.III_URL ?? 'ws://127.0.0.1:49134'
const worker = registerWorker(engineUrl)
const logger = new Logger()

// ==========================================
// 1. Health Check (Migrated from health.step.ts)
// ==========================================
worker.registerFunction('api::health', async () => {
return {
status_code: 200,
headers: { 'Content-Type': 'application/json' },
body: {
status: 'OK',
timestamp: new Date().toISOString(),
node: process.env.HOSTNAME || 'local-node',
uptime: process.uptime(),
},
}
})

worker.registerTrigger({
type: 'http',
function_id: 'api::health',
config: {
api_path: '/health',
http_method: 'GET',
},
})

// ==========================================
// 2. Math Add Endpoint & Function
// ==========================================
worker.registerFunction('math::add', async (payload: { a: number; b: number }) => {
logger.info('Executing math::add', payload)
const { a, b } = payload
return {
a,
b,
result: a + b,
}
})

worker.registerFunction('http::add_two_numbers', async (event: { body: { a: number; b: number } }) => {
const { a, b } = event.body ?? {}
if (typeof a !== 'number' || typeof b !== 'number') {
return {
status_code: 400,
headers: { 'Content-Type': 'application/json' },
body: { error: 'Payload must contain numbers "a" and "b"' },
}
}

// Trigger internal function
const mathResult = await worker.trigger({
function_id: 'math::add',
payload: { a, b },
})

return {
status_code: 200,
headers: { 'Content-Type': 'application/json' },
body: mathResult,
}
})

worker.registerTrigger({
type: 'http',
function_id: 'http::add_two_numbers',
config: {
api_path: '/math/add',
http_method: 'POST',
},
})

console.log(`Caller worker connected to iii engine at ${engineUrl}`)

---