import {useState} from 'react';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {AuthProvider,useAuth} from './context/AuthContext.jsx';
import {PubLayout,DashLayout} from './components/Layout.jsx';
import {reviewsAPI} from './api/index.js';

// Pages — основные
import Catalog from './pages/Catalog.jsx';
import {
  Landing,LoginPage,RegisterPage,
  Dashboard,Internships,Applications,
  Contracts,Analytics,Notifications,
  CreateProject,MyProjects,CreateInternship,
  Profile,
} from './pages/index.jsx';

// Pages — новые
import {
  ProjectDetail,Messages,Favorites,
  Companies,UserProfile,EditProfile,
} from './pages/new.jsx';

import './index.css';

// ── REVIEWS ───────────────────────────────────────────────────────────────────
function Reviews(){
  const[form,setForm]=useState({reviewee_id:'',rating:5,comment:''});
  const[loading,setLoading]=useState(false);const[success,setSuccess]=useState(false);const[err,setErr]=useState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async e=>{
    e.preventDefault();if(!form.reviewee_id)return setErr('Введите ID пользователя');
    setErr('');setLoading(true);
    try{await reviewsAPI.create(form);setSuccess(true);setForm({reviewee_id:'',rating:5,comment:''});}
    catch(e){setErr(e.response?.data?.error||'Ошибка');}
    finally{setLoading(false);}
  };
  return(
    <div>
      <div style={{fontFamily:'Exo 2',fontSize:22,fontWeight:800,color:'var(--mitu-navy)',marginBottom:4}}>Оценки практики</div>
      <div style={{fontSize:13,color:'var(--tx4)',marginBottom:22}}>Оставьте отзыв о студенте, компании или ВУЗе</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:860}}>
        <div>
          {success&&<div style={{padding:'12px 16px',background:'var(--ok-p)',borderRadius:8,marginBottom:16,color:'var(--ok)',fontWeight:600}}>✅ Отзыв успешно отправлен!</div>}
          <form onSubmit={submit} className="card" style={{padding:22}}>
            <div style={{fontFamily:'Exo 2',fontWeight:700,fontSize:15,color:'var(--mitu-navy)',marginBottom:16}}>✍ Оставить отзыв</div>
            <div className="fgroup">
              <label className="flabel">ID пользователя *</label>
              <input className="inp" value={form.reviewee_id} onChange={e=>set('reviewee_id',e.target.value)} placeholder="Числовой ID (см. в профиле)"/>
            </div>
            <div className="fgroup">
              <label className="flabel">Оценка</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} type="button" onClick={()=>set('rating',n)}
                    style={{width:42,height:42,borderRadius:8,border:`2px solid ${n<=form.rating?'var(--mitu-gold)':'var(--border)'}`,background:n<=form.rating?'var(--warn-p)':'transparent',fontSize:22,cursor:'pointer'}}>★</button>
                ))}
                <span style={{fontSize:15,fontWeight:700,color:'var(--mitu-gold)',marginLeft:6}}>{form.rating}/5</span>
              </div>
            </div>
            <div className="fgroup">
              <label className="flabel">Комментарий</label>
              <textarea className="inp" value={form.comment} onChange={e=>set('comment',e.target.value)} placeholder="Опишите опыт работы..." style={{height:100}}/>
            </div>
            {err&&<div className="alert alert-err">⚠ {err}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary btn-w">{loading?'⏳...':'⭐ Отправить отзыв'}</button>
          </form>
        </div>
        <div className="card" style={{padding:22,height:'fit-content'}}>
          <div style={{fontFamily:'Exo 2',fontWeight:700,fontSize:15,color:'var(--mitu-navy)',marginBottom:14}}>ℹ Как работают оценки</div>
          {[['🎓 Студент','Получает оценки от компаний за прохождение практики'],['💼 Предприниматель','Получает оценки от ВУЗов за качество стажировки'],['🏫 ВУЗ','Получает оценки от компаний за подготовку студентов']].map(([l,d])=>(
            <div key={l} style={{padding:'10px 12px',background:'var(--bg)',borderRadius:8,marginBottom:8}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{l}</div>
              <div style={{fontSize:12,color:'var(--tx3)'}}>{d}</div>
            </div>
          ))}
          <div style={{marginTop:10,padding:'10px 12px',background:'var(--mitu-sky)',borderRadius:8,fontSize:12,color:'var(--mitu-navy)'}}>
            💡 ID пользователя указан в его профиле
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GUARDS ────────────────────────────────────────────────────────────────────
function Priv({children}){
  const{user,loading}=useAuth();
  if(loading)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,color:'var(--tx4)'}}>⏳ Загружаем...</div>;
  if(!user)return<Navigate to="/login" replace/>;
  return<DashLayout>{children}</DashLayout>;
}
function Guest({children}){
  const{user,loading}=useAuth();
  if(loading)return null;
  return user?<Navigate to="/dashboard" replace/>:children;
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичные */}
          <Route path="/"            element={<PubLayout><Landing/></PubLayout>}/>
          <Route path="/catalog"     element={<PubLayout><Catalog/></PubLayout>}/>
          <Route path="/internships" element={<PubLayout><Internships/></PubLayout>}/>
          <Route path="/companies"   element={<PubLayout><Companies/></PubLayout>}/>
          <Route path="/projects/:id"element={<PubLayout><ProjectDetail/></PubLayout>}/>
          <Route path="/users/:id"   element={<PubLayout><UserProfile/></PubLayout>}/>
          <Route path="/login"       element={<Guest><LoginPage/></Guest>}/>
          <Route path="/register"    element={<Guest><RegisterPage/></Guest>}/>

          {/* Кабинет */}
          <Route path="/dashboard"         element={<Priv><Dashboard/></Priv>}/>
          <Route path="/applications"      element={<Priv><Applications/></Priv>}/>
          <Route path="/contracts"         element={<Priv><Contracts/></Priv>}/>
          <Route path="/analytics"         element={<Priv><Analytics/></Priv>}/>
          <Route path="/notifications"     element={<Priv><Notifications/></Priv>}/>
          <Route path="/create-project"    element={<Priv><CreateProject/></Priv>}/>
          <Route path="/my-projects"       element={<Priv><MyProjects/></Priv>}/>
          <Route path="/create-internship" element={<Priv><CreateInternship/></Priv>}/>
          <Route path="/reviews"           element={<Priv><Reviews/></Priv>}/>
          <Route path="/profile"           element={<Priv><Profile/></Priv>}/>
          <Route path="/edit-profile"      element={<Priv><EditProfile/></Priv>}/>
          <Route path="/messages"          element={<Priv><Messages/></Priv>}/>
          <Route path="/messages/:userId"  element={<Priv><Messages/></Priv>}/>
          <Route path="/favorites"         element={<Priv><Favorites/></Priv>}/>

          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
