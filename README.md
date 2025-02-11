# Real-Time Workflow Monitor

![alt text](https://github.com/acoyfellow/workflow-live/blob/main/static/sketch.svg?raw=true)

Simple pattern for real-time workflow monitoring using Cloudflare Workers, Workflows, and Durable Objects.

## Why?
This project started as a challenge to build a real-time interface for Cloudflare Workers. The pattern enables powerful architectures for:
- AI Agent monitoring and control
- Edge computing mini-apps
- Real-time workflow orchestration
- Live system monitoring
- Interactive edge applications

## Demo
Try it live at [workflow-live.coey.dev](https://workflow-live.coey.dev/)

## Features
- WebSocket-based live updates from workflows
- Durable Object for connection management
- Minimal frontend for workflow control and monitoring
- Real-time workflow status updates
- Automatic error handling and retries
- Clean, accessible UI

## Overview
This project demonstrates how to build real-time workflow monitoring using Cloudflare's edge technologies. It uses WebSockets to stream live updates from Cloudflare Workflows to connected clients, with Durable Objects managing the WebSocket connections.

The demo includes a simple workflow that:
1. Executes a series of steps
2. Broadcasts progress updates in real-time
3. Handles failures gracefully
4. Provides visual feedback through the UI

## Quick Start

### Prerequisites
- Bun 1.2.2 / Node.js 16+
- Cloudflare Workers account
- Wrangler CLI

### Installation

```
# Clone the repo
git clone https://github.com/acoyfellow/workflow-live
cd workflow-live

# Install dependencies 
npm install

# Configure Cloudflare
wrangler login

# Deploy
npm run deploy
```

### Development

===
npm run dev
===

## Architecture

The project consists of three main components:

1. **Worker (src/index.ts)**
   - Handles HTTP/WebSocket routing
   - Manages workflow execution
   - Broadcasts updates via Durable Object

2. **Durable Object**
   - Manages WebSocket connections
   - Handles broadcast messaging
   - Maintains connection state

3. **Frontend (src/static/index.html)**
   - Simple, accessible UI
   - Real-time status updates
   - Error handling and retries

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.