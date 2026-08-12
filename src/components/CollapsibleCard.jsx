import React, { useState } from 'react';

// Generic tap-to-expand card. Shows a compact one-line summary always;
// full detail (children) only renders when expanded, saving space for
// things you only need to check occasionally, not stare at constantly.
export default function CollapsibleCard({ title, accent, summary, summaryColor, children, defaultExpanded = false }) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <div style={{
      background:'var(--s1)', border:'1px solid var(--bd)',
      borderTop: accent ? '2px solid '+accent : '1px solid var(--bd)',
      borderRadius:8, overflow:'hidden', display:'flex', flexDirection:'column',
      minHeight:0, flex: open ? 1 : '0 0 auto',
    }}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
        padding:'8px 10px', background:'none', border:'none', cursor:'pointer', textAlign:'left', flexShrink:0,
      }}>
        <span style={{ fontSize:10, color:'var(--mu)', letterSpacing:.5, textTransform:'uppercase', fontWeight:700 }}>{title}</span>
        <span style={{ fontSize:9, color:'var(--mu)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {!open && summary && (
        <div style={{ padding:'0 10px 10px', fontSize:12, fontWeight:700, fontFamily:'monospace', color: summaryColor || 'var(--tx)' }}>
          {summary}
        </div>
      )}
      {open && (
        <div style={{ flex:1, minHeight:0, overflow:'auto', padding:'0 10px 10px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
