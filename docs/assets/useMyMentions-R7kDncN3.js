import{r as n}from"./react-vendor-BKs11Bab.js";import{s as a}from"./index-o4KDgGFF.js";function v(){const[g,h]=n.useState([]),[f,k]=n.useState([]),[M,b]=n.useState(!0),[o,C]=n.useState(null);n.useEffect(()=>{a.auth.getSession().then(async({data:s})=>{const d=s.session?.user?.id||null;C(d)})},[]);const _=n.useCallback(async()=>{if(o)try{const{data:s,error:d}=await a.from("notifications").select(`
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
        `).eq("from_user_id",o).order("created_at",{ascending:!1}).limit(100);if(d){console.error("Failed to fetch my mentions:",d);return}const l=(s||[]).map(e=>e.id);let c=new Map;if(l.length>0){const{data:e}=await a.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",l).order("created_at",{ascending:!0});for(const t of e||[]){const r=t,u=r.from_user,i=r.notification_id;c.has(i)||c.set(i,[]),c.get(i).push({id:r.id,notification_id:i,from_username:u?.username||"未知",content:r.content,created_at:r.created_at})}}const p=(s||[]).map(e=>{const t=e.from_user,r=e.to_user,u=e.task,i=e.id,y=e.reply_count||0;return{id:i,from_user_id:e.from_user_id,from_username:t?.username||e.mentioned_username,to_user_id:e.to_user_id,to_username:r?.username||"未知",task_id:e.task_id,task_name:u?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:y,has_reply:y>0,created_at:e.created_at,replies:c.get(i)||[]}});h(p);const m=new Map;for(const e of p){m.has(e.progress_entry_id)||m.set(e.progress_entry_id,{progress_entry_id:e.progress_entry_id,task_id:e.task_id,task_name:e.task_name,note:e.note,created_at:e.created_at,mentioned_users:[],replies:[],has_reply:!1});const t=m.get(e.progress_entry_id);t.mentioned_users.includes(e.mentioned_username)||t.mentioned_users.push(e.mentioned_username);for(const r of e.replies)t.replies.some(u=>u.id===r.id)||t.replies.push(r);e.has_reply&&(t.has_reply=!0)}const S=Array.from(m.values()).sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());k(S)}catch(s){console.error("Error fetching my mentions:",s)}finally{b(!1)}},[o]);n.useEffect(()=>{_()},[_]),n.useEffect(()=>{if(!o)return;const s=a.channel(`my-mentions-notif-${o}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`from_user_id=eq.${o}`},()=>{_()}).subscribe(),d=a.channel("my-mentions-replies").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{_()}).subscribe();return()=>{a.removeChannel(s),a.removeChannel(d)}},[o,_]);const E=f.filter(s=>!s.has_reply).length;return{mentions:g,groupedMentions:f,loading:M,unrepliedCount:E,refresh:_}}export{v as u};
