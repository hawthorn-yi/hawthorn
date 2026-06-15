import{r as _}from"./react-vendor-BKs11Bab.js";import{s as i}from"./index-C2A13YZv.js";function U(){const[g,k]=_.useState([]),[h,b]=_.useState([]),[M,S]=_.useState(!0),[u,w]=_.useState([]);_.useEffect(()=>{i.auth.getSession().then(async({data:s})=>{const o=s.session?.user?.id||null;if(!o)return;const r=[o];try{const{data:a}=await i.from("user_roles").select("display_name").eq("user_id",o).maybeSingle();if(a){const f=a.display_name;if(f){const{data:c}=await i.from("app_users").select("id").eq("username",f).maybeSingle();if(c){const l=c.id;l&&l!==o&&r.push(l)}}}}catch{}w(r)})},[]);const m=_.useCallback(async()=>{if(u.length!==0)try{const{data:s,error:o}=await i.from("notifications").select(`
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
        `).in("from_user_id",u).order("created_at",{ascending:!1}).limit(100);if(o){console.error("Failed to fetch my mentions:",o);return}const r=(s||[]).map(e=>e.id);let a=new Map;if(r.length>0){const{data:e}=await i.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",r).order("created_at",{ascending:!0});for(const t of e||[]){const n=t,p=n.from_user,d=n.notification_id;a.has(d)||a.set(d,[]),a.get(d).push({id:n.id,notification_id:d,from_username:p?.username||"未知",content:n.content,created_at:n.created_at})}}const f=(s||[]).map(e=>{const t=e.from_user,n=e.to_user,p=e.task,d=e.id,y=e.reply_count||0;return{id:d,from_user_id:e.from_user_id,from_username:t?.username||e.mentioned_username,to_user_id:e.to_user_id,to_username:n?.username||"未知",task_id:e.task_id,task_name:p?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:y,has_reply:y>0,created_at:e.created_at,replies:a.get(d)||[]}});k(f);const c=new Map;for(const e of f){c.has(e.progress_entry_id)||c.set(e.progress_entry_id,{progress_entry_id:e.progress_entry_id,task_id:e.task_id,task_name:e.task_name,note:e.note,created_at:e.created_at,mentioned_users:[],replies:[],has_reply:!1});const t=c.get(e.progress_entry_id);t.mentioned_users.includes(e.mentioned_username)||t.mentioned_users.push(e.mentioned_username);for(const n of e.replies)t.replies.some(p=>p.id===n.id)||t.replies.push(n);e.has_reply&&(t.has_reply=!0)}const l=Array.from(c.values()).sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());b(l)}catch(s){console.error("Error fetching my mentions:",s)}finally{S(!1)}},[u]);_.useEffect(()=>{m()},[m]),_.useEffect(()=>{if(u.length===0)return;const s=u.map(r=>i.channel(`my-mentions-notif-${r}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`from_user_id=eq.${r}`},()=>{m()}).subscribe()),o=i.channel("my-mentions-replies").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{m()}).subscribe();return()=>{s.forEach(r=>i.removeChannel(r)),i.removeChannel(o)}},[u,m]);const E=h.filter(s=>!s.has_reply).length;return{mentions:g,groupedMentions:h,loading:M,unrepliedCount:E,refresh:m}}export{U as u};
