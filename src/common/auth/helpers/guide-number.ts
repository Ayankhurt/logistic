export function generateGuideNumber(
  type: 'TRACKING' | 'PICKING',
  tenantId: string,
) {
  const d = new Date();
  const ymd = `${d.getFullYear().toString().slice(-2)}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${type === 'TRACKING' ? 'T' : 'P'}-${ymd}-${rand}-${tenantId.slice(0, 4).toUpperCase()}`;
}
