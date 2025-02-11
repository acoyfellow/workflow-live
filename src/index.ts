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
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.env = env;
  }

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

    const { id, message } = await request.json() as { id: string, message: string };
    this.sockets.forEach(ws =>
      ws.readyState === WebSocket.OPEN &&
      ws.send(JSON.stringify({ id, message, time: new Date().toISOString() }))
    );
    return new Response('OK');
  }
}

// Simple workflow with logging
export class WorkFlowLive extends WorkflowEntrypoint<Env> {
  private stub = this.env.WEBSOCKET_DO.get(
    this.env.WEBSOCKET_DO.idFromName('broadcast')
  );
  private q = Promise.resolve();

  async run(event: WorkflowEvent<{}>, step: WorkflowStep) {
    const log = (message: string) => this.q = this.q.then(async () => {
      await this.stub.fetch('http://internal/', {
        method: 'POST',
        body: JSON.stringify({
          id: event.instanceId,
          message
        })
      });
    });

    try {
      await log('Starting workflow...');
      await step.sleep("sleep for 1 second", "1 second");
      await step.do('step1', async () => { await log('Processing step 1...'); return true; });
      await step.sleep("sleep for 1 second", "2 second");
      await step.do('step2', async () => { await log('Processing step 2...'); return true; });
      await step.sleep("sleep for 1 second", "3 second");
      await step.do('step3', async () => { await log('Processing step 3...'); return true; });
      await step.sleep("sleep for 1 second", "4 second");
      await step.do('step4', async () => {
        await log('Processing step 4...');
        if (Math.random() > 0.75) throw new Error('Random failure!');
        return true;
      });
      await step.sleep("sleep for 1 second", "1 second");
      await log('Workflow complete!');
      return { success: true };
    } catch (error: any) {
      console.error(error);
      await log(`Workflow failed: ${error.message}`);
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
      return env.WEBSOCKET_DO.get(id).fetch(req);
    }
    if (url.pathname === '/api/workflow') {
      const { id } = await env.WORKFLOW_LIVE.create({});
      return Response.json({ id });
    }
    if (url.pathname.startsWith('/api/workflow/')) {
      console.log('api/workflow/', url.pathname.split('/').pop());
      const id = url.pathname.split('/').pop();
      const workflow = await env.WORKFLOW_LIVE.get(id);
      return Response.json({ id, status: await workflow.status() });
    }
    return new Response('Not found', { status: 404 });
  }
};