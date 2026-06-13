import{r as n}from"./react-vendor-BKs11Bab.js";import{g as k,s as a}from"./index-BTOWYxpw.js";function M(){const[g,p]=n.useState([]),[b,C]=n.useState(!0),[q,y]=n.useState(0),i=k()?.id,u=n.useCallback(async()=>{if(i)try{const{data:t,error:r}=await a.from("notifications").select(`
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
        `).eq("to_user_id",i).order("created_at",{ascending:!1}).limit(100);if(r){console.error("Failed to fetch notifications:",r);return}const c=(t||[]).map(e=>e.id);let o=new Map;if(c.length>0){const{data:e}=await a.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",c).order("created_at",{ascending:!0});for(const d of e||[]){const s=d,h=s.from_user,_=s.notification_id;o.has(_)||o.set(_,[]),o.get(_).push({id:s.id,notification_id:_,from_username:h?.username||"未知",content:s.content,created_at:s.created_at})}}const m=(t||[]).map(e=>{const d=e.from_user,s=e.task;return{id:e.id,from_user_id:e.from_user_id,from_username:d?.username||e.mentioned_username,to_user_id:e.to_user_id,task_id:e.task_id,task_name:s?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:e.reply_count||0,created_at:e.created_at,replies:o.get(e.id)||[]}});p(m),y(m.filter(e=>!e.is_read).length)}catch(t){console.error("Error fetching notifications:",t)}finally{C(!1)}},[i]);n.useEffect(()=>{u()},[u]),n.useEffect(()=>{if(!i)return;const t=a.channel("notifications-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`to_user_id=eq.${i}`},()=>{u()}).subscribe();return()=>{a.removeChannel(t)}},[i,u]);const S=n.useCallback(async t=>{p(r=>r.map(c=>c.id===t?{...c,is_read:!0}:c)),y(r=>Math.max(0,r-1)),await a.from("notifications").update({is_read:!0}).eq("id",t)},[]),E=n.useCallback(async()=>{i&&(p(t=>t.map(r=>({...r,is_read:!0}))),y(0),await a.from("notifications").update({is_read:!0}).eq("to_user_id",i).eq("is_read",!1))},[i]),N=n.useCallback(async(t,r,c,o)=>{const m=k()?.id,e=k()?.username||"未知";if(!m||!o.trim())return;const d=crypto.randomUUID(),s=new Date().toISOString();p(f=>f.map(l=>l.id!==t?l:{...l,is_read:!0,reply_count:l.reply_count+1,replies:[...l.replies,{id:d,notification_id:t,from_username:e,content:o.trim(),created_at:s}]})),y(f=>Math.max(0,f-1)),await a.from("mention_replies").insert({id:d,notification_id:t,progress_entry_id:r,from_user_id:m,content:o.trim()});const{data:h}=await a.from("notifications").select("reply_count").eq("id",t).single(),_=h?.reply_count||0;await a.from("notifications").update({reply_count:_+1,is_read:!0}).eq("id",t);const x=crypto.randomUUID(),w=g.find(f=>f.id===t),U=w?.from_username||"用户";if(!w||!U)return;const A=`${e} 回复了 @${U}: ${o.trim()}`;await a.from("progress_entries").insert({id:x,task_id:c,timestamp:s,progress:0,note:A,username:e})},[g]);return{notifications:g,loading:b,unreadCount:q,markAsRead:S,markAllAsRead:E,addReply:N,refresh:u}}export{M as u};
