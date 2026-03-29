import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const links = [
  { label: 'Features',    href: '#features'  },
  { label: 'How It Works',href: '#how'       },
  { label: 'Safety',      href: '#safety'    },
  { label: 'Cities',      href: '#cities'    },
]

export default function Navbar() {
  const navRef   = useRef(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // entrance animation
    const ctx = gsap.context(() => {
      gsap.fromTo(navRef.current,
        { y: -80, opacity: 0 },
        { y: 0,   opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      )
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const s = styles
  return (
    <nav ref={navRef} style={{
      ...s.nav,
      background:   scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(229,231,235,0.5)' : '1px solid transparent',
      boxShadow:    scrolled ? '0 4px 30px rgba(0,0,0,0.06)' : 'none',
    }}>
      <a href="#" style={s.logo}>
        <div style={s.logoIcon}>🚗</div>
        <span style={{ fontWeight: 900, fontSize: 20, color: scrolled ? '#0d1b4b' : '#fff' }}>ChalParo</span>
      </a>
      <div style={s.links}>
        {links.map(l => (
          <a key={l.href} href={l.href} style={{
            ...s.link,
            color: scrolled ? '#374151' : 'rgba(255,255,255,0.8)',
          }}
            onMouseEnter={e => e.target.style.color = '#1a73e8'}
            onMouseLeave={e => e.target.style.color = scrolled ? '#374151' : 'rgba(255,255,255,0.8)'}
          >{l.label}</a>
        ))}
      </div>
      <a href="#download" style={s.cta}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(26,115,232,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = '0 6px 18px rgba(26,115,232,0.35)' }}
      >
        Download App
      </a>
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 48px',
    transition: 'all 0.4s ease',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none',
  },
  logoIcon: {
    width: 38, height: 38, borderRadius: 12,
    background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, boxShadow: '0 4px 12px rgba(26,115,232,0.4)',
  },
  links: { display: 'flex', gap: 36 },
  link: {
    fontSize: 14, fontWeight: 600,
    textDecoration: 'none', transition: 'color 0.2s',
  },
  cta: {
    background: 'linear-gradient(135deg,#1a73e8,#1557b0)',
    color: '#fff', padding: '10px 24px', borderRadius: 50,
    fontSize: 14, fontWeight: 700, textDecoration: 'none',
    boxShadow: '0 6px 18px rgba(26,115,232,0.35)',
    transition: 'all 0.25s ease',
  },
}
