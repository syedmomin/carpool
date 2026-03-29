import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { end:10000, suffix:'+ ', label:'Rides Completed',    prefix:'' },
  { end:25,    suffix:'+ ', label:'Pakistani Cities',   prefix:'' },
  { end:50,    suffix:'M+ ',label:'Passenger Savings',  prefix:'Rs ' },
  { end:4.8,   suffix:' ★', label:'Average Rating',     prefix:'', decimals:1 },
]

export default function Stats() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const nums = sectionRef.current.querySelectorAll('.stat-num')

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.fromTo(sectionRef.current, { opacity:0 }, { opacity:1, duration:0.6 })
          nums.forEach((el, i) => {
            const { end, decimals } = STATS[i]
            gsap.fromTo({ val: 0 }, { val: 0 }, {
              val: end, duration: 2.2, ease: 'power2.out',
              delay: i * 0.15,
              onUpdate() {
                el.textContent = decimals
                  ? this.targets()[0].val.toFixed(decimals)
                  : Math.round(this.targets()[0].val).toLocaleString()
              },
            })
          })
          gsap.fromTo('.stat-block', { y:30, opacity:0 }, {
            y:0, opacity:1, duration:0.7, stagger:0.12, ease:'power3.out',
          })
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const s = styles
  return (
    <section ref={sectionRef} style={{ ...s.section, opacity:0 }}>
      <div style={s.inner}>
        {STATS.map((stat, i) => (
          <div key={stat.label} className="stat-block" style={{ ...s.block, opacity:0 }}>
            <div style={s.value}>
              <span style={s.prefix}>{stat.prefix}</span>
              <span className="stat-num">0</span>
              <span>{stat.suffix}</span>
            </div>
            <div style={s.label}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

const styles = {
  section: {
    padding:'72px 48px',
    background:'linear-gradient(135deg,#1a73e8,#1557b0)',
  },
  inner: {
    maxWidth:960, margin:'0 auto',
    display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:40, textAlign:'center',
  },
  block: {},
  value: { fontSize:'clamp(36px,4vw,52px)', fontWeight:900, color:'#fff', lineHeight:1 },
  prefix: {},
  label: { fontSize:14, color:'rgba(255,255,255,0.65)', marginTop:8, fontWeight:600 },
}
