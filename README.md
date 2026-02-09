# Timix n8n Nodes

Custom n8n community nodes for the Timix HR API.

## Prerequisites

1. Node.js (LTS) and npm
2. n8n installed locally (for development)
3. Git

## Clone The Repository

1. Choose a workspace folder on your machine.
2. Clone the repo:
   ```bash
   git clone https://github.com/Timar-team/n8n-nodes-timix.git
   ```
3. Enter the project folder:
   ```bash
   cd n8n-nodes-timix
   ```

## Install Dependencies

```bash
npm install
```

## Build

```bash
npm run build
```

## One-Step Build & Install Script

This script can run in two modes:

1. **Update**: reuse the last saved custom folder and optionally restart a Docker container
2. **Fresh setup**: ask for the custom folder and skip Docker restart

```bash
./build_timix_node.sh
```

The script will:

1. Ask for the mode (Update or Fresh setup)
2. Ask for the custom extensions folder if needed
3. Create the folder if it does not exist
4. Run `npm install` if needed
5. Run `npm run build`
6. Deploy the build output to `<custom-folder>/<package-name>`
7. Optionally restart a Docker container (Update mode only)

## Run In Development Mode (Recommended)

This starts n8n in dev mode and loads the node package directly.

```bash
npm run dev
```

## Install Into n8n (Local)

Use one of the following options after building.

Option A: Install from the local path

1. Create the custom nodes folder:
   ```bash
   mkdir -p ~/.n8n/custom
   ```
2. Install the package:
   ```bash
   cd ~/.n8n/custom
   npm init -y
   npm install /absolute/path/to/n8n-nodes-timix
   ```
3. Start n8n:
   ```bash
   n8n
   ```

Option B: Use npm link

1. From the node project folder:
   ```bash
   npm link
   ```
2. In the custom nodes folder:
   ```bash
   mkdir -p ~/.n8n/custom
   cd ~/.n8n/custom
   npm init -y
   npm link n8n-nodes-timix
   ```
3. Start n8n:
   ```bash
   n8n
   ```

## Scripts

1. `npm run build` - Compile TypeScript into `dist/`
2. `npm run dev` - Run n8n in dev mode with this package
3. `npm run lint` - Lint the codebase
4. `npm run lint:fix` - Lint and auto-fix
5. `npm run release` - Build a release

## Notes

1. Use the **Timix HR API** credential in n8n.
2. The **Timix Upload File** node expects binary inputs (default property name: `data`).
