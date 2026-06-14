import{r as _}from"./react-vendor-BKs11Bab.js";import{s as d}from"./index-DjhrSjBc.js";function C(){const[h,k]=_.useState([]),[y,M]=_.useState([]),[b,w]=_.useState(!0),[m,S]=_.useState([]);_.useEffect(()=>{d.auth.getSession().then(async({data:s})=>{const c=s.session?.user?.id||null;if(!c)return;const a=[c];try{const{data:o}=await d.from("user_roles").select("display_name").eq("user_id",c).maybeSingle();if(o){const r=o.display_name;if(r){const{data:i}=await d.from("app_users").select("id").eq("username",r).maybeSingle();if(i){const e=i.id;e&&e!==c&&a.push(e)}}}const l=s.session?.user?.email?.split("@")[0]||"";if(l&&a.length<2){const{data:r}=await d.from("app_users").select("id").eq("username",l).maybeSingle();if(r){const i=r.id;i&&!a.includes(i)&&a.push(i)}}}catch{}S(a)})},[]);const f=_.useCallback(async()=>{if(m.length!==0)try{const{data:s,error:c}=await d.from("notifications").select(`
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
        `).in("from_user_id",m).order("created_at",{ascending:!1}).limit(100);if(c){console.error("Failed to fetch my mentions:",c);return}const a=(s||[]).map(e=>e.id);let o=new Map;if(a.length>0){const{data:e}=await d.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",a).order("created_at",{ascending:!0});for(const t of e||[]){const n=t,p=n.from_user,u=n.notification_id;o.has(u)||o.set(u,[]),o.get(u).push({id:n.id,notification_id:u,from_username:p?.username||"未知",content:n.content,created_at:n.created_at})}}const l=(s||[]).map(e=>{const t=e.from_user,n=e.to_user,p=e.task,u=e.id,g=e.reply_count||0;return{id:u,from_user_id:e.from_user_id,from_username:t?.username||e.mentioned_username,to_user_id:e.to_user_id,to_username:n?.username||"未知",task_id:e.task_id,task_name:p?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:g,has_reply:g>0,created_at:e.created_at,replies:o.get(u)||[]}});k(l);const r=new Map;for(const e of l){r.has(e.progress_entry_id)||r.set(e.progress_entry_id,{progress_entry_id:e.progress_entry_id,task_id:e.task_id,task_name:e.task_name,note:e.note,created_at:e.created_at,mentioned_users:[],replies:[],has_reply:!1});const t=r.get(e.progress_entry_id);t.mentioned_users.includes(e.mentioned_username)||t.mentioned_users.push(e.mentioned_username);for(const n of e.replies)t.replies.some(p=>p.id===n.id)||t.replies.push(n);e.has_reply&&(t.has_reply=!0)}const i=Array.from(r.values()).sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());M(i)}catch(s){console.error("Error fetching my mentions:",s)}finally{w(!1)}},[m]);_.useEffect(()=>{f()},[f]),_.useEffect(()=>{if(m.length===0)return;const s=d.channel("my-mentions-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{f()}).subscribe();return()=>{d.removeChannel(s)}},[m,f]);const E=y.filter(s=>!s.has_reply).length;return{mentions:h,groupedMentions:y,loading:b,unrepliedCount:E,refresh:f}}export{C as u};
