import { getHospitalState } from '../src/server/store.ts';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const state = getHospitalState();
  const activeEmergencies = state.emergencyRequests.filter((e) => e.status !== 'Completed').length;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(
    JSON.stringify({
      status: 'ok',
      service: 'SmartCare Hospital IoT & Patient Assistance Backend',
      platform: 'Vercel Serverless Function',
      timestamp: new Date().toISOString(),
      activeEmergencies,
    })
  );
}
