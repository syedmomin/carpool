import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const ROW1 = ['🏙️ Karachi','🌆 Lahore','🏛️ Islamabad','🏙️ Rawalpindi','🌇 Faisalabad','🏙️ Multan','🌆 Peshawar','🏙️ Quetta','🌇 Gujranwala','🏙️ Sialkot']
const ROW2 = ['🌆 Hyderabad','🏙️ Abbottabad','🌇 Sukkur','🏙️ Rahim Yar Khan','🌆 Larkana','🏙️ Sargodha','🌇 Sahiwal','🏙️ Mardan','🌆 Mingora','🏙️ Jhang']

function MarqueeRow({ items, reverse = false }) {
  const doubled = [...items, ...items]
  const rowRef  = useRef(null)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const totalW = el.scrollWidth / 2
    gsap.fromTo(el,
      { x: reverse ? -totalW : 0 },
      { x: reverse ? 0 : -totalW, duration: items.length * 3.5, ease:'none', repeat:-1 }
    )
  }, [items, reverse])

  return (
    <div style={{ overflow:'hidden', marginBottom:12 }}>
      <div ref={rowRef} style={{ display:'flex', gap:12, width:'max-content' }}>
        {doubled.map((city, i) => (
          <div key={i} style={pill}>{city}</div>
        ))}
      </div>
    </div>
  )
}

const pill = {
  background:'#e8f0fe', color:'#1557b0',
  padding:'10px 22px', borderRadius:50,
  fontSize:14, fontWeight:700, whiteSpace:'nowrap',
  border:'1.5px solid rgba(26,115,232,0.15)',
  boxShadow:'0 2px 8px rgba(26,115,232,0.08)',
}

export default function Cities() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.cities-header', { opacity:0, y:30 }, {
        opacity:1, y:0, duration:0.7,
        scrollTrigger: { trigger:'.cities-header', start:'top 85%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="cities" style={s.section}>
      <div className="cities-header" style={{ ...s.header, opacity:0 }}>
        <div style={s.tag}>AVAILABLE ACROSS PAKISTAN</div>
        <h2 style={s.title}>25+ Cities & Growing</h2>
        <p style={s.sub}>From Karachi to Khyber — ChalParo connects Pakistan.</p>
      </div>
      <div style={{ marginTop:48 }}>
        <MarqueeRow items={ROW1} />
        <MarqueeRow items={ROW2} reverse />
      </div>
    </section>
  )
}

const s = {
  section: { padding:'100px 0 80px', background:'#f5f7ff', overflow:'hidden' },
  header: { textAlign:'center', paddingInline:48, marginBottom:0 },
  tag: {
    display:'inline-block', background:'#e8f0fe', color:'#1a73e8',
    padding:'6px 18px', borderRadius:50, fontSize:12, fontWeight:800,
    letterSpacing:'0.7px', marginBottom:14,
  },
  title: { fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, color:'#0d1b4b', marginBottom:12 },
  sub: { fontSize:16, color:'#6b7280', maxWidth:440, margin:'0 auto', lineHeight:1.7 },
}
