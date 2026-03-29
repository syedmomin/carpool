const COL = [
  { title:'Product',    links:[['Features','#features'],['How It Works','#how'],['Safety','#safety'],['Download','#download']] },
  { title:'For Users',  links:[['Find a Ride','#'],['Post a Ride','#'],['Become a Driver','#'],['Verify CNIC','#']] },
  { title:'Company',    links:[['About Us','#'],['Contact','#'],['Privacy Policy','#'],['Terms','#']] },
]

export default function Footer() {
  const s = styles
  return (
    <footer style={s.footer}>
      <div style={s.inner}>
        <div style={s.brand}>
          <div style={s.logo}>🚗 ChalParo</div>
          <p style={s.desc}>Pakistan's smartest carpooling platform. Safe, affordable, and built for Pakistani roads.</p>
          <p style={s.made}>Made with ❤️ in Pakistan 🇵🇰</p>
          <p style={{ ...s.made, marginTop:4, direction:'rtl', fontSize:13 }}>چل پاڑو — ساتھ چلیں، ساتھ بچائیں</p>
        </div>
        {COL.map(col => (
          <div key={col.title} style={s.col}>
            <h5 style={s.colTitle}>{col.title}</h5>
            {col.links.map(([label, href]) => (
              <a key={label} href={href} style={s.link}
                onMouseEnter={e => e.target.style.color='#1a73e8'}
                onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.4)'}
              >{label}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={s.bottom}>
        <p style={s.copy}>© 2025 ChalParo. All rights reserved.</p>
        <div style={s.bottomLinks}>
          {['Privacy','Terms','Contact'].map(l => (
            <a key={l} href="#" style={s.bottomLink}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}

const styles = {
  footer: { background:'#080f1e', padding:'72px 48px 32px' },
  inner: {
    maxWidth:1200, margin:'0 auto',
    display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48,
    paddingBottom:48, borderBottom:'1px solid rgba(255,255,255,0.07)',
    marginBottom:28,
  },
  brand: {},
  logo: { fontSize:22, fontWeight:900, color:'#fff', marginBottom:14 },
  desc: { fontSize:14, color:'rgba(255,255,255,0.38)', lineHeight:1.75, maxWidth:240, marginBottom:16 },
  made: { fontSize:13, color:'rgba(255,255,255,0.25)' },
  col: { display:'flex', flexDirection:'column' },
  colTitle: { fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.4)', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:18 },
  link: { fontSize:14, color:'rgba(255,255,255,0.4)', textDecoration:'none', marginBottom:11, transition:'color .2s' },
  bottom: { maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' },
  copy: { fontSize:13, color:'rgba(255,255,255,0.25)' },
  bottomLinks: { display:'flex', gap:24 },
  bottomLink: { fontSize:13, color:'rgba(255,255,255,0.25)', textDecoration:'none' },
}
