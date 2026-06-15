import{r as o}from"./react-vendor-BKs11Bab.js";import{s as a}from"./index-C2A13YZv.js";function x(){const[h,p]=o.useState([]),[w,U]=o.useState(!0),[S,y]=o.useState(0),[n,C]=o.useState([]);o.useEffect(()=>{a.auth.getSession().then(async({data:t})=>{const r=t.session?.user?.id||null;if(!r)return;const s=[r];try{const{data:i}=await a.from("user_roles").select("display_name").eq("user_id",r).maybeSingle();if(i){const u=i.display_name;if(u){const{data:e}=await a.from("app_users").select("id").eq("username",u).maybeSingle();if(e){const c=e.id;c&&c!==r&&s.push(c)}}}}catch{}C(s)})},[]);const _=o.useCallback(async()=>{if(n.length!==0)try{const{data:t,error:r}=await a.from("notifications").select(`
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
        `).in("to_user_id",n).order("created_at",{ascending:!1}).limit(100);if(r){console.error("Failed to fetch notifications:",r);return}const s=(t||[]).map(e=>e.id);let i=new Map;if(s.length>0){const{data:e}=await a.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",s).order("created_at",{ascending:!0});for(const c of e||[]){const d=c,g=d.from_user,m=d.notification_id;i.has(m)||i.set(m,[]),i.get(m).push({id:d.id,notification_id:m,from_username:g?.username||"未知",content:d.content,created_at:d.created_at})}}const u=(t||[]).map(e=>{const c=e.from_user,d=e.task;return{id:e.id,from_user_id:e.from_user_id,from_username:c?.username||e.mentioned_username,to_user_id:e.to_user_id,task_id:e.task_id,task_name:d?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:e.reply_count||0,created_at:e.created_at,replies:i.get(e.id)||[]}});p(u),y(u.filter(e=>!e.is_read).length)}catch(t){console.error("Error fetching notifications:",t)}finally{U(!1)}},[n]);o.useEffect(()=>{_()},[_]),o.useEffect(()=>{if(n.length===0)return;const t=n.map(s=>a.channel(`notifications-realtime-${s}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`to_user_id=eq.${s}`},()=>{_()}).subscribe()),r=a.channel("notifications-replies-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{_()}).subscribe();return()=>{t.forEach(s=>a.removeChannel(s)),a.removeChannel(r)}},[n,_]);const E=o.useCallback(async t=>{p(r=>r.map(s=>s.id===t?{...s,is_read:!0}:s)),y(r=>Math.max(0,r-1)),await a.from("notifications").update({is_read:!0}).eq("id",t)},[]),q=o.useCallback(async()=>{n.length!==0&&(p(t=>t.map(r=>({...r,is_read:!0}))),y(0),await a.from("notifications").update({is_read:!0}).in("to_user_id",n).eq("is_read",!1))},[n]),I=o.useCallback(async(t,r,s,i)=>{const u=n.length>0?n[0]:null,e="用户";if(!u||!i.trim())return;const c=crypto.randomUUID(),d=new Date().toISOString();p(l=>l.map(f=>f.id!==t?f:{...f,is_read:!0,reply_count:f.reply_count+1,replies:[...f.replies,{id:c,notification_id:t,from_username:e,content:i.trim(),created_at:d}]})),y(l=>Math.max(0,l-1)),await a.from("mention_replies").insert({id:c,notification_id:t,progress_entry_id:r,from_user_id:u,content:i.trim()});const{data:g}=await a.from("notifications").select("reply_count").eq("id",t).single(),m=g?.reply_count||0;await a.from("notifications").update({reply_count:m+1,is_read:!0}).eq("id",t);const N=crypto.randomUUID(),b=h.find(l=>l.id===t),k=b?.from_username||"用户";if(!b||!k)return;const R=`${e} 回复了 @${k}: ${i.trim()}`;await a.from("progress_entries").insert({id:N,task_id:s,timestamp:d,progress:0,note:R,username:e})},[h]);return{notifications:h,loading:w,unreadCount:S,markAsRead:E,markAllAsRead:q,addReply:I,refresh:_}}export{x as u};
