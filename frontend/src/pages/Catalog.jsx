import {useState,useEffect} from 'react';
import {useNavigate,useSearchParams} from 'react-router-dom';
import {useAuth} from '../context/AuthContext.jsx';
import {projectsAPI,applicationsAPI,statsAPI,favoritesAPI} from '../api/index.js';

const CATS=[{id:'',l:'Все',i:'⊞'},{id:'IT',l:'IT / Разработка',i:'💻'},{id:'AI/ML',l:'AI & ML',i:'🤖'},{id:'Design',l:'Дизайн',i:'🎨'},{id:'Data',l:'Аналитика',i:'📊'},{id:'Marketing',l:'Маркетинг',i:'📣'},{id:'Other',l:'Другое',i:'📦'}];
const EMO={IT:'💻','AI/ML':'🤖',Design:'🎨',Data:'📊',Marketing:'📣',Other:'📦'};
const BG={IT:'#EBF2FF','AI/ML':'#EDE9FE',Design:'#FDF4FF',Data:'#ECFDF5',Marketing:'#FFF7ED',Other:'#F8FAFC'};

function Skel(){
  return(
    <div className="pcard" style={{pointerEvents:'none'}}>
      <div className="pcard-img"><div className="skel" style={{width:80,height:80,borderRadius:'50%'}}/></div>
      <div className="pcard-body">
        <div className="skel" style={{height:14,width:'85%',marginBottom:8}}/>
        <div className="skel" style={{height:12,width:'60%',marginBottom:10}}/>
        <div className="skel" style={{height:11,width:'45%'}}/>
      </div>
      <div className="pcard-foot">
        <div><div className="skel" style={{height:20,width:110,marginBottom:4}}/><div className="skel" style={{height:11,width:80}}/></div>
        <div className="skel" style={{height:32,width:100,borderRadius:8}}/>
      </div>
    </div>
  );
}

export default function Catalog(){
  const{user}=useAuth();const nav=useNavigate();
  const[searchParams]=useSearchParams();
  const[items,setItems]=useState([]);const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState(searchParams.get('q')||'');
  const[cat,setCat]=useState('');const[sort,setSort]=useState('new');
  const[bMin,setBMin]=useState('');const[bMax,setBMax]=useState('');const[dur,setDur]=useState('');
  const[stats,setStats]=useState({});const[applied,setApplied]=useState([]);
  const[modal,setModal]=useState(null);const[letter,setLetter]=useState('');const[applying,setApplying]=useState(false);
  const[saved,setSaved]=useState([]);const[page,setPage]=useState(1);const[totalPages,setTotalPages]=useState(1);

  useEffect(()=>{statsAPI.get().then(r=>setStats(r.data)).catch(()=>{});},[]);
  useEffect(()=>{
    setLoading(true);setPage(1);
    projectsAPI.getAll({search,category:cat,sort,page:1,limit:12}).then(r=>{
      setItems(r.data.projects||[]);
      setTotalPages(r.data.pages||1);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[search,cat,sort]);

  const loadPage=async(p)=>{
    setLoading(true);setPage(p);
    const r=await projectsAPI.getAll({search,category:cat,sort,page:p,limit:12});
    setItems(r.data.projects||[]);setLoading(false);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const shown=items.filter(p=>{
    if(bMin&&p.budget<+bMin)return false;
    if(bMax&&p.budget>+bMax)return false;
    if(dur==='short'&&p.duration_weeks>4)return false;
    if(dur==='medium'&&(p.duration_weeks<4||p.duration_weeks>12))return false;
    if(dur==='long'&&p.duration_weeks<12)return false;
    return true;
  });

  const applyNow=async()=>{
    if(!modal)return;setApplying(true);
    try{await applicationsAPI.apply({project_id:modal.id,cover_letter:letter});setApplied(a=>[...a,modal.id]);setModal(null);setLetter('');}
    catch(e){alert(e.response?.data?.error||'Ошибка');}
    setApplying(false);
  };

  const toggleSave=async(e,p)=>{
    e.stopPropagation();
    try{const r=await favoritesAPI.toggle({project_id:p.id});setSaved(prev=>r.data.saved?[...prev,p.id]:prev.filter(id=>id!==p.id));}catch{}
  };

  return(
    <div>
      {/* HERO */}
      <div className="hero">
        <div className="hero-ornament"/>
        <div className="hero-inner">
          <div style={{display:'flex',justifyContent:'center',gap:7,marginBottom:14}}>
            {['◆','◇','◆','◇','◆','◇','◆','◇','◆'].map((s,i)=>(
              <span key={i} style={{color:i%2===0?'rgba(212,172,13,.7)':'rgba(255,255,255,.2)',fontSize:i===4?20:12}}>{s}</span>
            ))}
          </div>
          <div className="hero-badge">МЕЖДУНАРОДНЫЙ ИНЖЕНЕРНО-ТЕХНОЛОГИЧЕСКИЙ УНИВЕРСИТЕТ · КОД ВУЗа 049</div>
          <h1 className="hero-h1">Биржа практики и стажировок<br/><span>МИТУ · Алматы</span></h1>
          <p className="hero-sub">{stats.open_projects||0} проектов · {stats.open_internships||0} стажировок · {stats.users?.student||0} студентов</p>
          <div className="hero-search">
            <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setSearch(e.target.value)} placeholder="Введите навык, категорию или название компании..."/>
            <button className="hero-search-btn" onClick={()=>{}}>🔍 Найти</button>
          </div>
          <div className="hero-chips">
            {['React','Node.js','Python','Figma','SQL','ML'].map(t=>(
              <button key={t} className="hero-chip" onClick={()=>setSearch(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="hero-ornament-bottom"/>
      </div>

      {/* CAT TABS */}
      <div className="cat-strip">
        {CATS.map(c=>(
          <button key={c.id} onClick={()=>setCat(c.id)} className={`cat-tab${cat===c.id?' on':''}`}>{c.i} {c.l}</button>
        ))}
      </div>

      {/* MAIN */}
      <div style={{display:'flex',gap:20,maxWidth:1320,margin:'0 auto',padding:'20px 28px'}}>
        {/* FILTERS */}
        <div className="fbox">
          <div className="f jb ac mb16">
            <span className="fbox-title">Фильтры</span>
            <button onClick={()=>{setBMin('');setBMax('');setDur('');setSort('new');}} style={{border:'none',background:'none',color:'var(--mitu-red)',fontSize:12,cursor:'pointer',fontWeight:600}}>Сбросить</button>
          </div>
          <div style={{marginBottom:14}}>
            <div className="fbox-title mb8">Сортировка</div>
            {[['new','Новые'],['popular','Популярные'],['budget','По бюджету']].map(([v,l])=>(
              <div key={v} onClick={()=>setSort(v)} className={`fopt${sort===v?' on':''}`}><div className={`rdot${sort===v?' on':''}`}/>{l}</div>
            ))}
          </div>
          <div className="div" style={{margin:'12px 0'}}/>
          <div style={{marginBottom:14}}>
            <div className="fbox-title mb8">Бюджет (₸)</div>
            <div className="f g8">
              <input className="inp" value={bMin} onChange={e=>setBMin(e.target.value)} placeholder="от" type="number" style={{padding:'7px 9px',fontSize:12}}/>
              <input className="inp" value={bMax} onChange={e=>setBMax(e.target.value)} placeholder="до" type="number" style={{padding:'7px 9px',fontSize:12}}/>
            </div>
          </div>
          <div className="div" style={{margin:'12px 0'}}/>
          <div style={{marginBottom:14}}>
            <div className="fbox-title mb8">Длительность</div>
            {[['','Любая'],['short','До 1 месяца'],['medium','1–3 месяца'],['long','Более 3 мес']].map(([v,l])=>(
              <div key={v} onClick={()=>setDur(v)} className={`fopt${dur===v?' on':''}`}><div className={`rdot${dur===v?' on':''}`}/>{l}</div>
            ))}
          </div>
          <div className="div" style={{margin:'12px 0'}}/>
          <div style={{background:'linear-gradient(135deg,var(--mitu-sky),#FEF9E7)',borderRadius:8,padding:14,fontSize:12,border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'Exo 2',fontWeight:700,color:'var(--mitu-navy)',marginBottom:8}}>📊 Платформа МИТУ</div>
            {[['🎓',stats.users?.student||0,'Студентов'],['💼',stats.users?.entrepreneur||0,'Компаний'],['📄',stats.active_contracts||0,'Договоров']].map(([i,v,l])=>(
              <div key={l} className="f jb ac" style={{padding:'4px 0',borderBottom:'1px solid rgba(0,0,0,.06)'}}>
                <span style={{color:'var(--tx3)'}}>{i} {l}</span>
                <span style={{fontWeight:700,color:'var(--mitu-navy)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GRID */}
        <div style={{flex:1}}>
          <div className="f jb ac mb16">
            <div style={{fontSize:13,color:'var(--tx4)'}}>
              Найдено: <strong style={{color:'var(--mitu-navy)'}}>{shown.length}</strong> проектов
              {search&&<span style={{marginLeft:8,fontSize:12}}>по запросу "<em>{search}</em>"</span>}
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {user?.role==='entrepreneur'&&<button onClick={()=>nav('/create-project')} className="btn btn-primary btn-sm">+ Разместить проект</button>}
            </div>
          </div>

          {loading?(
            <div className="g3">{Array(6).fill(0).map((_,i)=><Skel key={i}/>)}</div>
          ):shown.length===0?(
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div className="empty-title">Проектов не найдено</div>
              <div className="empty-sub">Попробуйте изменить фильтры или категорию</div>
            </div>
          ):(
            <>
              <div className="g3">
                {shown.map(p=>(
                  <div key={p.id} className="pcard" onClick={()=>nav(`/projects/${p.id}`)}>
                    <div className="pcard-img" style={{background:BG[p.category]||'var(--mitu-sky)',position:'relative'}}>
                      <span>{EMO[p.category]||'📁'}</span>
                      <div className="pcard-img-badge"><span className="badge b-green" style={{fontSize:10}}>● Открыт</span></div>
                      {user&&(
                        <button onClick={e=>toggleSave(e,p)} style={{position:'absolute',top:10,left:10,width:28,height:28,borderRadius:6,border:'none',background:saved.includes(p.id)?'var(--warn-p)':'rgba(255,255,255,.9)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {saved.includes(p.id)?'🔖':'🔖'}
                        </button>
                      )}
                    </div>
                    <div className="pcard-body">
                      <div className="pcard-company">
                        <div className="pcard-ava">{(p.company_name||p.entrepreneur_name||'?').slice(0,2).toUpperCase()}</div>
                        <span className="pcard-company-name">{p.company_name||p.entrepreneur_name}</span>
                        {p.city&&<span style={{fontSize:10,color:'var(--tx5)',marginLeft:'auto',flexShrink:0}}>📍{p.city}</span>}
                      </div>
                      <div className="pcard-title">{p.title}</div>
                      <div style={{color:'var(--mitu-gold)',fontSize:11,letterSpacing:1}}>★★★★★ <span style={{color:'var(--tx4)'}}>5.0</span></div>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        {(p.skills_needed||'').split(',').filter(Boolean).slice(0,3).map(s=><span key={s} className="tag">{s.trim()}</span>)}
                        {(p.skills_needed||'').split(',').filter(Boolean).length>3&&<span className="tag" style={{color:'var(--tx5)'}}>+ещё</span>}
                      </div>
                    </div>
                    <div className="pcard-foot">
                      <div>
                        <div className="pcard-price">{p.budget?`${Number(p.budget).toLocaleString()} ₸`:'Договорная'}</div>
                        <div className="pcard-meta">👥 {p.applications_count||0} откл.{p.duration_weeks?` · ⏱${p.duration_weeks}нед`:''}</div>
                      </div>
                      {user?.role==='student'?(
                        applied.includes(p.id)
                          ?<span className="badge b-green">✓ Откликнулся</span>
                          :<button onClick={e=>{e.stopPropagation();setModal(p);}} className="btn btn-red btn-sm">Откликнуться</button>
                      ):(
                        <button onClick={e=>{e.stopPropagation();nav(`/projects/${p.id}`);}} className="btn btn-outline btn-sm">Подробнее →</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages>1&&(
                <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:28}}>
                  <button onClick={()=>loadPage(page-1)} disabled={page===1} className="btn btn-ghost btn-sm">← Назад</button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                    <button key={p} onClick={()=>loadPage(p)} className={`btn btn-sm ${p===page?'btn-primary':'btn-ghost'}`}>{p}</button>
                  ))}
                  <button onClick={()=>loadPage(page+1)} disabled={page===totalPages} className="btn btn-ghost btn-sm">Вперёд →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* APPLY MODAL */}
      {modal&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Откликнуться на проект</div>
              <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div style={{background:'var(--bg)',borderRadius:8,padding:14,marginBottom:16,display:'flex',gap:12,alignItems:'center',border:'1px solid var(--border)'}}>
              <div style={{width:50,height:50,borderRadius:10,background:BG[modal.category]||'var(--mitu-sky)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>
                {EMO[modal.category]||'📁'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{modal.title}</div>
                <div style={{fontSize:12,color:'var(--tx4)',marginTop:2}}>💼 {modal.company_name||modal.entrepreneur_name}</div>
              </div>
              {modal.budget&&<div style={{fontFamily:'Exo 2',fontSize:16,fontWeight:900,color:'var(--mitu-navy)',flexShrink:0}}>{Number(modal.budget).toLocaleString()} ₸</div>}
            </div>
            <label className="flabel">Сопроводительное письмо</label>
            <textarea className="inp" value={letter} onChange={e=>setLetter(e.target.value)}
              placeholder="Расскажите о вашем опыте и почему хотите участвовать в этом проекте..."
              style={{height:110,marginBottom:18}}/>
            <div className="f g8">
              <button onClick={()=>setModal(null)} className="btn btn-ghost btn-w">Отмена</button>
              <button onClick={applyNow} disabled={applying} className="btn btn-red btn-w">
                {applying?'⏳ Отправляем...':'📩 Отправить отклик'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
