// lib/monitoring.ts
export function logTavusEvent(event: string, data: any, error?: any) {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    data,
    error: error?.message,
    stack: error?.stack
  };
  
  console.log('Tavus Event:', JSON.stringify(logData, null, 2));
  
  // Send to your monitoring service (e.g., Sentry, LogRocket)
  // sentry.captureMessage(`Tavus: ${event}`, logData);
}