import{r as o}from"./react-vendor-yb0GR-CG.js";import{s as i}from"./index-D6BPdwHU.js";import{t as I}from"./ui-vendor-p-tr_I-7.js";function q(){const[m,p]=o.useState([]),[h,k]=o.useState([]),[M,C]=o.useState(!0),[d,v]=o.useState(null);o.useEffect(()=>{i.auth.getSession().then(async({data:r})=>{const n=r.session?.user?.id||null;v(n)})},[]);const l=o.useCallback(r=>{const n=new Map;for(const e of r){n.has(e.progress_entry_id)||n.set(e.progress_entry_id,{progress_entry_id:e.progress_entry_id,task_id:e.task_id,task_name:e.task_name,note:e.note,created_at:e.created_at,mentioned_users:[],replies:[],has_reply:!1,dismissed:!1});const t=n.get(e.progress_entry_id);t.mentioned_users.includes(e.mentioned_username)||t.mentioned_users.push(e.mentioned_username);for(const s of e.replies)t.replies.some(f=>f.id===s.id)||t.replies.push(s);e.has_reply&&(t.has_reply=!0),e.dismissed&&(t.dismissed=!0)}const a=Array.from(n.values()).sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());k(a)},[]),_=o.useCallback(async()=>{if(d)try{const{data:r,error:n}=await i.from("notifications").select(`
          id,
          from_user_id,
          to_user_id,
          task_id,
          progress_entry_id,
          note,
          mentioned_username,
          is_read,
          reply_count,
          dismissed,
          created_at,
          from_user:from_user_id ( username ),
          to_user:to_user_id ( username ),
          task:task_id ( name )
        `).eq("from_user_id",d).order("created_at",{ascending:!1}).limit(100);if(n){console.error("Failed to fetch my mentions:",n);return}const a=(r||[]).map(s=>s.id);let e=new Map;if(a.length>0){const{data:s}=await i.from("mention_replies").select(`
            id,
            notification_id,
            content,
            created_at,
            from_user:from_user_id ( username )
          `).in("notification_id",a).order("created_at",{ascending:!0});for(const f of s||[]){const c=f,g=c.from_user,u=c.notification_id;e.has(u)||e.set(u,[]),e.get(u).push({id:c.id,notification_id:u,from_username:g?.username||"未知",content:c.content,created_at:c.created_at})}}const t=(r||[]).map(s=>{const f=s.from_user,c=s.to_user,g=s.task,u=s.id,y=s.reply_count||0,b=s.dismissed||!1;return{id:u,from_user_id:s.from_user_id,from_username:f?.username||s.mentioned_username,to_user_id:s.to_user_id,to_username:c?.username||"未知",task_id:s.task_id,task_name:g?.name||"未知任务",progress_entry_id:s.progress_entry_id,note:s.note,mentioned_username:s.mentioned_username,is_read:s.is_read||!1,reply_count:y,has_reply:y>0||b,dismissed:b,created_at:s.created_at,replies:e.get(u)||[]}});p(t),l(t)}catch(r){console.error("Error fetching my mentions:",r)}finally{C(!1)}},[d,l]);o.useEffect(()=>{_()},[_]),o.useEffect(()=>{if(!d)return;const r=i.channel(`my-mentions-notif-${d}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`from_user_id=eq.${d}`},()=>{_()}).subscribe(),n=i.channel("my-mentions-replies").on("postgres_changes",{event:"INSERT",schema:"public",table:"mention_replies"},()=>{_()}).subscribe(),a=i.channel("my-mentions-dismiss").on("postgres_changes",{event:"UPDATE",schema:"public",table:"notifications",filter:`from_user_id=eq.${d}`},()=>{_()}).subscribe();return()=>{i.removeChannel(r),i.removeChannel(n),i.removeChannel(a)}},[d,_]);const w=o.useCallback(async r=>{const n=m.filter(t=>t.progress_entry_id===r).map(t=>t.id);if(n.length===0)return;const a=m.map(t=>t.progress_entry_id===r?{...t,dismissed:!0,has_reply:!0}:t);p(a),l(a);const{error:e}=await i.from("notifications").update({dismissed:!0,is_read:!0}).in("id",n);e&&(console.error("Failed to dismiss mention:",e),I.error("操作失败，请重试"),p(m),l(m))},[m,l]),E=h.filter(r=>!r.has_reply).length,S=h.length;return{mentions:m,groupedMentions:h,loading:M,unrepliedCount:E,totalCount:S,dismissMention:w,refresh:_}}export{q as u};
