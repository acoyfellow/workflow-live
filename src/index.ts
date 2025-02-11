import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
  WorkflowNamespace
} from "cloudflare:workers";

import {
  DurableObject,
  DurableObjectNamespace,
  Request
} from '@cloudflare/workers-types';

declare global {
  const WebSocketPair: any;
}

interface Env {
  WEBSOCKET_DO: DurableObjectNamespace;
  WORKFLOW_LIVE: WorkflowNamespace;
}

// Simple WebSocket broadcaster
export class WebSocketDO implements DurableObject {
  sockets = new Set<WebSocket>();

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      this.sockets.add(server);
      server.accept();
      server.addEventListener('close', () => this.sockets.delete(server));
      return new Response(null, {
        status: 101,
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade'
        },
        webSocket: client
      });
    }

    const message = await request.text();
    this.sockets.forEach(ws => ws.readyState === WebSocket.OPEN &&
      ws.send(JSON.stringify({ message, time: new Date().toISOString() })));
    return new Response('OK');
  }
}

// Simple workflow with logging
export class WorkFlowLive extends WorkflowEntrypoint<Env> {
  async run(event: WorkflowEvent<{}>, step: WorkflowStep) {
    const log = async (msg: string) => {
      const do_id = this.env.WEBSOCKET_DO.idFromName('broadcast');
      await this.env.WEBSOCKET_DO.get(do_id).fetch('http://internal/', {
        method: 'POST',
        body: msg
      });
    };

    try {
      await log('Starting workflow...');
      await step.do('step1', async () => { await log('Processing step 1...'); return true; });
      await step.do('step2', async () => { await log('Processing step 2...'); return true; });
      await step.do('step3', async () => { await log('Processing step 3...'); return true; });
      await step.do('step4', async () => {
        await log('Processing step 4...');
        if (Math.random() > 0.5) throw new Error('Random failure');
        return true;
      });
      await log('Workflow complete!');
      return { success: true };
    } catch (error: any) {
      console.error(error);
      await log(`Failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

// Simple request router
export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const id = env.WEBSOCKET_DO.idFromName('broadcast');
      console.log('/ws', id);
      return env.WEBSOCKET_DO.get(id).fetch(req);
    }
    if (url.pathname === '/api/workflow') {
      return Response.json({ id: (await env.WORKFLOW_LIVE.create({})).id });
    }
    return new Response('Not found', { status: 404 });
  }
};