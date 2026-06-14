import{r as n}from"./react-vendor-BKs11Bab.js";import{s as d}from"./index-Bnf1pS_T.js";function U(){const[y,h]=n.useState([]),[m,k]=n.useState([]),[M,b]=n.useState(!0),[a,w]=n.useState(null);n.useEffect(()=>{d.auth.getSession().then(({data:s})=>w(s.session?.user?.id||null))},[]);const i=n.useCallback(async()=>{if(a)try{const{data:s,error:f}=await d.from("notifications").select(`
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
        `).eq("from_user_id",a).order("created_at",{ascending:!1}).limit(100);if(f){console.error("Failed to fetch my mentions:",f);return}const l=(s||[]).map(e=>e.id);let u=new Map;if(l.length>0){const{data:e}=await d.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",l).order("created_at",{ascending:!0});for(const t of e||[]){const r=t,_=r.from_user,o=r.notification_id;u.has(o)||u.set(o,[]),u.get(o).push({id:r.id,notification_id:o,from_username:_?.username||"未知",content:r.content,created_at:r.created_at})}}const p=(s||[]).map(e=>{const t=e.from_user,r=e.to_user,_=e.task,o=e.id,g=e.reply_count||0;return{id:o,from_user_id:e.from_user_id,from_username:t?.username||e.mentioned_username,to_user_id:e.to_user_id,to_username:r?.username||"未知",task_id:e.task_id,task_name:_?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:g,has_reply:g>0,created_at:e.created_at,replies:u.get(o)||[]}});h(p);const c=new Map;for(const e of p){c.has(e.progress_entry_id)||c.set(e.progress_entry_id,{progress_entry_id:e.progress_entry_id,task_id:e.task_id,task_name:e.task_name,note:e.note,created_at:e.created_at,mentioned_users:[],replies:[],has_reply:!1});const t=c.get(e.progress_entry_id);t.mentioned_users.includes(e.mentioned_username)||t.mentioned_users.push(e.mentioned_username);for(const r of e.replies)t.replies.some(_=>_.id===r.id)||t.replies.push(r);e.has_reply&&(t.has_reply=!0)}const S=Array.from(c.values()).sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());k(S)}catch(s){console.error("Error fetching my mentions:",s)}finally{b(!1)}},[a]);n.useEffect(()=>{i()},[i]),n.useEffect(()=>{if(!a)return;const s=d.channel("my-mentions-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{i()}).subscribe();return()=>{d.removeChannel(s)}},[a,i]);const E=m.filter(s=>!s.has_reply).length;return{mentions:y,groupedMentions:m,loading:M,unrepliedCount:E,refresh:i}}export{U as u};
