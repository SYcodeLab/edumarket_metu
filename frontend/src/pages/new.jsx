import {useState,useEffect,useRef,useCallback} from 'react';
import {useNavigate,useParams,Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext.jsx';
import {projectsAPI,applicationsAPI,messagesAPI,favoritesAPI,usersAPI,reviewsAPI,internshipsAPI} from '../api/index.js';

// ── SHARED ────────────────────────────────────────────────────────────────────
const ST={open:{c:'b-green',l:'● Открыт'},closed:{c:'b-red',l:'Закрыт'},in_progress:{c:'b-blue',l:'В работе'},completed:{c:'b-gray',l:'Завершён'},pending:{c:'b-yellow',l:'⏳ Ожидает'},reviewing:{c:'b-blue',l:'🔍 Рассматривается'},accepted:{c:'b-green',l:'✅ Принят'},rejected:{c:'b-red',l:'❌ Отклонён'},withdrawn:{c:'b-gray',l:'↩ Отозван'},active:{c:'b-green',l:'✅ Активен'},draft:{c:'b-gray',l:'Черновик'},sent:{c:'b-yellow',l:'📨 Отправлен'},signed_entrepreneur:{c:'b-yellow',l:'✍ Ждёт ВУЗа'},signed_university:{c:'b-yellow',l:'✍ Ждёт компанию'},cancelled:{c:'b-red',l:'Отменён'}};
function SBadge({s}){const x=ST[s]||{c:'b-gray',l:s};return<span className={`badge ${x.c}`}>{x.l}</span>;}
function Spin(){return<div style={{textAlign:'center',padding:56,color:'var(--tx4)'}}>⏳ Загружаем...</div>;}
function Empty({icon='📭',title,sub,btn}){return<div className="empty"><div className="empty-icon">{icon}</div><div className="empty-title">{title}</div>{sub&&<div className="empty-sub">{sub}</div>}{btn}</div>;}
const EMO={IT:'💻','AI/ML':'🤖',Design:'🎨',Data:'📊',Marketing:'📣',Other:'📦'};
const BG={IT:'#EBF2FF','AI/ML':'#EDE9FE',Design:'#FDF4FF',Data:'#ECFDF5',Marketing:'#FFF7ED',Other:'#F8FAFC'};

// ── PROJECT DETAIL ────────────────────────────────────────────────────────────
export function ProjectDetail(){
  const{id}=useParams();const{user}=useAuth();const nav=useNavigate();
  const[project,setProject]=useState(null);const[loading,setLoading]=useState(true);
  const[applied,setApplied]=useState(false);const[saved,setSaved]=useState(false);
  const[showApply,setShowApply]=useState(false);const[letter,setLetter]=useState('');const[applying,setApplying]=useState(false);
  const[applications,setApplications]=useState([]);

  useEffect(()=>{
    projectsAPI.getOne(id).then(r=>{setProject(r.data);setLoading(false);}).catch(()=>{setLoading(false);});
    if(user?.role==='entrepreneur')projectsAPI.getApps(id).then(r=>setApplications(r.data)).catch(()=>{});
  },[id,user?.role]);

  const applyNow=async()=>{
    setApplying(true);
    try{await applicationsAPI.apply({project_id:id,cover_letter:letter});setApplied(true);setShowApply(false);}
    catch(e){alert(e.response?.data?.error||'Ошибка');}
    setApplying(false);
  };

  const toggleSave=async()=>{
    try{const r=await favoritesAPI.toggle({project_id:+id});setSaved(r.data.saved);}catch{}
  };

  const updateStatus=async(appId,status)=>{
    try{await applicationsAPI.updateStatus(appId,status);setApplications(prev=>prev.map(a=>a.id===appId?{...a,status}:a));}catch{}
  };

  if(loading)return<Spin/>;
  if(!project)return<Empty icon="📭" title="Проект не найден" btn={<button onClick={()=>nav('/catalog')} className="btn btn-primary btn-sm">В каталог</button>}/>;

  const skills=(project.skills_needed||'').split(',').filter(Boolean);

  return(
    <div>
      {/* Breadcrumb */}
      <div style={{fontSize:12,color:'var(--tx4)',marginBottom:16,display:'flex',gap:6,alignItems:'center'}}>
        <button onClick={()=>nav('/catalog')} style={{border:'none',background:'none',color:'var(--mitu-blue2)',cursor:'pointer',fontSize:12,padding:0}}>Каталог</button>
        <span>/</span><span>{project.category||'Проект'}</span><span>/</span>
        <span style={{color:'var(--tx3)'}}>{project.title.slice(0,40)}...</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:24}}>
        {/* LEFT */}
        <div>
          {/* Header */}
          <div className="card" style={{padding:28,marginBottom:20}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:20}}>
              <div style={{width:64,height:64,borderRadius:14,background:BG[project.category]||'#EBF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,flexShrink:0}}>
                {EMO[project.category]||'📁'}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                  <SBadge s={project.status}/>
                  {project.category&&<span className="badge b-blue">{project.category}</span>}
                  <span style={{fontSize:11,color:'var(--tx5)'}}>👁 {project.views||0} просмотров</span>
                </div>
                <h1 style={{fontFamily:'Exo 2',fontSize:22,fontWeight:800,color:'var(--mitu-navy)',marginBottom:6,lineHeight:1.2}}>{project.title}</h1>
                <div style={{display:'flex',gap:12,fontSize:13,color:'var(--tx4)',flexWrap:'wrap'}}>
                  <span>💼 {project.company_name||project.entrepreneur_name}</span>
                  {project.city&&<span>📍 {project.city}</span>}
                  <span>📅 {new Date(project.created_at).toLocaleDateString('ru')}</span>
                  <span>👥 {project.applications_count||0} откликов</span>
                </div>
              </div>
            </div>

            {/* Key info */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {[
                ['💰','Бюджет',project.budget?`${Number(project.budget).toLocaleString()} ₸`:'Договорная','var(--mitu-navy)'],
                ['⏱','Длительность',project.duration_weeks?`${project.duration_weeks} недель`:'Не указано','var(--ok)'],
                ['📅','Дедлайн',project.deadline?new Date(project.deadline).toLocaleDateString('ru'):'Не указан','var(--mitu-red)'],
              ].map(([i,l,v,c])=>(
                <div key={l} style={{background:'var(--bg)',borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
                  <div style={{fontSize:20,marginBottom:4}}>{i}</div>
                  <div style={{fontSize:11,color:'var(--tx5)',marginBottom:2,textTransform:'uppercase',letterSpacing:.5}}>{l}</div>
                  <div style={{fontWeight:700,color:c,fontSize:14}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            {skills.length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--tx5)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Необходимые навыки</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {skills.map(s=><span key={s} className="tag" style={{fontSize:12,padding:'4px 12px'}}>{s.trim()}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card" style={{padding:24,marginBottom:20}}>
            <h2 style={{fontFamily:'Exo 2',fontSize:16,fontWeight:700,color:'var(--mitu-navy)',marginBottom:14}}>📋 Описание проекта</h2>
            <div style={{fontSize:14,color:'var(--tx3)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{project.description}</div>
          </div>

          {project.requirements&&(
            <div className="card" style={{padding:24,marginBottom:20}}>
              <h2 style={{fontFamily:'Exo 2',fontSize:16,fontWeight:700,color:'var(--mitu-navy)',marginBottom:14}}>✅ Требования</h2>
              <div style={{fontSize:14,color:'var(--tx3)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{project.requirements}</div>
            </div>
          )}

          {project.result&&(
            <div className="card" style={{padding:24,marginBottom:20}}>
              <h2 style={{fontFamily:'Exo 2',fontSize:16,fontWeight:700,color:'var(--mitu-navy)',marginBottom:14}}>🎯 Ожидаемый результат</h2>
              <div style={{fontSize:14,color:'var(--tx3)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{project.result}</div>
            </div>
          )}

          {/* Applications list for entrepreneur */}
          {user?.role==='entrepreneur'&&applications.length>0&&(
            <div className="card" style={{padding:24,marginBottom:20}}>
              <h2 style={{fontFamily:'Exo 2',fontSize:16,fontWeight:700,color:'var(--mitu-navy)',marginBottom:16}}>📩 Отклики ({applications.length})</h2>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {applications.map(a=>(
                  <div key={a.id} style={{padding:'14px 16px',background:'var(--bg)',borderRadius:10,display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:42,height:42,borderRadius:'50%',background:'var(--mitu-sky)',color:'var(--mitu-navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>
                      {a.student_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{a.student_name}</div>
                      <div style={{fontSize:11,color:'var(--tx4)'}}>{a.specialty||'—'} · {a.study_year ? `${a.study_year} курс` : ''}</div>
                      {a.cover_letter&&<div style={{fontSize:12,color:'var(--tx3)',marginTop:4,fontStyle:'italic'}}>"{a.cover_letter.slice(0,80)}..."</div>}
                      {a.skills&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6}}>{a.skills.split(',').slice(0,4).map(s=><span key={s} className="tag" style={{fontSize:10}}>{s.trim()}</span>)}</div>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',flexShrink:0}}>
                      <SBadge s={a.status}/>
                      <div style={{display:'flex',gap:6}}>
                        {a.github&&<a href={a.github} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--mitu-blue2)',textDecoration:'none'}}>GitHub →</a>}
                        <button onClick={()=>nav(`/messages/${a.student_id}`)} style={{border:'none',background:'var(--mitu-sky)',color:'var(--mitu-navy)',padding:'3px 8px',borderRadius:4,fontSize:11,cursor:'pointer'}}>💬</button>
                      </div>
                      {a.status==='pending'&&(
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={()=>updateStatus(a.id,'accepted')} className="btn btn-green btn-sm" style={{padding:'4px 10px',fontSize:11}}>✓ Принять</button>
                          <button onClick={()=>updateStatus(a.id,'rejected')} className="btn btn-red btn-sm" style={{padding:'4px 10px',fontSize:11}}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar */}
          {project.similar?.length>0&&(
            <div className="card" style={{padding:24}}>
              <h2 style={{fontFamily:'Exo 2',fontSize:16,fontWeight:700,color:'var(--mitu-navy)',marginBottom:16}}>🔗 Похожие проекты</h2>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {project.similar.map(p=>(
                  <div key={p.id} onClick={()=>nav(`/projects/${p.id}`)} style={{padding:'12px 14px',background:'var(--bg)',borderRadius:8,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--mitu-sky)'}
                    onMouseLeave={e=>e.currentTarget.style.background='var(--bg)'}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>{p.title}</div>
                      <div style={{fontSize:11,color:'var(--tx4)'}}>{p.company_name}</div>
                    </div>
                    <div style={{fontFamily:'Exo 2',fontWeight:700,color:'var(--mitu-navy)',fontSize:14}}>{p.budget?`${Number(p.budget).toLocaleString()} ₸`:'Договорная'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT sidebar */}
        <div>
          {/* Action card */}
          <div className="card" style={{padding:20,marginBottom:16,position:'sticky',top:10}}>
            {user?.role==='student'?(
              applied?(
                <div style={{textAlign:'center',padding:'16px',background:'var(--ok-p)',borderRadius:8,color:'var(--ok)',fontWeight:700}}>✅ Отклик отправлен!</div>
              ):showApply?(
                <div>
                  <div style={{fontWeight:700,marginBottom:10,color:'var(--mitu-navy)'}}>✍ Ваш отклик</div>
                  <textarea value={letter} onChange={e=>setLetter(e.target.value)} className="inp"
                    placeholder="Расскажите о себе, вашем опыте и почему хотите работать над этим проектом..." style={{height:120,marginBottom:10}}/>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setShowApply(false)} className="btn btn-ghost btn-w btn-sm">Отмена</button>
                    <button onClick={applyNow} disabled={applying} className="btn btn-red btn-w">
                      {applying?'⏳...':'📩 Отправить'}
                    </button>
                  </div>
                </div>
              ):(
                <div>
                  <div style={{fontFamily:'Exo 2',fontSize:18,fontWeight:900,color:'var(--mitu-navy)',marginBottom:4,textAlign:'center'}}>
                    {project.budget?`${Number(project.budget).toLocaleString()} ₸`:'Договорная'}
                  </div>
                  <div style={{fontSize:11,color:'var(--tx5)',textAlign:'center',marginBottom:14}}>Бюджет проекта</div>
                  <button onClick={()=>setShowApply(true)} className="btn btn-red btn-w btn-lg" style={{marginBottom:8}}>
                    📩 Откликнуться
                  </button>
                  <button onClick={toggleSave} className="btn btn-w" style={{background:saved?'var(--warn-p)':undefined,borderColor:saved?'var(--mitu-gold)':undefined}}>
                    {saved?'🔖 Сохранено':'🔖 Сохранить'}
                  </button>
                </div>
              )
            ):(
              <div>
                <div style={{fontFamily:'Exo 2',fontSize:20,fontWeight:900,color:'var(--mitu-navy)',marginBottom:14,textAlign:'center'}}>
                  {project.budget?`${Number(project.budget).toLocaleString()} ₸`:'Договорная'}
                </div>
                {!user&&<button onClick={()=>nav('/login')} className="btn btn-red btn-w btn-lg">Войти чтобы откликнуться</button>}
              </div>
            )}
          </div>

          {/* Company card */}
          <div className="card" style={{padding:18,marginBottom:16}}>
            <div style={{fontWeight:700,color:'var(--mitu-navy)',marginBottom:12,fontSize:14}}>🏢 О компании</div>
            <div onClick={()=>nav(`/users/${project.entrepreneur_id}`)} style={{display:'flex',gap:10,alignItems:'center',cursor:'pointer',marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:'var(--mitu-sky)',color:'var(--mitu-navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>
                {(project.company_name||project.entrepreneur_name||'?').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{fontWeight:600,fontSize:13,color:'var(--mitu-navy)'}}>{project.company_name||project.entrepreneur_name}</div>
                {project.industry&&<div style={{fontSize:11,color:'var(--tx4)'}}>{project.industry}</div>}
              </div>
            </div>
            {project.company_desc&&<p style={{fontSize:12,color:'var(--tx3)',lineHeight:1.5,marginBottom:10}}>{project.company_desc.slice(0,150)}...</p>}
            {[project.city&&`📍 ${project.city}`,project.website&&`🌐 Сайт компании`].filter(Boolean).map(x=>(
              <div key={x} style={{fontSize:12,color:'var(--tx4)',marginBottom:4}}>{x}</div>
            ))}
            {user&&user.id!==project.entrepreneur_id&&(
              <button onClick={()=>nav(`/messages/${project.entrepreneur_id}`)} className="btn btn-outline btn-w btn-sm" style={{marginTop:10}}>
                💬 Написать сообщение
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Apply modal */}
    </div>
  );
}

// ── MESSAGES / CHAT ───────────────────────────────────────────────────────────
export function Messages(){
  const{user}=useAuth();const nav=useNavigate();const{userId}=useParams();
  const[chats,setChats]=useState([]);const[messages,setMessages]=useState([]);
  const[content,setContent]=useState('');const[sending,setSending]=useState(false);
  const[partner,setPartner]=useState(null);const[search,setSearch]=useState('');
  const[searchRes,setSearchRes]=useState([]);const[loading,setLoading]=useState(false);
  const bottomRef=useRef(null);

  useEffect(()=>{
    messagesAPI.getChats().then(r=>setChats(r.data)).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(userId){
      setLoading(true);
      messagesAPI.getThread(userId).then(r=>{setMessages(r.data);setLoading(false);}).catch(()=>setLoading(false));
      usersAPI.profile(userId).then(r=>setPartner(r.data)).catch(()=>{});
      // Обновляем список чатов
      messagesAPI.getChats().then(r=>setChats(r.data)).catch(()=>{});
    }
  },[userId]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);

  // Поиск пользователей
  useEffect(()=>{
    if(search.length>=2){
      usersAPI.search(search).then(r=>setSearchRes(r.data)).catch(()=>{});
    }else{setSearchRes([]);}
  },[search]);

  const sendMsg=async e=>{
    e.preventDefault();if(!content.trim()||!userId)return;
    setSending(true);
    try{
      await messagesAPI.send({receiver_id:+userId,content:content.trim()});
      setContent('');
      const r=await messagesAPI.getThread(userId);setMessages(r.data);
      messagesAPI.getChats().then(r=>setChats(r.data)).catch(()=>{});
    }catch{}
    setSending(false);
  };

  const RC={student:'#27AE60',entrepreneur:'#D4AC0D',university:'#1A5276'};

  return(
    <div style={{display:'flex',height:'calc(100vh - var(--nav) - 48px)',gap:0,background:'var(--white)',borderRadius:14,overflow:'hidden',border:'1px solid var(--border)',boxShadow:'var(--sh)'}}>
      {/* LEFT — Chats list */}
      <div style={{width:280,borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px 16px 12px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Exo 2',fontWeight:700,fontSize:16,color:'var(--mitu-navy)',marginBottom:10}}>💬 Сообщения</div>
          <input className="inp" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Найти пользователя..." style={{padding:'8px 12px',fontSize:12}}/>
          {searchRes.length>0&&(
            <div style={{position:'absolute',background:'white',border:'1px solid var(--border)',borderRadius:8,zIndex:10,width:248,boxShadow:'var(--sh2)'}}>
              {searchRes.map(u=>(
                <div key={u.id} onClick={()=>{nav(`/messages/${u.id}`);setSearch('');setSearchRes([]);}} style={{padding:'10px 14px',cursor:'pointer',display:'flex',gap:10,alignItems:'center',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:(RC[u.role]||'var(--mitu-sky)')+'22',color:RC[u.role]||'var(--mitu-navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11,flexShrink:0}}>
                    {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div><div style={{fontSize:13,fontWeight:600}}>{u.name}</div><div style={{fontSize:11,color:'var(--tx4)'}}>{u.company_name||u.specialty||u.role}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {chats.map(c=>(
            <div key={c.partner_id} onClick={()=>nav(`/messages/${c.partner_id}`)} style={{padding:'12px 16px',cursor:'pointer',display:'flex',gap:10,alignItems:'center',background:+userId===c.partner_id?'var(--mitu-sky)':'transparent',borderLeft:+userId===c.partner_id?'3px solid var(--mitu-navy)':'3px solid transparent',transition:'all .1s'}}
              onMouseEnter={e=>{if(+userId!==c.partner_id)e.currentTarget.style.background='var(--bg)';}}
              onMouseLeave={e=>{if(+userId!==c.partner_id)e.currentTarget.style.background='transparent';}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:(RC[c.partner_role]||'var(--mitu-sky)')+'22',color:RC[c.partner_role]||'var(--mitu-navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,flexShrink:0}}>
                {c.partner_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.partner_name}</div>
                <div style={{fontSize:11,color:'var(--tx5)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.last_message||'—'}</div>
              </div>
              {c.unread>0&&<span style={{width:18,height:18,borderRadius:'50%',background:'var(--mitu-red)',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{c.unread}</span>}
            </div>
          ))}
          {chats.length===0&&<div style={{textAlign:'center',padding:'24px 16px',color:'var(--tx5)',fontSize:13}}>Нет диалогов.<br/>Найдите пользователя через поиск выше.</div>}
        </div>
      </div>

      {/* RIGHT — Chat window */}
      {userId&&partner?(
        <div style={{flex:1,display:'flex',flexDirection:'column'}}>
          {/* Header */}
          <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,background:'var(--bg)'}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:(RC[partner.role]||'var(--mitu-sky)')+'22',color:RC[partner.role]||'var(--mitu-navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>
              {partner.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:'var(--mitu-navy)'}}>{partner.name}</div>
              <div style={{fontSize:11,color:'var(--tx4)'}}>{partner.company_name||partner.specialty||partner.role}</div>
            </div>
            <button onClick={()=>nav(`/users/${userId}`)} className="btn btn-ghost btn-sm">Профиль →</button>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
            {loading?<Spin/>:messages.map(m=>{
              const isMe=m.sender_id===user.id;
              return(
                <div key={m.id} style={{display:'flex',justifyContent:isMe?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'70%',padding:'10px 14px',borderRadius:isMe?'14px 14px 2px 14px':'14px 14px 14px 2px',background:isMe?'var(--mitu-navy)':'var(--bg)',color:isMe?'#fff':'var(--tx)',fontSize:13,lineHeight:1.5}}>
                    {m.content}
                    <div style={{fontSize:10,color:isMe?'rgba(255,255,255,.5)':'var(--tx5)',marginTop:4,textAlign:'right'}}>{new Date(m.created_at).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                </div>
              );
            })}
            {messages.length===0&&!loading&&<div style={{textAlign:'center',padding:32,color:'var(--tx5)',fontSize:13}}>Начните диалог 👋</div>}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <form onSubmit={sendMsg} style={{padding:'14px 20px',borderTop:'1px solid var(--border)',display:'flex',gap:10}}>
            <input className="inp" value={content} onChange={e=>setContent(e.target.value)}
              placeholder="Напишите сообщение..." style={{flex:1}}/>
            <button type="submit" disabled={sending||!content.trim()} className="btn btn-primary">
              {sending?'⏳':'📤 Отправить'}
            </button>
          </form>
        </div>
      ):(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:'var(--tx5)'}}>
          <div style={{fontSize:56}}>💬</div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--mitu-navy)'}}>Выберите диалог</div>
          <div style={{fontSize:13}}>или найдите пользователя через поиск</div>
        </div>
      )}
    </div>
  );
}

// ── FAVORITES ─────────────────────────────────────────────────────────────────
export function Favorites(){
  const nav=useNavigate();
  const[items,setItems]=useState([]);const[loading,setLoading]=useState(true);const[tab,setTab]=useState('all');
  useEffect(()=>{favoritesAPI.getAll().then(r=>{setItems(r.data);setLoading(false);}).catch(()=>setLoading(false));},[]);

  const remove=async item=>{
    try{
      await favoritesAPI.toggle(item.project_id?{project_id:item.project_id}:{internship_id:item.internship_id});
      setItems(prev=>prev.filter(i=>i.id!==item.id));
    }catch{}
  };

  const shown=tab==='all'?items:tab==='projects'?items.filter(i=>i.project_id):items.filter(i=>i.internship_id);

  return(
    <div>
      <div className="ptitle">Избранное</div>
      <div className="psub">Сохранённые проекты и стажировки</div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {[['all',`Все (${items.length})`],['projects',`Проекты (${items.filter(i=>i.project_id).length})`],['internships',`Стажировки (${items.filter(i=>i.internship_id).length})`]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} className={`btn btn-sm ${tab===v?'btn-primary':'btn-ghost'}`}>{l}</button>
        ))}
      </div>
      {loading?<Spin/>:(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {shown.map(item=>(
            <div key={item.id} className="card" style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:44,height:44,borderRadius:11,background:item.project_id?'var(--mitu-sky)':'var(--ok-p)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                {item.project_id?'📁':'🎯'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:'var(--mitu-navy)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {item.project_title||item.internship_title||'—'}
                </div>
                <div style={{fontSize:12,color:'var(--tx4)'}}>
                  💼 {item.project_company||item.internship_company||'—'}
                  {item.budget&&` · 💰 ${Number(item.budget).toLocaleString()} ₸`}
                  {item.salary&&item.is_paid&&` · 💰 ${Number(item.salary).toLocaleString()} ₸/мес`}
                </div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                <SBadge s={item.project_status||item.internship_status}/>
                <button onClick={()=>nav(item.project_id?`/projects/${item.project_id}`:`/catalog`)} className="btn btn-outline btn-sm">Открыть</button>
                <button onClick={()=>remove(item)} className="btn btn-ghost btn-sm" style={{color:'var(--mitu-red)'}}>✕</button>
              </div>
            </div>
          ))}
          {shown.length===0&&<Empty icon="🔖" title="Ничего нет" sub="Сохраняйте проекты нажав 🔖 на странице проекта" btn={<button onClick={()=>nav('/catalog')} className="btn btn-primary btn-sm">Перейти в каталог</button>}/>}
        </div>
      )}
    </div>
  );
}

// ── COMPANIES ─────────────────────────────────────────────────────────────────
export function Companies(){
  const nav=useNavigate();
  const[search,setSearch]=useState('');const[users,setUsers]=useState([]);const[loading,setLoading]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    try{const r=await usersAPI.search(search||'а',{role:'entrepreneur'});setUsers(r.data);}catch{}
    setLoading(false);
  },[search]);

  useEffect(()=>{load();},[load]);

  return(
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:'Exo 2',fontSize:24,fontWeight:800,color:'var(--mitu-navy)',marginBottom:4}}>Компании-партнёры</h1>
        <p style={{fontSize:13,color:'var(--tx4)'}}>Компании, размещающие проекты и стажировки на МИТУ EduMarket</p>
      </div>
      <div style={{display:'flex',alignItems:'center',background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden',maxWidth:440,marginBottom:24}}>
        <span style={{padding:'0 12px',color:'var(--tx5)',fontSize:15}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Найти компанию..." style={{flex:1,padding:'10px 0',border:'none',fontSize:13,outline:'none',color:'var(--tx)'}}/>
      </div>
      {loading?<Spin/>:(
        <div className="g3">
          {users.map(u=>(
            <div key={u.id} className="card" style={{padding:20,cursor:'pointer',transition:'all .2s'}}
              onClick={()=>nav(`/users/${u.id}`)}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--sh2)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor='var(--mitu-blue2)';}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--sh)';e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='var(--border)';}}>
              <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
                <div style={{width:48,height:48,borderRadius:12,background:'var(--mitu-sky)',color:'var(--mitu-navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:18,flexShrink:0}}>
                  {(u.company_name||u.name||'?').slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:'var(--mitu-navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.company_name||u.name}</div>
                  {u.industry&&<div style={{fontSize:12,color:'var(--tx4)'}}>{u.industry}</div>}
                </div>
              </div>
              {u.city&&<div style={{fontSize:12,color:'var(--tx4)',marginBottom:6}}>📍 {u.city}</div>}
              <button onClick={e=>{e.stopPropagation();nav(`/users/${u.id}`);}} className="btn btn-outline btn-w btn-sm">Профиль компании →</button>
            </div>
          ))}
          {users.length===0&&<div style={{gridColumn:'1/-1'}}><Empty title="Компаний не найдено"/></div>}
        </div>
      )}
    </div>
  );
}

// ── USER PROFILE ──────────────────────────────────────────────────────────────
export function UserProfile(){
  const{id}=useParams();const{user:me}=useAuth();const nav=useNavigate();
  const[profile,setProfile]=useState(null);const[loading,setLoading]=useState(true);

  useEffect(()=>{
    usersAPI.profile(id).then(r=>{setProfile(r.data);setLoading(false);}).catch(()=>setLoading(false));
  },[id]);

  if(loading)return<Spin/>;
  if(!profile)return<Empty icon="👤" title="Пользователь не найден"/>;

  const RC={student:'#27AE60',entrepreneur:'#D4AC0D',university:'#1A5276'};
  const RL={student:'Студент',entrepreneur:'Предприниматель',university:'ВУЗ'};
  const color=RC[profile.role]||'var(--mitu-blue2)';
  const isMe=me?.id===profile.id;

  return(
    <div style={{maxWidth:900,margin:'0 auto'}}>
      <div className="g2" style={{alignItems:'start'}}>
        {/* Profile card */}
        <div>
          <div className="card" style={{padding:24,marginBottom:16}}>
            <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:20}}>
              <div style={{width:72,height:72,borderRadius:'50%',background:color+'22',color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,border:`3px solid ${color}44`,flexShrink:0}}>
                {profile.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div>
                <div style={{fontFamily:'Exo 2',fontSize:20,fontWeight:800,color:'var(--mitu-navy)',marginBottom:3}}>{profile.name}</div>
                <div style={{fontSize:13,color}}>{RL[profile.role]==='Предприниматель'?'💼':'RL'[profile.role]==='Студент'?'🎓':'🏫'} {RL[profile.role]}</div>
                {profile.company_name&&<div style={{fontSize:12,color:'var(--tx4)',marginTop:2}}>🏢 {profile.company_name}</div>}
                {profile.specialty&&<div style={{fontSize:12,color:'var(--tx4)',marginTop:2}}>📚 {profile.specialty}{profile.study_year?`, ${profile.study_year} курс`:''}</div>}
              </div>
            </div>

            {profile.average_rating&&(
              <div style={{padding:'10px 14px',background:'var(--warn-p)',borderRadius:8,marginBottom:14,display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:22}}>⭐</span>
                <div>
                  <div style={{fontWeight:700,color:'var(--mitu-gold)',fontSize:17}}>{profile.average_rating} / 5.0</div>
                  <div style={{fontSize:11,color:'var(--tx4)'}}>{profile.reviews?.length||0} отзывов</div>
                </div>
              </div>
            )}

            {profile.bio&&<p style={{fontSize:13,color:'var(--tx3)',lineHeight:1.6,marginBottom:14,padding:'12px',background:'var(--bg)',borderRadius:8}}>{profile.bio}</p>}

            {profile.skills&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--tx5)',textTransform:'uppercase',marginBottom:6}}>Навыки</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {profile.skills.split(',').filter(Boolean).map(s=><span key={s} className="tag">{s.trim()}</span>)}
                </div>
              </div>
            )}

            {[profile.city&&`📍 ${profile.city}`,profile.industry&&`🏭 ${profile.industry}`,profile.website&&`🌐 ${profile.website}`,profile.github&&`🐙 GitHub`].filter(Boolean).map(x=>(
              <div key={x} style={{fontSize:12,color:'var(--tx4)',marginBottom:4}}>{x}</div>
            ))}

            {!isMe&&me&&(
              <div style={{display:'flex',gap:8,marginTop:14}}>
                <button onClick={()=>nav(`/messages/${profile.id}`)} className="btn btn-primary btn-w">💬 Написать</button>
              </div>
            )}
            {isMe&&<button onClick={()=>nav('/edit-profile')} className="btn btn-outline btn-w" style={{marginTop:14}}>✏ Редактировать профиль</button>}
          </div>

          {/* Reviews */}
          {profile.reviews?.length>0&&(
            <div className="card" style={{padding:20}}>
              <div style={{fontWeight:700,color:'var(--mitu-navy)',marginBottom:14}}>⭐ Отзывы</div>
              {profile.reviews.map((r,i)=>(
                <div key={i} style={{padding:'12px 0',borderBottom:i<profile.reviews.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontWeight:600,fontSize:13}}>{r.reviewer_name}</span>
                    <span style={{color:'var(--mitu-gold)',fontSize:13}}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                  </div>
                  {r.comment&&<div style={{fontSize:12,color:'var(--tx3)',lineHeight:1.5}}>{r.comment}</div>}
                  <div style={{fontSize:10,color:'var(--tx5)',marginTop:4}}>{new Date(r.created_at).toLocaleDateString('ru')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div>
          {profile.projects?.length>0&&(
            <div className="card" style={{padding:20}}>
              <div style={{fontWeight:700,color:'var(--mitu-navy)',marginBottom:14}}>📁 Активные проекты</div>
              {profile.projects.map(p=>(
                <div key={p.id} onClick={()=>nav(`/projects/${p.id}`)} style={{padding:'12px 14px',background:'var(--bg)',borderRadius:8,marginBottom:8,cursor:'pointer',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--mitu-sky)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--bg)'}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{p.title}</div>
                  <div style={{display:'flex',gap:10,fontSize:11,color:'var(--tx4)'}}>
                    <span className={`badge ${ST[p.status]?.c||'b-gray'}`} style={{fontSize:10}}>{ST[p.status]?.l||p.status}</span>
                    {p.budget&&<span>💰 {Number(p.budget).toLocaleString()} ₸</span>}
                    {p.category&&<span>📂 {p.category}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="card" style={{padding:20,marginTop:profile.projects?.length?16:0}}>
            <div style={{fontWeight:700,color:'var(--mitu-navy)',marginBottom:14}}>ℹ Информация</div>
            {[['🔑','ID профиля',`#${profile.id}`],['📅','На платформе с',new Date(profile.created_at).toLocaleDateString('ru')],['👤','Роль',{student:'🎓 Студент',entrepreneur:'💼 Предприниматель',university:'🏫 ВУЗ'}[profile.role]||profile.role]].map(([i,l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span style={{color:'var(--tx4)'}}>{i} {l}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EDIT PROFILE ──────────────────────────────────────────────────────────────
export function EditProfile(){
  const{user,login}=useAuth();const nav=useNavigate();
  const[form,setForm]=useState({name:'',phone:'',bio:'',company_name:'',industry:'',website:'',description:'',city:'',specialty:'',skills:'',github:'',portfolio:''});
  const[loading,setLoading]=useState(false);const[success,setSuccess]=useState(false);const[err,setErr]=useState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const{authAPI}=require('../api/index.js');

  useEffect(()=>{
    if(user){
      setForm(f=>({...f,
        name:user.name||'',phone:user.phone||'',bio:user.bio||'',
        company_name:user.company_name||'',industry:user.industry||'',website:user.website||'',description:user.description||'',city:user.city||'',
        specialty:user.specialty||'',skills:user.skills||'',github:user.github||'',portfolio:user.portfolio||'',
      }));
    }
  },[user]);

  const submit=async e=>{
    e.preventDefault();setErr('');setLoading(true);
    try{
      // Импортируем API
      const{authAPI:api}=await import('../api/index.js');
      await api.update(form);
      setSuccess(true);setTimeout(()=>setSuccess(false),3000);
    }catch(e){setErr(e.response?.data?.error||'Ошибка сохранения');}
    finally{setLoading(false);}
  };

  const Fld=({label,k,type='text',placeholder})=>(
    <div className="fgroup">
      <label className="flabel">{label}</label>
      <input className="inp" type={type} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder}/>
    </div>
  );

  return(
    <div style={{maxWidth:640}}>
      <div className="ptitle">Редактировать профиль</div>
      <div className="psub">Обновите ваши данные на платформе</div>

      {success&&<div style={{padding:'12px 16px',background:'var(--ok-p)',borderRadius:8,marginBottom:16,color:'var(--ok)',fontWeight:600}}>✅ Профиль успешно обновлён!</div>}

      <form onSubmit={submit} className="card" style={{padding:26}}>
        <div style={{fontFamily:'Exo 2',fontWeight:700,fontSize:14,color:'var(--mitu-navy)',marginBottom:14}}>Основная информация</div>
        <Fld label="Имя" k="name" placeholder="Ваше полное имя"/>
        <Fld label="Телефон" k="phone" placeholder="+7 700 000 0000"/>
        <div className="fgroup">
          <label className="flabel">О себе / Bio</label>
          <textarea className="inp" value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Расскажите о себе..." style={{height:90}}/>
        </div>

        {user?.role==='entrepreneur'&&(
          <>
            <div className="div" style={{margin:'16px 0'}}/>
            <div style={{fontFamily:'Exo 2',fontWeight:700,fontSize:14,color:'var(--mitu-navy)',marginBottom:14}}>Информация о компании</div>
            <div className="g2">
              <Fld label="Название компании" k="company_name" placeholder="ТОО Kaspi Tech"/>
              <Fld label="Отрасль" k="industry" placeholder="FinTech"/>
              <Fld label="Город" k="city" placeholder="Алматы"/>
              <Fld label="Сайт" k="website" placeholder="https://example.kz"/>
            </div>
            <div className="fgroup">
              <label className="flabel">Описание компании</label>
              <textarea className="inp" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Чем занимается компания..." style={{height:80}}/>
            </div>
          </>
        )}

        {user?.role==='student'&&(
          <>
            <div className="div" style={{margin:'16px 0'}}/>
            <div style={{fontFamily:'Exo 2',fontWeight:700,fontSize:14,color:'var(--mitu-navy)',marginBottom:14}}>Академическая информация</div>
            <div className="g2">
              <Fld label="Специальность" k="specialty" placeholder="Информационные системы"/>
              <Fld label="GitHub" k="github" placeholder="https://github.com/username"/>
            </div>
            <div className="fgroup">
              <label className="flabel">Навыки (через запятую)</label>
              <input className="inp" value={form.skills} onChange={e=>set('skills',e.target.value)} placeholder="React, Node.js, Python, SQL"/>
            </div>
            <Fld label="Портфолио" k="portfolio" placeholder="https://myportfolio.kz"/>
          </>
        )}

        {err&&<div className="alert alert-err">⚠ {err}</div>}
        <div className="f g8 mt16">
          <button type="button" onClick={()=>nav('/profile')} className="btn btn-ghost">← Назад</button>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{flex:1}}>{loading?'⏳ Сохраняем...':'✅ Сохранить изменения'}</button>
        </div>
      </form>
    </div>
  );
}
