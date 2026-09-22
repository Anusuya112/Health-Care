import {
  getHospitalState,
  processEmergencyRequest,
  resetHospitalState,
  updateEmergencyStatus,
} from '../src/server/store.ts';

async function getJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
}

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const url = (req.url || '').split('?')[0];
  const state = getHospitalState();

  // Route: /api/health
  if (url === '/api/health' || url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        status: 'ok',
        service: 'SmartCare Hospital Backend',
        platform: 'Vercel Serverless Function',
        timestamp: new Date().toISOString(),
      })
    );
  }

  // Route: /api/data
  if (url === '/api/data' || url === '/data') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(state));
  }

  // Route: /api/reset
  if (url === '/api/reset' || url === '/reset') {
    resetHospitalState();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, message: 'Database reset to initial demo state' }));
  }

  // Route: /api/emergency
  if (url === '/api/emergency' || url === '/emergency') {
    if (req.method === 'GET') {
      const activeEmergencies = state.emergencyRequests.filter((e) => e.status !== 'Completed');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          status: 'online',
          service: 'SmartCare Hospital Bedside IoT ESP8266 Emergency Gateway',
          platform: 'Vercel Serverless Function',
          endpoint: '/api/emergency',
          supported_methods: ['POST', 'GET', 'OPTIONS'],
          active_emergencies_count: activeEmergencies.length,
          instructions: {
            description: 'Trigger emergency alert via HTTP POST',
            sample_curl: `curl -X POST https://${req.headers?.host || 'smart-care-hospital-taupe.vercel.app'}/api/emergency -H "Content-Type: application/json" -d '{"device_id":"ESP8266-BED-A204","bed_id":"A-204","patient_id":"P102","request_type":"IOT_ESP8266"}'`,
          },
        })
      );
    }

    if (req.method === 'POST') {
      const body = await getJsonBody(req);
      const { emergency } = processEmergencyRequest(body);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, emergency, message: 'Emergency alert dispatched to nurses' }));
    }
  }

  // Route: /api/emergency/status
  if (url.includes('/emergency/status')) {
    const body = await getJsonBody(req);
    const result = updateEmergencyStatus(body.request_id, body.status, body.nurse_name, body.notes);
    res.statusCode = result.success ? 200 : 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  }

  // Default fallback for any other api endpoint
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(
    JSON.stringify({
      status: 'online',
      message: `SmartCare Hospital API endpoint received: ${url}`,
      method: req.method,
      timestamp: new Date().toISOString(),
    })
  );
}
