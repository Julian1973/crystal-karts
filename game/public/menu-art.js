// Course previews use the actual route control points, not invented track art.
export function coursePreview(track){
 const xs=track.points.map(p=>p[0]),zs=track.points.map(p=>p[2]);
 const minX=Math.min(...xs),minZ=Math.min(...zs),span=Math.max(Math.max(...xs)-minX,Math.max(...zs)-minZ,1);
 const xy=track.points.map(p=>[24+(p[0]-minX)*112/span,20+(p[2]-minZ)*112/span]);
 const path=xy.map(p=>p.join(',')).join(' ');
 return `<svg viewBox="0 0 160 152" aria-hidden="true" focusable="false"><polyline points="${path} ${xy[0].join(',')}" fill="none" stroke="#061d37" stroke-width="17" stroke-linejoin="round"/><polyline points="${path} ${xy[0].join(',')}" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/><circle cx="${xy[0][0]}" cy="${xy[0][1]}" r="6" fill="white"/></svg>`;
}
