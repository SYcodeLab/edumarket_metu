import {useState,useEffect} from 'react';
import {useNavigate,useLocation} from 'react-router-dom';
import {useAuth} from '../context/AuthContext.jsx';
import {notifAPI} from '../api/index.js';

const RC={student:'#27AE60',entrepreneur:'#D4AC0D',university:'#1A5276'};
const RL={student:'Студент',entrepreneur:'Предприниматель',university:'ВУЗ / Деканат'};
const RI={student:'🎓',entrepreneur:'💼',university:'🏫'};

export function Navbar(){
  const{user,logout}=useAuth();const nav=useNavigate();
  const[unread,setUnread]=useState(0);const[open,setOpen]=useState(false);const[q,setQ]=useState('');
  useEffect(()=>{if(user)notifAPI.getAll().then(r=>setUnread(r.data.unread_count||0)).catch(()=>{});},[user]);
  useEffect(()=>{const h=()=>setOpen(false);if(open)setTimeout(()=>document.addEventListener('click',h),0);return()=>document.removeEventListener('click',h);},[open]);
  return(
    <header className="navbar">
      <div className="nav-inner">
        <div className="nav-logo" onClick={()=>nav('/')}>
          <div className="nav-logo-box">E</div>
          <div className="nav-logo-text">
            <div className="nav-logo-main">EduMarket</div>
            <div className="nav-logo-sub">МИТУ · Биржа практики</div>
          </div>
        </div>
        <div className="nav-search">
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&nav(`/catalog?q=${q}`)} placeholder="Поиск проектов, компаний, навыков..."/>
          <button className="nav-search-btn" onClick={()=>nav(`/catalog?q=${q}`)}>🔍 Найти</button>
        </div>
        <div className="nav-links">
          {[['Каталог','/catalog'],['Стажировки','/internships'],['Компании','/companies']].map(([l,p])=>(
            <button key={p} onClick={()=>nav(p)} className="nav-link">{l}</button>
          ))}
        </div>
        <div className="nav-right">
          {user?(
            <>
              <button onClick={()=>nav('/messages')} className="nav-notif" title="Сообщения">💬</button>
              <button onClick={()=>nav('/favorites')} className="nav-notif" title="Избранное">🔖</button>
              <button onClick={()=>nav('/notifications')} className="nav-notif">
                🔔{unread>0&&<span className="notif-dot">{unread}</span>}
              </button>
              <div style={{position:'relative'}}>
                <div className="nav-user" onClick={e=>{e.stopPropagation();setOpen(o=>!o);}}>
                  <div className="nav-avatar" style={{background:RC[user.role]+'44',color:RC[user.role]}}>
                    {user.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div><div className="nav-user-name">{user.name?.split(' ')[0]}</div><div className="nav-user-role">{RI[user.role]} {RL[user.role]}</div></div>
                  <span className="nav-user-arrow">▼</span>
                </div>
                {open&&(
                  <div className="dropdown" onClick={e=>e.stopPropagation()}>
                    <div className="dropdown-head"><div className="dropdown-head-name">{user.name}</div><div className="dropdown-head-mail">{user.email}</div></div>
                    {[['⊞','Дашборд','/dashboard'],['👤','Мой профиль','/profile'],['📋','Мои заявки','/applications'],['💬','Сообщения','/messages'],['🔖','Избранное','/favorites'],['📄','Договоры','/contracts'],['🔔','Уведомления','/notifications']].map(([i,l,p])=>(
                      <button key={p} className="dropdown-item" onClick={()=>{nav(p);setOpen(false);}}><span>{i}</span>{l}</button>
                    ))}
                    <div className="dropdown-sep"/>
                    <button className="dropdown-item red" onClick={()=>{logout();nav('/');setOpen(false);}}><span>🚪</span>Выйти</button>
                  </div>
                )}
              </div>
            </>
          ):(
            <>
              <button onClick={()=>nav('/login')} className="btn btn-ghost btn-sm" style={{color:'rgba(255,255,255,.8)',borderColor:'rgba(255,255,255,.25)'}}>Войти</button>
              <button onClick={()=>nav('/register')} className="btn btn-red btn-sm">Регистрация</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const NAV={
  student:      [{p:'/dashboard',i:'⊞',l:'Дашборд'},{p:'/catalog',i:'📋',l:'Каталог проектов'},{p:'/internships',i:'🎯',l:'Стажировки'},{p:'/applications',i:'📩',l:'Мои отклики'},{p:'/favorites',i:'🔖',l:'Избранное'},{p:'/messages',i:'💬',l:'Сообщения'},{p:'/contracts',i:'📄',l:'Договоры'},{p:'/notifications',i:'🔔',l:'Уведомления'},{p:'/profile',i:'👤',l:'Профиль'}],
  entrepreneur: [{p:'/dashboard',i:'⊞',l:'Дашборд'},{p:'/catalog',i:'📋',l:'Каталог'},{p:'/my-projects',i:'📁',l:'Мои проекты'},{p:'/create-project',i:'➕',l:'Добавить проект'},{p:'/internships',i:'🎯',l:'Стажировки'},{p:'/messages',i:'💬',l:'Сообщения'},{p:'/contracts',i:'📄',l:'Договоры'},{p:'/reviews',i:'⭐',l:'Оставить отзыв'},{p:'/notifications',i:'🔔',l:'Уведомления'},{p:'/profile',i:'👤',l:'Профиль'}],
  university:   [{p:'/dashboard',i:'⊞',l:'Дашборд'},{p:'/catalog',i:'📋',l:'Каталог'},{p:'/internships',i:'🎯',l:'Стажировки'},{p:'/messages',i:'💬',l:'Сообщения'},{p:'/contracts',i:'📄',l:'Договоры'},{p:'/analytics',i:'📊',l:'Аналитика'},{p:'/reviews',i:'⭐',l:'Оценки практики'},{p:'/notifications',i:'🔔',l:'Уведомления'},{p:'/profile',i:'👤',l:'Профиль'}],
};

export function SideNav(){
  const{user,logout}=useAuth();const nav=useNavigate();const loc=useLocation();
  const[unread,setUnread]=useState(0);
  const color=RC[user?.role]||'var(--mitu-blue2)';
  useEffect(()=>{notifAPI.getAll().then(r=>setUnread(r.data.unread_count||0)).catch(()=>{});},[loc.pathname]);
  return(
    <aside className="sidenav">
      <div className="sn-role-card" style={{background:color+'15',border:`1px solid ${color}25`}}>
        <span style={{fontSize:24}}>{RI[user?.role]}</span>
        <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:700,color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name}</div><div style={{fontSize:11,color:'var(--tx4)'}}>{RL[user?.role]}</div></div>
      </div>
      <div className="sn-section">Навигация</div>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:2,overflowY:'auto'}}>
        {(NAV[user?.role]||[]).map(item=>{
          const on=loc.pathname===item.p;
          return(
            <button key={item.p} onClick={()=>nav(item.p)} className={`sn-item${on?' on':''}`}>
              <span style={{fontSize:14,width:18,textAlign:'center'}}>{item.i}</span>
              <span>{item.l}</span>
              {item.p==='/notifications'&&unread>0&&<span className="sn-badge">{unread}</span>}
            </button>
          );
        })}
      </div>
      {user?.role==='entrepreneur'&&(
        <div style={{borderTop:'1px solid var(--border)',paddingTop:10,marginTop:8}}>
          <button onClick={()=>nav('/create-project')} className="btn btn-primary btn-w" style={{fontSize:12,padding:'9px'}}>+ Добавить проект</button>
        </div>
      )}
      <button onClick={()=>{logout();nav('/');}} className="sn-item" style={{marginTop:6,color:'var(--mitu-red)'}}>
        <span>🚪</span>Выйти
      </button>
    </aside>
  );
}

export function PubLayout({children}){return<div style={{minHeight:'100vh',background:'var(--bg)'}}><Navbar/>{children}</div>;}
export function DashLayout({children}){
  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar/>
      <div style={{display:'flex'}}>
        <SideNav/>
        <main style={{flex:1,height:`calc(100vh - var(--nav))`,overflowY:'auto',padding:'24px 28px'}}>
          {children}
        </main>
      </div>
    </div>
  );
}
