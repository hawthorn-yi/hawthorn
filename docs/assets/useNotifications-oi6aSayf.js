import{r as a}from"./react-vendor-BKs11Bab.js";import{s}from"./index-8bPz1MVz.js";function x(){const[h,p]=a.useState([]),[w,C]=a.useState(!0),[U,y]=a.useState(0),[i,S]=a.useState(null);a.useEffect(()=>{s.auth.getSession().then(async({data:t})=>{const r=t.session?.user?.id||null;S(r)})},[]);const d=a.useCallback(async()=>{if(i)try{const{data:t,error:r}=await s.from("notifications").select(`
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
        `).eq("to_user_id",i).order("created_at",{ascending:!1}).limit(100);if(r){console.error("Failed to fetch notifications:",r);return}const c=(t||[]).map(e=>e.id);let o=new Map;if(c.length>0){const{data:e}=await s.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",c).order("created_at",{ascending:!0});for(const u of e||[]){const n=u,g=n.from_user,_=n.notification_id;o.has(_)||o.set(_,[]),o.get(_).push({id:n.id,notification_id:_,from_username:g?.username||"未知",content:n.content,created_at:n.created_at})}}const m=(t||[]).map(e=>{const u=e.from_user,n=e.task;return{id:e.id,from_user_id:e.from_user_id,from_username:u?.username||e.mentioned_username,to_user_id:e.to_user_id,task_id:e.task_id,task_name:n?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:e.reply_count||0,created_at:e.created_at,replies:o.get(e.id)||[]}});p(m),y(m.filter(e=>!e.is_read).length)}catch(t){console.error("Error fetching notifications:",t)}finally{C(!1)}},[i]);a.useEffect(()=>{d()},[d]),a.useEffect(()=>{if(!i)return;const t=s.channel(`notifications-realtime-${i}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`to_user_id=eq.${i}`},()=>{d()}).subscribe(),r=s.channel("notifications-replies-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{d()}).subscribe();return()=>{s.removeChannel(t),s.removeChannel(r)}},[i,d]);const q=a.useCallback(async t=>{p(r=>r.map(c=>c.id===t?{...c,is_read:!0}:c)),y(r=>Math.max(0,r-1)),await s.from("notifications").update({is_read:!0}).eq("id",t)},[]),E=a.useCallback(async()=>{i&&(p(t=>t.map(r=>({...r,is_read:!0}))),y(0),await s.from("notifications").update({is_read:!0}).eq("to_user_id",i).eq("is_read",!1))},[i]),I=a.useCallback(async(t,r,c,o)=>{const m=i,e="用户";if(!m||!o.trim())return;const u=crypto.randomUUID(),n=new Date().toISOString();p(f=>f.map(l=>l.id!==t?l:{...l,is_read:!0,reply_count:l.reply_count+1,replies:[...l.replies,{id:u,notification_id:t,from_username:e,content:o.trim(),created_at:n}]})),y(f=>Math.max(0,f-1)),await s.from("mention_replies").insert({id:u,notification_id:t,progress_entry_id:r,from_user_id:m,content:o.trim()});const{data:g}=await s.from("notifications").select("reply_count").eq("id",t).single(),_=g?.reply_count||0;await s.from("notifications").update({reply_count:_+1,is_read:!0}).eq("id",t);const N=crypto.randomUUID(),k=h.find(f=>f.id===t),b=k?.from_username||"用户";if(!k||!b)return;const R=`${e} 回复了 @${b}: ${o.trim()}`;await s.from("progress_entries").insert({id:N,task_id:c,timestamp:n,progress:0,note:R,username:e})},[h]);return{notifications:h,loading:w,unreadCount:U,markAsRead:q,markAllAsRead:E,addReply:I,refresh:d}}export{x as u};
