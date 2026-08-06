import React from 'react';

// Split narrative into readable bullet points. Handles both plain sentences
// and the rule-based fallback narrative's own line-break structure.
function toBullets(text) {
  if (!text) return [];
  // If the narrative already has line breaks (rule-based fallback), use those
  if (text.includes('\n')) {
    return text.split('\n').map(l => l.trim()).filter(Boolean);
  }
  // Otherwise split on sentence boundaries
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 3);
}

export default function AIPanel({ scrip }) {
  const narrative = scrip?.narrative;
  const bullets = toBullets(narrative);

  return (
    <div style={{ height:'100%', minHeight:0, background:'var(--s1)', border:'1px solid var(--bd)', borderTop:'2px solid #a855f7',
      borderRadius:10, padding:'12px 14px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ fontSize:9, color:'#c084fc', letterSpacing:1.2, textTransform:'uppercase', fontWeight:700, marginBottom:10, flexShrink:0 }}>
        AI Analysis
      </div>

      {!narrative && (
        <div style={{ fontSize:11, color:'var(--mu)', flex:1, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
          No analysis yet — runs with the next cron cycle
        </div>
      )}

      {bullets.length > 0 && (
        <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display:'flex', gap:8, fontSize:11, lineHeight:1.5, color:'var(--tx)' }}>
              <span style={{ flexShrink:0, width:4, height:4, borderRadius:'50%', background:'#a855f7', marginTop:6 }} />
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
