import {createContext,useContext,useState,useEffect} from 'react';
import {authAPI} from '../api/index.js';
const Ctx=createContext(null);
export function AuthProvider({children}){
  const[user,setUser]=useState(null);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(localStorage.getItem('token'))authAPI.me().then(r=>setUser(r.data)).catch(()=>localStorage.clear()).finally(()=>setLoading(false));
    else setLoading(false);
  },[]);
  const login=async(e,p)=>{const{data}=await authAPI.login({email:e,password:p});localStorage.setItem('token',data.token);setUser(data.user);return data.user;};
  const register=async d=>{const{data}=await authAPI.register(d);localStorage.setItem('token',data.token);setUser(data.user);return data.user;};
  const logout=()=>{localStorage.clear();setUser(null);};
  return<Ctx.Provider value={{user,loading,login,register,logout}}>{children}</Ctx.Provider>;
}
export const useAuth=()=>useContext(Ctx);
