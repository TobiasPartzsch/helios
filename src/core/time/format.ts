/**
 * Formats a fractional hour (0-24) into a HH:MM:SS string.
 */
export function formatHours(hours: number): string {
    const totalSeconds = Math.round(hours * 3600);
    const hh = Math.floor(totalSeconds / 3600) % 24;
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

/**
 * Formats a Date object into a UTC ISO-like YYYY.MM.DD HH:MM:SS string.
 */
export function formatUtcIso(date: Date): string {
    const y = date.getUTCFullYear();
    const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const d = date.getUTCDate().toString().padStart(2, '0');
    const hh = date.getUTCHours().toString().padStart(2, '0');
    const mm = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');

    return `${y}.${m}.${d} ${hh}:${mm}:${ss}`;
}

/**
 * Formats a fractional hour into an Equation of Time string: "+MM:SS" or "-MM:SS"
 */
export function formatEoT(hours: number): string {
    const totalSeconds = Math.round(hours * 3600);
    const sign = totalSeconds >= 0 ? "+" : "-";
    const absSeconds = Math.abs(totalSeconds);

    const mm = Math.floor(absSeconds / 60);
    const ss = absSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${sign}${pad(mm)}:${pad(ss)}`;
}