// Absolute checkpoint distances keep each racer independent of overtakes and recovery.
export function updateProgress(r, previousS, length) {
 r.completedLaps ??= 0;
 r.nextCheckpoint ??= 1;
 if (r.s <= previousS) return false;
 const before = r.completedLaps;
 while (r.nextCheckpoint <= 12 && r.s >= r.nextCheckpoint * length / 4) {
  r.completedLaps = Math.floor(r.nextCheckpoint / 4);
  r.nextCheckpoint++;
 }
 return r.completedLaps > before;
}
export const displayedLap = r => Math.min(3, (r.completedLaps || 0) + 1);
