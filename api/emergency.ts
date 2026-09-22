import type { IncomingMessage, ServerResponse } from 'http';
import { getHospitalState, processEmergencyRequest, updateEmergencyStatus } from '../src/server/store.ts';

// Helper to parse JSON body from incoming stream if not already parsed
async function getJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer | string) => {
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

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
}

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const url = req.url || '';

  // Handle emergency status update if routed here (e.g. /api/emergency/status)
  if (url.includes('/status') && req.method === 'POST') {
    const body = await getJsonBody(req);
    const result = updateEmergencyStatus(
      body.request_id,
      body.status,
      body.nurse_name,
      body.notes
    );
    res.setHeader('Content-Type', 'application/json');
    if (!result.success) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ success: false, error: 'Emergency record not found' }));
    }
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, emergency: result.emergency }));
  }

  // Handle GET /api/emergency
  if (req.method === 'GET') {
    const state = getHospitalState();
    const activeEmergencies = state.emergencyRequests.filter((e) => e.status !== 'Completed');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify(
        {
          status: 'online',
          service: 'SmartCare Hospital - Bedside IoT ESP8266 Emergency Gateway',
          platform: 'Vercel Serverless Function & Edge Route',
          endpoint: '/api/emergency',
          supported_methods: ['POST', 'GET', 'OPTIONS'],
          active_emergencies_count: activeEmergencies.length,
          recent_emergencies: state.emergencyRequests.slice(0, 5),
          instructions: {
            description:
              'To trigger an emergency alert from your ESP8266, send an HTTP POST request with JSON payload.',
            endpoint_url: `https://${req.headers?.host || 'smart-care-hospital-taupe.vercel.app'}/api/emergency`,
            sample_curl_command: `curl -X POST https://${
              req.headers?.host || 'smart-care-hospital-taupe.vercel.app'
            }/api/emergency -H "Content-Type: application/json" -d '{"device_id":"ESP8266-BED-A204","bed_id":"A-204","patient_id":"P102","request_type":"IOT_ESP8266"}'`,
            expected_json_payload: {
              device_id: 'ESP8266-BED-A204',
              bed_id: 'A-204',
              patient_id: 'P102',
              request_type: 'IOT_ESP8266',
              notes: 'Bedside panic button pressed',
            },
          },
        },
        null,
        2
      )
    );
  }

  // Handle POST /api/emergency
  if (req.method === 'POST') {
    const body = await getJsonBody(req);
    const { device_id, patient_id, bed_id, request_type, notes } = body;

    const { emergency } = processEmergencyRequest({
      device_id,
      patient_id,
      bed_id,
      request_type,
      notes,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: true,
        request_id: emergency.request_id,
        patient_id: emergency.patient_id,
        patient_name: emergency.patient_name,
        bed_id: emergency.bed_id,
        ward: emergency.ward,
        status: emergency.status,
        timestamp: emergency.created_at,
        message: 'Emergency request registered. Nurse Station notified immediately.',
        device_id: emergency.device_id,
      })
    );
  }

  // Fallback for unsupported methods
  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ error: 'Method Not Allowed', allowed: ['GET', 'POST', 'OPTIONS'] }));
}
