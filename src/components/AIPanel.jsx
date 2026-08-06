import React from 'react';

function toBullets(text) {
  if (!text) return [];
  if (text.includes('\n')) return text.split('\n').map(l => l.trim()).filter(Boolean);
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 3);
}

export default function AIPanel({ scrip }) {
  const narrative = scrip?.narrative;
  const bullets = toBullets(narrative);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
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
