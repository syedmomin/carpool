import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const WORDS = ['Safe.', 'Affordable.', 'Smart.']

export default function Hero() {
  const sectionRef = useRef(null)
  const wordRef    = useRef(null)
  const wordIdx    = useRef(0)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered entrance timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo('.hero-badge',  { opacity: 0, y: 24 },        { opacity: 1, y: 0, duration: 0.6 })
        .fromTo('.hero-title-1',{ opacity: 0, y: 50 },        { opacity: 1, y: 0, duration: 0.8 }, '-=0.2')
        .fromTo('.hero-title-2',{ opacity: 0, y: 50 },        { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .fromTo('.hero-urdu',   { opacity: 0, x: -30 },       { opacity: 1, x: 0, duration: 0.7 }, '-=0.4')
        .fromTo('.hero-sub',    { opacity: 0, y: 20 },        { opacity: 1, y: 0, duration: 0.7 }, '-=0.3')
        .fromTo('.hero-btn',    { opacity: 0, y: 20, scale:.9},{ opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12 }, '-=0.3')
        .fromTo('.hero-stats',  { opacity: 0, y: 20 },        { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
        .fromTo('.phone-mock',  { opacity: 0, y: 80, rotation: 5 }, { opacity: 1, y: 0, rotation: 0, duration: 1.1, ease: 'power4.out' }, '-=1.0')

      // Parallax blobs on scroll
      gsap.to('.blob-1', { y: -140, x: 40, scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: 1.5 } })
      gsap.to('.blob-2', { y: -80,  x: -30, scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: 2 } })
      gsap.to('.blob-3', { y: -60,  scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: 1 } })

      // Phone parallax
      gsap.to('.phone-mock', { y: 80, scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: 1.2 } })

      // Rotating word animation
      const rotateWord = () => {
        wordIdx.current = (wordIdx.current + 1) % WORDS.length
        if (!wordRef.current) return
        gsap.to(wordRef.current, {
          opacity: 0, y: -20, duration: 0.3, ease: 'power2.in',
          onComplete: () => {
            if (wordRef.current) wordRef.current.textContent = WORDS[wordIdx.current]
            gsap.fromTo(wordRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
          }
        })
      }
      const interval = setInterval(rotateWord, 2200)
      return () => clearInterval(interval)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const s = styles
  return (
    <section ref={sectionRef} style={s.section}>
      {/* Blobs */}
      <div className="blob-1" style={s.blob1} />
      <div className="blob-2" style={s.blob2} />
      <div className="blob-3" style={s.blob3} />

      {/* Grid overlay */}
      <div style={s.gridOverlay} />

      <div style={s.inner}>
        {/* LEFT */}
        <div style={s.left}>
          <div className="hero-badge" style={{ ...s.badge, opacity: 0 }}>
            <span style={s.dot} />
            Pakistan ka #1 Carpooling App
          </div>

          <h1 style={s.h1}>
            <div className="hero-title-1" style={{ opacity: 0 }}>
              Saath Chalein,
            </div>
            <div className="hero-title-2" style={{ ...s.accentLine, opacity: 0 }}>
              Saath&nbsp;
              <span ref={wordRef} style={s.rotating}>{WORDS[0]}</span>
            </div>
          </h1>

          <p className="hero-urdu" style={{ ...s.urdu, opacity: 0 }}>
            چل پاڑو — ساتھ چلیں، ساتھ بچائیں
          </p>
          <p className="hero-sub" style={{ ...s.sub, opacity: 0 }}>
            Join thousands of Pakistanis sharing rides, saving money, and making every journey safer — from Karachi to Khyber.
          </p>

          <div style={s.btns}>
            <a href="#download" className="hero-btn" style={{ ...s.btnPrimary, opacity: 0 }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(26,115,232,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='0 8px 24px rgba(26,115,232,0.4)' }}
            >
              📱 Download Free
            </a>
            <a href="#how" className="hero-btn" style={{ ...s.btnSecondary, opacity: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.18)'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)';  e.currentTarget.style.transform='translateY(0)' }}
            >
              ▶ How It Works
            </a>
          </div>

          <div className="hero-stats" style={{ ...s.stats, opacity: 0 }}>
            {[['10K+','Rides Shared'],['25+','Cities'],['4.8 ★','Rating']].map(([val, lbl]) => (
              <div key={lbl} style={s.statItem}>
                <div style={s.statVal}>{val}</div>
                <div style={s.statLbl}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Phone mockup */}
        <div style={s.right}>
          <div className="phone-mock" style={{ ...s.phoneMock, opacity: 0 }}>
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

function PhoneMockup() {
  const s = ph
  return (
    <div style={s.phone}>
      <div style={s.notch} />
      <div style={s.screen}>
        {/* Status bar */}
        <div style={s.statusBar}>
          <span style={s.time}>9:41</span>
          <span style={s.icons}>●●● 🔋</span>
        </div>
        {/* App header */}
        <div style={s.appHeader}>
          <div style={s.appHeaderInner}>
            <div style={s.appLogo}>🚗</div>
            <div>
              <div style={s.greeting}>Good Morning, Ahmad! 👋</div>
              <div style={s.location}>📍 Lahore</div>
            </div>
          </div>
        </div>
        {/* Search card */}
        <div style={s.searchCard}>
          <div style={s.searchRow}>
            <div style={s.dotBlue} />
            <div style={s.searchCity}>Lahore</div>
          </div>
          <div style={s.dottedLine} />
          <div style={s.searchRow}>
            <div style={s.dotGreen} />
            <div style={s.searchCity}>Islamabad</div>
          </div>
          <div style={s.searchMeta}>
            <span style={s.metaChip}>📅 Today</span>
            <span style={s.metaChip}>👤 2 Seats</span>
          </div>
          <div style={s.searchBtn}>🔍 &nbsp;Search Rides</div>
        </div>
        {/* Ride card */}
        <div style={s.label}>3 rides found</div>
        <div style={s.rideCard}>
          <div style={s.rideTop}>
            <div>
              <div style={s.rideRoute}>Lahore → Islamabad</div>
              <div style={s.rideChips}>
                <span style={s.chip}>🕗 08:00</span>
                <span style={s.chip}>❄️ AC</span>
                <span style={s.chip}>Toyota</span>
              </div>
            </div>
            <div style={s.ridePrice}>Rs 1,200</div>
          </div>
          <div style={s.rideDriver}>
            <div style={s.driverAvatar}>AR</div>
            <div>
              <div style={s.driverName}>Ahmad Raza</div>
              <div style={s.driverStar}>★★★★★ 4.9</div>
            </div>
            <div style={s.bookBtn}>Book</div>
          </div>
        </div>
        {/* Tab bar */}
        <div style={s.tabBar}>
          {[['🏠','Home',true],['🔍','Search',false],['🧾','Bookings',false],['👤','Profile',false]].map(([icon,lbl,active])=>(
            <div key={lbl} style={s.tabItem}>
              <div style={active ? s.tabBubble : s.tabIcon}>{icon}</div>
              <div style={{ ...s.tabLabel, color: active ? '#1a73e8' : '#9ca3af', fontWeight: active ? 700 : 500 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ph = {
  phone: {
    width: 240, background: '#1a1a2e', borderRadius: 40,
    padding: '10px 10px 0', position: 'relative',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)',
  },
  notch: {
    width: 80, height: 22, background: '#1a1a2e', borderRadius: 11,
    margin: '0 auto 6px', position: 'relative', zIndex: 2,
  },
  screen: {
    background: '#f5f7ff', borderRadius: 30, overflow: 'hidden',
    paddingBottom: 10,
  },
  statusBar: { display:'flex', justifyContent:'space-between', padding:'8px 16px 0', fontSize: 10, fontWeight: 700 },
  time: { color: '#111' },
  icons: { color: '#111', fontSize: 9 },
  appHeader: { background: 'linear-gradient(135deg,#1a73e8,#1557b0)', padding: '14px 16px 20px' },
  appHeaderInner: { display:'flex', alignItems:'center', gap: 10 },
  appLogo: { width:32, height:32, background:'rgba(255,255,255,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 },
  greeting: { fontSize: 11, fontWeight: 800, color: '#fff' },
  location: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  searchCard: { background:'#fff', margin:'-10px 12px 10px', borderRadius:16, padding:14, boxShadow:'0 4px 16px rgba(0,0,0,0.1)' },
  searchRow: { display:'flex', alignItems:'center', gap:8, padding:'4px 0' },
  dotBlue: { width:8, height:8, borderRadius:'50%', background:'#1a73e8', flexShrink:0 },
  dotGreen: { width:8, height:8, borderRadius:'50%', background:'#22c55e', flexShrink:0 },
  dottedLine: { width:2, height:10, background:'#e5e7eb', marginLeft:3 },
  searchCity: { fontSize:13, fontWeight:700, color:'#111' },
  searchMeta: { display:'flex', gap:6, marginTop:8 },
  metaChip: { background:'#f5f7ff', padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600, color:'#6b7280' },
  searchBtn: { background:'linear-gradient(135deg,#1a73e8,#1557b0)', color:'#fff', textAlign:'center', padding:'8px', borderRadius:10, fontSize:12, fontWeight:700, marginTop:10 },
  label: { fontSize:10, fontWeight:700, color:'#6b7280', padding:'0 16px 6px' },
  rideCard: { background:'#fff', margin:'0 12px', borderRadius:14, padding:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  rideTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 },
  rideRoute: { fontSize:12, fontWeight:800, color:'#111', marginBottom:5 },
  rideChips: { display:'flex', gap:4 },
  chip: { background:'#f5f7ff', padding:'2px 6px', borderRadius:5, fontSize:9, fontWeight:600, color:'#6b7280' },
  ridePrice: { fontSize:14, fontWeight:900, color:'#1a73e8' },
  rideDriver: { display:'flex', alignItems:'center', gap:8 },
  driverAvatar: { width:26, height:26, borderRadius:8, background:'#e8f0fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#1a73e8' },
  driverName: { fontSize:10, fontWeight:700, color:'#111' },
  driverStar: { fontSize:9, color:'#f59e0b' },
  bookBtn: { marginLeft:'auto', background:'#1a73e8', color:'#fff', padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:700 },
  tabBar: { display:'flex', justifyContent:'space-around', background:'#fff', padding:'10px 6px 6px', borderTopLeftRadius:0, borderTopRightRadius:0, marginTop:10, boxShadow:'0 -2px 8px rgba(0,0,0,0.05)' },
  tabItem: { display:'flex', flexDirection:'column', alignItems:'center', gap:3 },
  tabBubble: { width:34, height:34, borderRadius:'50%', background:'#1a73e8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, marginTop:-20, boxShadow:'0 3px 10px rgba(26,115,232,0.45)' },
  tabIcon: { fontSize:16 },
  tabLabel: { fontSize:8 },
}

const styles = {
  section: {
    minHeight: '100vh', position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(145deg, #0d1b4b 0%, #1a2c6b 55%, #1557b0 100%)',
    display: 'flex', alignItems: 'center', padding: '120px 48px 80px',
  },
  blob1: {
    position:'absolute', width:600, height:600, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(26,115,232,0.25),transparent 70%)',
    top:-150, right:-100, filter:'blur(40px)', pointerEvents:'none',
  },
  blob2: {
    position:'absolute', width:400, height:400, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(255,255,255,0.06),transparent 70%)',
    bottom:-100, left:-80, filter:'blur(30px)', pointerEvents:'none',
  },
  blob3: {
    position:'absolute', width:280, height:280, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(26,115,232,0.15),transparent 70%)',
    top:'40%', left:'38%', filter:'blur(20px)', pointerEvents:'none',
  },
  gridOverlay: {
    position:'absolute', inset:0, pointerEvents:'none',
    backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),
                      linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,
    backgroundSize: '60px 60px',
  },
  inner: {
    maxWidth: 1200, width:'100%', margin:'0 auto',
    display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center',
    position:'relative', zIndex:1,
  },
  left: {},
  badge: {
    display:'inline-flex', alignItems:'center', gap:8,
    background:'rgba(26,115,232,0.2)', border:'1px solid rgba(26,115,232,0.35)',
    padding:'7px 18px', borderRadius:50, fontSize:13, fontWeight:700,
    color:'#93c5fd', marginBottom:24,
  },
  dot: { width:7, height:7, borderRadius:'50%', background:'#60a5fa', display:'inline-block', animation:'pulse 2s infinite' },
  h1: { fontSize: 'clamp(34px,4.5vw,58px)', fontWeight:900, color:'#fff', lineHeight:1.1, marginBottom:12 },
  accentLine: { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' },
  rotating: { color:'#60a5fa', display:'inline-block' },
  urdu: { fontSize:'clamp(16px,2vw,22px)', fontWeight:700, color:'rgba(255,255,255,0.55)', marginBottom:18, direction:'rtl' },
  sub: { fontSize:17, lineHeight:1.75, color:'rgba(255,255,255,0.65)', marginBottom:36, maxWidth:480 },
  btns: { display:'flex', gap:14, flexWrap:'wrap', marginBottom:0 },
  btnPrimary: {
    display:'inline-flex', alignItems:'center', gap:8,
    background:'linear-gradient(135deg,#1a73e8,#1557b0)',
    color:'#fff', padding:'14px 28px', borderRadius:50,
    fontSize:15, fontWeight:700, textDecoration:'none',
    boxShadow:'0 8px 24px rgba(26,115,232,0.4)', transition:'all .25s ease',
  },
  btnSecondary: {
    display:'inline-flex', alignItems:'center', gap:8,
    background:'rgba(255,255,255,0.1)', color:'#fff',
    padding:'14px 28px', borderRadius:50,
    fontSize:15, fontWeight:700, textDecoration:'none',
    border:'1px solid rgba(255,255,255,0.2)', transition:'all .25s ease',
  },
  stats: {
    display:'flex', gap:32, marginTop:44,
    paddingTop:32, borderTop:'1px solid rgba(255,255,255,0.1)',
  },
  statItem: {},
  statVal: { fontSize:30, fontWeight:900, color:'#fff' },
  statLbl: { fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 },
  right: { display:'flex', justifyContent:'center', alignItems:'center' },
  phoneMock: { filter:'drop-shadow(0 40px 60px rgba(0,0,0,0.45))' },
}
