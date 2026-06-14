import{r as o}from"./react-vendor-BKs11Bab.js";import{s as i}from"./index-BTd1oc-V.js";function D(){const[M,S]=o.useState([]),[h,U]=o.useState([]),[b,w]=o.useState(!0),[m,E]=o.useState(null),[y,g]=o.useState(null);o.useEffect(()=>{i.auth.getSession().then(async({data:t})=>{const r=t.session?.user?.id||null;if(E(r),!r)return;const{data:f}=await i.from("user_roles").select("user_id").eq("user_id",r).maybeSingle();if(f){g(r);return}const l=t.session?.user?.email||"",_=t.session?.user?.user_metadata?.display_name||"",{data:d}=await i.from("app_users").select("id, username").or(`username.eq.${l.split("@")[0]},username.eq.${_}`).maybeSingle();g(d?d.id:r)})},[]);const u=o.useCallback(async()=>{const t=y||m;if(t)try{const{data:r,error:f}=await i.from("notifications").select(`
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
        `).eq("from_user_id",t).order("created_at",{ascending:!1}).limit(100);if(f){console.error("Failed to fetch my mentions:",f);return}const l=(r||[]).map(e=>e.id);let _=new Map;if(l.length>0){const{data:e}=await i.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",l).order("created_at",{ascending:!0});for(const s of e||[]){const n=s,c=n.from_user,a=n.notification_id;_.has(a)||_.set(a,[]),_.get(a).push({id:n.id,notification_id:a,from_username:c?.username||"未知",content:n.content,created_at:n.created_at})}}const d=(r||[]).map(e=>{const s=e.from_user,n=e.to_user,c=e.task,a=e.id,k=e.reply_count||0;return{id:a,from_user_id:e.from_user_id,from_username:s?.username||e.mentioned_username,to_user_id:e.to_user_id,to_username:n?.username||"未知",task_id:e.task_id,task_name:c?.name||"未知任务",progress_entry_id:e.progress_entry_id,note:e.note,mentioned_username:e.mentioned_username,is_read:e.is_read||!1,reply_count:k,has_reply:k>0,created_at:e.created_at,replies:_.get(a)||[]}});S(d);const p=new Map;for(const e of d){p.has(e.progress_entry_id)||p.set(e.progress_entry_id,{progress_entry_id:e.progress_entry_id,task_id:e.task_id,task_name:e.task_name,note:e.note,created_at:e.created_at,mentioned_users:[],replies:[],has_reply:!1});const s=p.get(e.progress_entry_id);s.mentioned_users.includes(e.mentioned_username)||s.mentioned_users.push(e.mentioned_username);for(const n of e.replies)s.replies.some(c=>c.id===n.id)||s.replies.push(n);e.has_reply&&(s.has_reply=!0)}const q=Array.from(p.values()).sort((e,s)=>new Date(s.created_at).getTime()-new Date(e.created_at).getTime());U(q)}catch(r){console.error("Error fetching my mentions:",r)}finally{w(!1)}},[m,y]);o.useEffect(()=>{u()},[u]),o.useEffect(()=>{if(!m&&!y)return;const t=i.channel("my-mentions-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{u()}).subscribe();return()=>{i.removeChannel(t)}},[m,u]);const I=h.filter(t=>!t.has_reply).length;return{mentions:M,groupedMentions:h,loading:b,unrepliedCount:I,refresh:u}}export{D as u};
