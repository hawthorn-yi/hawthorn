import{r as i}from"./react-vendor-BKs11Bab.js";import{s}from"./index-BTd1oc-V.js";function M(){const[U,g]=i.useState([]),[S,I]=i.useState(!0),[C,h]=i.useState(0),[d,E]=i.useState(null),[_,k]=i.useState(null);i.useEffect(()=>{s.auth.getSession().then(async({data:t})=>{const r=t.session?.user?.id||null;if(E(r),!r)return;const{data:a}=await s.from("user_roles").select("user_id").eq("user_id",r).maybeSingle();if(a){k(r);return}const o=t.session?.user?.email||"",n=t.session?.user?.user_metadata?.display_name||"",{data:c}=await s.from("app_users").select("id, username").or(`username.eq.${o.split("@")[0]},username.eq.${n}`).maybeSingle();k(c?c.id:r)})},[]);const l=i.useCallback(async()=>{const t=_||d;if(t)try{const{data:r,error:a}=await s.from("notifications").select(`
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
          task:task_id ( name )
        `).eq("to_user_id",t).order("created_at",{ascending:!1}).limit(100);if(a){console.error("Failed to fetch notifications:",a);return}const o=(r||[]).map(e=>e.id);let n=new Map;if(o.length>0){const{data:e}=await s.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",o).order("created_at",{ascending:!0});for(const m of e||[]){const u=m,q=u.from_user,f=u.notification_id;n.has(f)||n.set(f,[]),n.get(f).push({id:u.id,notification_id:f,from_username:q?.username||"未知",content:u.content,created_at:u.created_at})}}const c=(r||[]).map(e=>{const m=e.from_user,u=e.task;return{id:e.id,from_user_id:e.from_user_id,from_username:m?.username||e.mentioned_username,to_user_id:e.to_user_id,task_id:e.task_id,task_name:u?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:e.reply_count||0,created_at:e.created_at,replies:n.get(e.id)||[]}});g(c),h(c.filter(e=>!e.is_read).length)}catch(r){console.error("Error fetching notifications:",r)}finally{I(!1)}},[d,_]);i.useEffect(()=>{l()},[l]),i.useEffect(()=>{const t=_||d;if(!t)return;const r=s.channel("notifications-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`to_user_id=eq.${t}`},()=>{l()}).subscribe();return()=>{s.removeChannel(r)}},[d,_,l]);const N=i.useCallback(async t=>{g(r=>r.map(a=>a.id===t?{...a,is_read:!0}:a)),h(r=>Math.max(0,r-1)),await s.from("notifications").update({is_read:!0}).eq("id",t)},[]),$=i.useCallback(async()=>{const t=_||d;t&&(g(r=>r.map(a=>({...a,is_read:!0}))),h(0),await s.from("notifications").update({is_read:!0}).eq("to_user_id",t).eq("is_read",!1))},[d,_]),R=i.useCallback(async(t,r,a,o)=>{const n=d,c="用户";if(!n||!o.trim())return;const e=crypto.randomUUID(),m=new Date().toISOString();g(p=>p.map(y=>y.id!==t?y:{...y,is_read:!0,reply_count:y.reply_count+1,replies:[...y.replies,{id:e,notification_id:t,from_username:c,content:o.trim(),created_at:m}]})),h(p=>Math.max(0,p-1)),await s.from("mention_replies").insert({id:e,notification_id:t,progress_entry_id:r,from_user_id:n,content:o.trim()});const{data:u}=await s.from("notifications").select("reply_count").eq("id",t).single(),q=u?.reply_count||0;await s.from("notifications").update({reply_count:q+1,is_read:!0}).eq("id",t);const f=crypto.randomUUID(),w=U.find(p=>p.id===t),b=w?.from_username||"用户";if(!w||!b)return;const v=`${c} 回复了 @${b}: ${o.trim()}`;await s.from("progress_entries").insert({id:f,task_id:a,timestamp:m,progress:0,note:v,username:c})},[U]);return{notifications:U,loading:S,unreadCount:C,markAsRead:N,markAllAsRead:$,addReply:R,refresh:l}}export{M as u};
