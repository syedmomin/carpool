import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function CTA() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start:'top 80%' }
      })
      tl.fromTo('.cta-tag',   { opacity:0, y:20 },           { opacity:1, y:0, duration:0.5 })
        .fromTo('.cta-title', { opacity:0, y:30 },           { opacity:1, y:0, duration:0.7 }, '-=0.2')
        .fromTo('.cta-sub',   { opacity:0, y:20 },           { opacity:1, y:0, duration:0.6 }, '-=0.4')
        .fromTo('.cta-btn',   { opacity:0, y:20, scale:0.9 },{ opacity:1, y:0, scale:1, duration:0.5, stagger:0.12 }, '-=0.3')

      // Blob parallax
      gsap.to('.cta-blob-1', { y:-60, x:30, scrollTrigger: { trigger:sectionRef.current, start:'top bottom', end:'bottom top', scrub:1.5 } })
      gsap.to('.cta-blob-2', { y:-40, x:-20, scrollTrigger: { trigger:sectionRef.current, start:'top bottom', end:'bottom top', scrub:2 } })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const s = styles
  return (
    <section ref={sectionRef} id="download" style={s.section}>
      <div className="cta-blob-1" style={s.blob1} />
      <div className="cta-blob-2" style={s.blob2} />
      <div style={s.inner}>
        <div className="cta-tag" style={{ ...s.tag, opacity:0 }}>FREE TO DOWNLOAD</div>
        <h2 className="cta-title" style={{ ...s.title, opacity:0 }}>Ready to ChalParo?</h2>
        <p className="cta-sub" style={{ ...s.sub, opacity:0 }}>
          Join thousands of Pakistanis saving time and money on every journey. It's free, fast, and built for you.
        </p>
        <div style={s.btns}>
          {[
            { icon:'🍎', top:'Download on the', main:'App Store' },
            { icon:'▶️', top:'Get it on',        main:'Google Play' },
          ].map(b => (
            <a key={b.main} href="#" className="cta-btn" style={{ ...s.storeBtn, opacity:0 }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.18)'; e.currentTarget.style.transform='translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)';  e.currentTarget.style.transform='translateY(0)' }}
            >
              <span style={{ fontSize:30 }}>{b.icon}</span>
              <div>
                <div style={s.storeTop}>{b.top}</div>
                <div style={s.storeMain}>{b.main}</div>
              </div>
            </a>
          ))}
        </div>
        <p className="cta-btn" style={{ ...s.note, opacity:0 }}>
          🇵🇰 Made in Pakistan — چل پاڑو
        </p>
      </div>
    </section>
  )
}

const styles = {
  section: {
    padding:'120px 48px',
    background:'linear-gradient(145deg,#0d1b4b 0%,#1a2c6b 60%,#1557b0 100%)',
    textAlign:'center', position:'relative', overflow:'hidden',
  },
  blob1: {
    position:'absolute', width:500, height:500, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(26,115,232,0.2),transparent 70%)',
    top:-150, left:-150, pointerEvents:'none',
  },
  blob2: {
    position:'absolute', width:350, height:350, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(255,255,255,0.06),transparent 70%)',
    bottom:-100, right:-80, pointerEvents:'none',
  },
  inner: { maxWidth:700, margin:'0 auto', position:'relative', zIndex:1 },
  tag: {
    display:'inline-block',
    background:'rgba(26,115,232,0.25)', color:'#93c5fd',
    padding:'6px 18px', borderRadius:50, fontSize:12, fontWeight:800,
    letterSpacing:'0.7px', marginBottom:20, border:'1px solid rgba(26,115,232,0.35)',
  },
  title: { fontSize:'clamp(32px,4vw,52px)', fontWeight:900, color:'#fff', marginBottom:16, lineHeight:1.15 },
  sub: { fontSize:18, color:'rgba(255,255,255,0.6)', marginBottom:44, lineHeight:1.7 },
  btns: { display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', marginBottom:28 },
  storeBtn: {
    display:'flex', alignItems:'center', gap:14,
    background:'rgba(255,255,255,0.1)', color:'#fff',
    padding:'16px 28px', borderRadius:18, textDecoration:'none',
    border:'1px solid rgba(255,255,255,0.2)', transition:'all .25s ease',
    minWidth:180,
  },
  storeTop: { fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:2 },
  storeMain: { fontSize:18, fontWeight:800 },
  note: { fontSize:14, color:'rgba(255,255,255,0.35)' },
}
