import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const CARDS = [
  { icon:'🪪', title:'CNIC Verified',      desc:'Every driver has submitted identity documents reviewed by our safety team.',               color:'#1a73e8' },
  { icon:'🚨', title:'SOS Button',         desc:'One tap to call Rescue 1122, Police 15, Edhi 115, or Motorway Police 130.',              color:'#ef4444' },
  { icon:'⭐', title:'Community Ratings',  desc:'Both drivers and passengers are rated after every ride. Low-rated users get flagged.',    color:'#f59e0b' },
  { icon:'🔐', title:'Encrypted Auth',     desc:'JWT tokens with phone verification protect your account at all times.',                  color:'#10b981' },
]

export default function Safety() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.safety-header', { opacity:0, y:30 }, {
        opacity:1, y:0, duration:0.7,
        scrollTrigger: { trigger:'.safety-header', start:'top 85%' },
      })
      gsap.fromTo('.safety-card', { opacity:0, y:50, scale:0.95 }, {
        opacity:1, y:0, scale:1, duration:0.65, stagger:0.12, ease:'power3.out',
        scrollTrigger: { trigger:'.safety-grid', start:'top 80%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const s = styles
  return (
    <section ref={sectionRef} id="safety" style={s.section}>
      <div style={s.inner}>
        <div className="safety-header" style={{ ...s.header, opacity:0 }}>
          <div style={s.tag}>YOUR SAFETY FIRST</div>
          <h2 style={s.title}>Built for Pakistan's Roads</h2>
          <p style={s.sub}>Every feature is designed to make your journey secure and trustworthy.</p>
        </div>
        <div className="safety-grid" style={s.grid}>
          {CARDS.map(card => (
            <div key={card.title} className="safety-card" style={{ ...s.card, opacity:0 }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow=`0 20px 40px ${card.color}18` }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <div style={{ ...s.iconWrap, background: card.color + '15', border:`1.5px solid ${card.color}25` }}>
                <span style={{ fontSize:34 }}>{card.icon}</span>
              </div>
              <h4 style={s.cardTitle}>{card.title}</h4>
              <p style={s.cardDesc}>{card.desc}</p>
              <div style={{ ...s.bar, background: card.color }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const styles = {
  section: { padding:'110px 48px', background:'#fff' },
  inner: { maxWidth:1000, margin:'0 auto' },
  header: { textAlign:'center', marginBottom:64 },
  tag: {
    display:'inline-block', background:'#e8f0fe', color:'#1a73e8',
    padding:'6px 18px', borderRadius:50, fontSize:12, fontWeight:800,
    letterSpacing:'0.7px', marginBottom:14,
  },
  title: { fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:'#0d1b4b', marginBottom:12 },
  sub: { fontSize:16, color:'#6b7280', maxWidth:480, margin:'0 auto', lineHeight:1.7 },
  grid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 },
  card: {
    background:'#fff', borderRadius:22, padding:'32px 24px', textAlign:'center',
    boxShadow:'0 2px 12px rgba(0,0,0,0.06)', transition:'all .3s ease',
    position:'relative', overflow:'hidden', cursor:'default',
  },
  iconWrap: { width:72, height:72, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' },
  cardTitle: { fontSize:16, fontWeight:800, color:'#0d1b4b', marginBottom:10 },
  cardDesc: { fontSize:13, color:'#6b7280', lineHeight:1.65 },
  bar: { position:'absolute', bottom:0, left:0, right:0, height:3, opacity:0.6 },
}
