import { execFileSync } from 'node:child_process';

export interface GpuTelemetrySnapshot {
  name: string;
  powerDrawWatts: number | null;
  temperatureCelsius: number | null;
  utilizationPercent: number | null;
  vramUsedMiB: number | null;
}

function parseNumber(value: string): number | null {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized === 'N/A') {
    return null;
  }

  const parsed = Number(normalized.replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value: number | null, suffix: string): string {
  return value === null ? 'Unavailable' : `${value} ${suffix}`;
}

export function formatGpuTelemetry(snapshot: GpuTelemetrySnapshot | null): string {
  if (!snapshot) {
    return 'GPU telemetry unavailable';
  }

  return [
    'GPU',
    '----------------------------',
    `GPU: ${snapshot.name}`,
    `Utilization: ${formatValue(snapshot.utilizationPercent, '%')}`,
    `VRAM: ${formatValue(snapshot.vramUsedMiB, 'MiB')}`,
    `Temperature: ${formatValue(snapshot.temperatureCelsius, '°C')}`,
    `Power: ${formatValue(snapshot.powerDrawWatts, 'W')}`,
  ].join('\n');
}

export function collectGpuTelemetry(): GpuTelemetrySnapshot | null {
  try {
    const output = execFileSync(
      'nvidia-smi',
      [
        '--query-gpu=name,utilization.gpu,memory.used,temperature.gpu,power.draw',
        '--format=csv,noheader,nounits',
      ],
      { encoding: 'utf8', stdio: 'pipe' },
    ).trim();

    if (!output) {
      return null;
    }

    const [line] = output.split(/\r?\n/);
    if (!line) {
      return null;
    }

    const [name, utilization, vram, temperature, power] = line
      .split(',')
      .map((entry: string) => entry.trim());

    if (!name) {
      return null;
    }

    return {
      name,
      powerDrawWatts: power ? parseNumber(power) : null,
      temperatureCelsius: temperature ? parseNumber(temperature) : null,
      utilizationPercent: utilization ? parseNumber(utilization) : null,
      vramUsedMiB: vram ? parseNumber(vram) : null,
    };
  } catch {
    return null;
  }
}
