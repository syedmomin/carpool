import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const PASSENGER = [
  'Search rides by city & date',
  'Smart filters — AC, price, brand',
  'Instant seat booking',
  'Segment boarding/exit',
  'Rate your driver post-ride',
  'SOS emergency button',
]
const DRIVER = [
  'Post rides with custom pricing',
  'Manage your vehicle fleet',
  'View all passenger bookings',
  'Start rides on scheduled day',
  'Full earnings dashboard',
  'Build your driver reputation',
]

export default function DualRole() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.dual-header', { opacity:0, y:30 }, {
        opacity:1, y:0, duration:0.7,
        scrollTrigger: { trigger:'.dual-header', start:'top 85%' },
      })
      gsap.fromTo('.card-passenger', { opacity:0, x:-80 }, {
        opacity:1, x:0, duration:0.9, ease:'power3.out',
        scrollTrigger: { trigger:'.dual-grid', start:'top 78%' },
      })
      gsap.fromTo('.card-driver', { opacity:0, x:80 }, {
        opacity:1, x:0, duration:0.9, ease:'power3.out',
        scrollTrigger: { trigger:'.dual-grid', start:'top 78%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const s = styles
  return (
    <section ref={sectionRef} style={s.section}>
      <div style={s.inner}>
        <div className="dual-header" style={{ ...s.header, opacity:0 }}>
          <div style={s.tag}>FOR EVERYONE</div>
          <h2 style={s.title}>Passenger or Driver?</h2>
          <p style={s.sub}>ChalParo works beautifully for both sides of the journey.</p>
        </div>
        <div className="dual-grid" style={s.grid}>
          {/* Passenger */}
          <div className="card-passenger" style={{ ...s.card, ...s.passengerCard, opacity:0 }}>
            <div style={s.bg} />
            <div style={{ ...s.badge, background:'#1a73e8', color:'#fff' }}>PASSENGER</div>
            <h3 style={{ ...s.cardTitle, color:'#0d1b4b' }}>Find Your Ride</h3>
            <p style={{ ...s.cardDesc, color:'#3b5a9a' }}>Stop overpaying for solo travel. Share rides with verified drivers heading your way.</p>
            <ul style={s.list}>
              {PASSENGER.map(item => (
                <li key={item} style={s.listItem}>
                  <span style={{ ...s.check, background:'#1a73e8', color:'#fff' }}>✓</span>
                  <span style={{ color:'#0d1b4b' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Driver */}
          <div className="card-driver" style={{ ...s.card, ...s.driverCard, opacity:0 }}>
            <div style={{ ...s.bg, background:'rgba(255,255,255,0.05)' }} />
            <div style={{ ...s.badge, background:'rgba(26,115,232,0.3)', color:'#93c5fd' }}>DRIVER</div>
            <h3 style={{ ...s.cardTitle, color:'#fff' }}>Earn on Every Trip</h3>
            <p style={{ ...s.cardDesc, color:'rgba(255,255,255,0.55)' }}>Turn your regular commute into income. Post a ride, fill empty seats, get paid.</p>
            <ul style={s.list}>
              {DRIVER.map(item => (
                <li key={item} style={s.listItem}>
                  <span style={{ ...s.check, background:'rgba(26,115,232,0.35)', color:'#93c5fd' }}>✓</span>
                  <span style={{ color:'rgba(255,255,255,0.8)' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const styles = {
  section: { padding:'110px 48px', background:'#fff' },
  inner: { maxWidth:1100, margin:'0 auto' },
  header: { textAlign:'center', marginBottom:60 },
  tag: {
    display:'inline-block', background:'#e8f0fe', color:'#1a73e8',
    padding:'6px 18px', borderRadius:50, fontSize:12, fontWeight:800,
    letterSpacing:'0.7px', marginBottom:14,
  },
  title: { fontSize:'clamp(28px,3.5vw,44px)', fontWeight:900, color:'#0d1b4b', marginBottom:12 },
  sub: { fontSize:17, color:'#6b7280', maxWidth:500, margin:'0 auto', lineHeight:1.7 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 },
  card: { borderRadius:28, padding:'40px 36px', position:'relative', overflow:'hidden' },
  passengerCard: { background:'linear-gradient(145deg,#e8f0fe,#dbeafe)' },
  driverCard: { background:'linear-gradient(145deg,#0d1b4b,#1a2c6b)' },
  bg: { position:'absolute', width:220, height:220, borderRadius:'50%', bottom:-70, right:-50, background:'rgba(26,115,232,0.1)' },
  badge: { display:'inline-block', padding:'5px 16px', borderRadius:50, fontSize:12, fontWeight:800, letterSpacing:'0.6px', marginBottom:18 },
  cardTitle: { fontSize:26, fontWeight:900, marginBottom:10 },
  cardDesc: { fontSize:15, lineHeight:1.7, marginBottom:26 },
  list: { listStyle:'none', display:'flex', flexDirection:'column', gap:12 },
  listItem: { display:'flex', alignItems:'center', gap:12, fontSize:14, fontWeight:600 },
  check: { width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 },
}
