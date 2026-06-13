import{r,s}from"./index-CXKGRFPQ.js";function M(){const[g,p]=r.useState([]),[U,b]=r.useState(!0),[C,y]=r.useState(0),[a,S]=r.useState(null);r.useEffect(()=>{s.auth.getSession().then(({data:t})=>S(t.session?.user?.id||null))},[]);const _=r.useCallback(async()=>{if(a)try{const{data:t,error:i}=await s.from("notifications").select(`
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
        `).eq("to_user_id",a).order("created_at",{ascending:!1}).limit(100);if(i){console.error("Failed to fetch notifications:",i);return}const c=(t||[]).map(e=>e.id);let n=new Map;if(c.length>0){const{data:e}=await s.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",c).order("created_at",{ascending:!0});for(const d of e||[]){const o=d,h=o.from_user,u=o.notification_id;n.has(u)||n.set(u,[]),n.get(u).push({id:o.id,notification_id:u,from_username:h?.username||"未知",content:o.content,created_at:o.created_at})}}const f=(t||[]).map(e=>{const d=e.from_user,o=e.task;return{id:e.id,from_user_id:e.from_user_id,from_username:d?.username||e.mentioned_username,to_user_id:e.to_user_id,task_id:e.task_id,task_name:o?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:e.reply_count||0,created_at:e.created_at,replies:n.get(e.id)||[]}});p(f),y(f.filter(e=>!e.is_read).length)}catch(t){console.error("Error fetching notifications:",t)}finally{b(!1)}},[a]);r.useEffect(()=>{_()},[_]),r.useEffect(()=>{if(!a)return;const t=s.channel("notifications-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`to_user_id=eq.${a}`},()=>{_()}).subscribe();return()=>{s.removeChannel(t)}},[a,_]);const q=r.useCallback(async t=>{p(i=>i.map(c=>c.id===t?{...c,is_read:!0}:c)),y(i=>Math.max(0,i-1)),await s.from("notifications").update({is_read:!0}).eq("id",t)},[]),E=r.useCallback(async()=>{a&&(p(t=>t.map(i=>({...i,is_read:!0}))),y(0),await s.from("notifications").update({is_read:!0}).eq("to_user_id",a).eq("is_read",!1))},[a]),I=r.useCallback(async(t,i,c,n)=>{const f=a,e="用户";if(!f||!n.trim())return;const d=crypto.randomUUID(),o=new Date().toISOString();p(m=>m.map(l=>l.id!==t?l:{...l,is_read:!0,reply_count:l.reply_count+1,replies:[...l.replies,{id:d,notification_id:t,from_username:e,content:n.trim(),created_at:o}]})),y(m=>Math.max(0,m-1)),await s.from("mention_replies").insert({id:d,notification_id:t,progress_entry_id:i,from_user_id:f,content:n.trim()});const{data:h}=await s.from("notifications").select("reply_count").eq("id",t).single(),u=h?.reply_count||0;await s.from("notifications").update({reply_count:u+1,is_read:!0}).eq("id",t);const N=crypto.randomUUID(),k=g.find(m=>m.id===t),w=k?.from_username||"用户";if(!k||!w)return;const x=`${e} 回复了 @${w}: ${n.trim()}`;await s.from("progress_entries").insert({id:N,task_id:c,timestamp:o,progress:0,note:x,username:e})},[g]);return{notifications:g,loading:U,unreadCount:C,markAsRead:q,markAllAsRead:E,addReply:I,refresh:_}}export{M as u};
