import{r as d}from"./react-vendor-BKs11Bab.js";import{s as a}from"./index-BjBmjyG3.js";function U(){const[g,b]=d.useState([]),[y,k]=d.useState([]),[M,S]=d.useState(!0),[m,w]=d.useState([]);d.useEffect(()=>{a.auth.getSession().then(async({data:t})=>{const i=t.session?.user?.id||null;if(!i)return;const s=[i];try{const{data:_}=await a.from("user_roles").select("display_name").eq("user_id",i).maybeSingle();if(_){const n=_.display_name;if(n){const{data:c}=await a.from("app_users").select("id").eq("username",n).maybeSingle();if(c){const e=c.id;e&&e!==i&&s.push(e)}}}const f=t.session?.user?.email?.split("@")[0]||"";if(f&&s.length<2){const{data:n}=await a.from("app_users").select("id").eq("username",f).maybeSingle();if(n){const c=n.id;c&&!s.includes(c)&&s.push(c)}}}catch{}w(s)})},[]);const l=d.useCallback(async()=>{if(m.length!==0)try{const{data:t,error:i}=await a.from("notifications").select(`
          id,
          from_user_id,
          to_user_id,
          task_id,
          progress_entry_id,
          note,
          mentioned_username,
          is_read,
          reply_count,
          created_at,
          from_user:from_user_id ( username ),
          to_user:to_user_id ( username ),
          task:task_id ( name )
        `).in("from_user_id",m).order("created_at",{ascending:!1}).limit(100);if(i){console.error("Failed to fetch my mentions:",i);return}const s=(t||[]).map(e=>e.id);let _=new Map;if(s.length>0){const{data:e}=await a.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",s).order("created_at",{ascending:!0});for(const r of e||[]){const o=r,p=o.from_user,u=o.notification_id;_.has(u)||_.set(u,[]),_.get(u).push({id:o.id,notification_id:u,from_username:p?.username||"未知",content:o.content,created_at:o.created_at})}}const f=(t||[]).map(e=>{const r=e.from_user,o=e.to_user,p=e.task,u=e.id,h=e.reply_count||0;return{id:u,from_user_id:e.from_user_id,from_username:r?.username||e.mentioned_username,to_user_id:e.to_user_id,to_username:o?.username||"未知",task_id:e.task_id,task_name:p?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:h,has_reply:h>0,created_at:e.created_at,replies:_.get(u)||[]}});b(f);const n=new Map;for(const e of f){n.has(e.progress_entry_id)||n.set(e.progress_entry_id,{progress_entry_id:e.progress_entry_id,task_id:e.task_id,task_name:e.task_name,note:e.note,created_at:e.created_at,mentioned_users:[],replies:[],has_reply:!1});const r=n.get(e.progress_entry_id);r.mentioned_users.includes(e.mentioned_username)||r.mentioned_users.push(e.mentioned_username);for(const o of e.replies)r.replies.some(p=>p.id===o.id)||r.replies.push(o);e.has_reply&&(r.has_reply=!0)}const c=Array.from(n.values()).sort((e,r)=>new Date(r.created_at).getTime()-new Date(e.created_at).getTime());k(c)}catch(t){console.error("Error fetching my mentions:",t)}finally{S(!1)}},[m]);d.useEffect(()=>{l()},[l]),d.useEffect(()=>{if(m.length===0)return;const t=m.map(s=>a.channel(`my-mentions-notif-${s}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`from_user_id=eq.${s}`},()=>{l()}).subscribe()),i=a.channel("my-mentions-replies").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{l()}).subscribe();return()=>{t.forEach(s=>a.removeChannel(s)),a.removeChannel(i)}},[m,l]);const E=y.filter(t=>!t.has_reply).length;return{mentions:g,groupedMentions:y,loading:M,unrepliedCount:E,refresh:l}}export{U as u};
