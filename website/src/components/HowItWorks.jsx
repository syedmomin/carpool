import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { num:'01', icon:'👤', title:'Create Account', desc:'Sign up with your phone number in 60 seconds. Verify with CNIC to get a trusted badge.' },
  { num:'02', icon:'🔍', title:'Find or Post a Ride', desc:'Search by city & date as a passenger, or post your own ride as a driver and set your price.' },
  { num:'03', icon:'🚗', title:'Travel Together', desc:'Book your seat, connect with your driver, enjoy the ride — then rate your experience.' },
  { num:'04', icon:'💰', title:'Save or Earn', desc:'Passengers save up to 60% vs solo travel. Drivers turn daily commutes into income.' },
]

export default function HowItWorks() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hiw-tag', { opacity:0, y:20 }, {
        opacity:1, y:0, duration:0.6,
        scrollTrigger: { trigger:'.hiw-tag', start:'top 85%' },
      })
      gsap.fromTo('.hiw-title', { opacity:0, y:30 }, {
        opacity:1, y:0, duration:0.7,
        scrollTrigger: { trigger:'.hiw-title', start:'top 85%' },
      })
      gsap.fromTo('.hiw-card', { opacity:0, y:60, scale:0.95 }, {
        opacity:1, y:0, scale:1, duration:0.7, stagger:0.15,
        ease:'power3.out',
        scrollTrigger: { trigger:'.hiw-cards', start:'top 80%' },
      })
      // Line draw animation
      gsap.fromTo('.hiw-line', { scaleX:0 }, {
        scaleX:1, duration:1.2, ease:'power2.inOut',
        scrollTrigger: { trigger:'.hiw-cards', start:'top 75%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const s = styles
  return (
    <section ref={sectionRef} id="how" style={s.section}>
      <div style={s.inner}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <div className="hiw-tag" style={{ ...s.tag, opacity:0 }}>HOW IT WORKS</div>
          <h2 className="hiw-title" style={{ ...s.title, opacity:0 }}>Simple as 1, 2, 3, 4</h2>
        </div>
        <div className="hiw-cards" style={s.grid}>
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ position:'relative' }}>
              <div className="hiw-card" style={{ ...s.card, opacity:0 }}>
                <div style={s.numRow}>
                  <div style={s.num}>{step.num}</div>
                  <div style={s.iconBox}>{step.icon}</div>
                </div>
                <h3 style={s.cardTitle}>{step.title}</h3>
                <p style={s.cardDesc}>{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hiw-line" style={s.connector} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const styles = {
  section: { padding:'110px 48px', background:'#fff' },
  inner: { maxWidth:1100, margin:'0 auto' },
  tag: {
    display:'inline-block', background:'#e8f0fe', color:'#1a73e8',
    padding:'6px 18px', borderRadius:50, fontSize:12, fontWeight:800,
    letterSpacing:'0.7px', marginBottom:16,
  },
  title: { fontSize:'clamp(28px,3.5vw,44px)', fontWeight:900, color:'#0d1b4b', lineHeight:1.2 },
  grid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, position:'relative' },
  card: {
    background:'#f5f7ff', borderRadius:24, padding:'28px 24px',
    border:'2px solid transparent', transition:'all .3s',
    cursor:'default',
  },
  numRow: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 },
  num: { fontSize:13, fontWeight:900, color:'#1a73e8', letterSpacing:1 },
  iconBox: {
    width:48, height:48, borderRadius:14,
    background:'linear-gradient(135deg,#1a73e8,#1557b0)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:22, boxShadow:'0 6px 18px rgba(26,115,232,0.35)',
  },
  cardTitle: { fontSize:17, fontWeight:800, color:'#0d1b4b', marginBottom:10 },
  cardDesc: { fontSize:14, color:'#6b7280', lineHeight:1.7 },
  connector: {
    position:'absolute', top:52, right:-12, width:24, height:2,
    background:'linear-gradient(to right,#1a73e8,#e8f0fe)',
    transformOrigin:'left center', zIndex:2,
  },
}
