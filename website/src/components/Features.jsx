import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FEATS = [
  { icon:'🔍', title:'Smart Ride Search',      desc:'Filter by AC, brand, max price, departure time, or female-only rides across Pakistan.',     color:'#3b82f6' },
  { icon:'📍', title:'Segment Booking',        desc:'Board and exit at custom stops — not just start to end. Perfect for intercity commuters.',   color:'#8b5cf6' },
  { icon:'⭐', title:'Ratings & Reviews',      desc:'Rate drivers after every ride. Build trust with honest, verified community reviews.',         color:'#f59e0b' },
  { icon:'🚨', title:'SOS Emergency',          desc:'One tap to call Rescue 1122, Police 15, Edhi 115 — safety always one button away.',          color:'#ef4444' },
  { icon:'🔔', title:'Schedule Alerts',        desc:'Set a route alert and get notified instantly when a matching driver posts a ride.',           color:'#06b6d4' },
  { icon:'💰', title:'Driver Earnings',        desc:'Full earnings dashboard by ride, week, and month. Turn commutes into consistent income.',     color:'#10b981' },
  { icon:'🪪', title:'CNIC Verification',      desc:'Verified users get a trust badge — identity documents reviewed by our safety team.',          color:'#1a73e8' },
  { icon:'🚗', title:'Vehicle Management',     desc:'Register multiple vehicles with photos, brand, model, and AC status. Switch anytime.',        color:'#f97316' },
  { icon:'🌐', title:'Push Notifications',     desc:'Real-time Firebase alerts for bookings, cancellations, ride updates and more.',              color:'#6366f1' },
]

export default function Features() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.feat-header', { opacity:0, y:30 }, {
        opacity:1, y:0, duration:0.7,
        scrollTrigger: { trigger:'.feat-header', start:'top 85%' },
      })
      gsap.fromTo('.feat-card', { opacity:0, y:50, scale:0.94 }, {
        opacity:1, y:0, scale:1, duration:0.65, stagger:0.08,
        ease:'power3.out',
        scrollTrigger: { trigger:'.feat-grid', start:'top 82%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const s = styles
  return (
    <section ref={sectionRef} id="features" style={s.section}>
      <div style={s.inner}>
        <div className="feat-header" style={{ ...s.header, opacity:0 }}>
          <div style={s.tag}>EVERYTHING YOU NEED</div>
          <h2 style={s.title}>Powerful Features</h2>
          <p style={s.sub}>Built specifically for Pakistani roads, routes, and riders.</p>
        </div>
        <div className="feat-grid" style={s.grid}>
          {FEATS.map((f) => (
            <div key={f.title} className="feat-card" style={{ ...s.card, opacity:0 }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-8px)'
                e.currentTarget.style.borderColor = f.color + '50'
                e.currentTarget.style.boxShadow = `0 20px 40px ${f.color}18`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ ...s.iconBox, background: f.color + '22', border: `1px solid ${f.color}30` }}>
                <span style={s.iconText}>{f.icon}</span>
              </div>
              <h3 style={s.cardTitle}>{f.title}</h3>
              <p style={s.cardDesc}>{f.desc}</p>
              <div style={{ ...s.accent, background: f.color }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const styles = {
  section: {
    padding:'110px 48px',
    background:'linear-gradient(160deg,#0d1b4b 0%,#1a2c6b 60%,#0d1b4b 100%)',
    position:'relative', overflow:'hidden',
  },
  inner: { maxWidth:1200, margin:'0 auto' },
  header: { textAlign:'center', marginBottom:64 },
  tag: {
    display:'inline-block',
    background:'rgba(26,115,232,0.2)', color:'#93c5fd',
    padding:'6px 18px', borderRadius:50, fontSize:12, fontWeight:800,
    letterSpacing:'0.7px', marginBottom:16, border:'1px solid rgba(26,115,232,0.3)',
  },
  title: { fontSize:'clamp(28px,3.5vw,44px)', fontWeight:900, color:'#fff', marginBottom:14 },
  sub: { fontSize:17, color:'rgba(255,255,255,0.45)', maxWidth:500, margin:'0 auto', lineHeight:1.7 },
  grid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 },
  card: {
    background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:24, padding:'28px 26px',
    transition:'all .3s cubic-bezier(0.4,0,0.2,1)',
    position:'relative', overflow:'hidden',
    cursor:'default',
  },
  iconBox: {
    width:54, height:54, borderRadius:16,
    display:'flex', alignItems:'center', justifyContent:'center',
    marginBottom:18,
  },
  iconText: { fontSize:26 },
  cardTitle: { fontSize:17, fontWeight:800, color:'#fff', marginBottom:8 },
  cardDesc: { fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7 },
  accent: { position:'absolute', bottom:0, left:0, right:0, height:2, opacity:0.4 },
}
