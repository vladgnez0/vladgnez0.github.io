const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[s]));
}

function toast(title, text=""){
  const t = $("#toast");
  if(!t) return;
  t.innerHTML = `<strong>${escapeHtml(title)}</strong>${text ? `<div class="muted">${escapeHtml(text)}</div>` : ""}`;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>t.classList.remove("show"), 2600);
}

function debounce(fn, ms){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), ms);
  };
}

function formatDate(iso){
  const [y,m,d] = iso.split("-").map(Number);
  return `${String(d).padStart(2,"0")}.${String(m).padStart(2,"0")}.${y}`;
}

function uniq(arr){ return Array.from(new Set(arr)); }

/* Theme */
function getTheme(){ return localStorage.getItem("theme") || "light"; }
function setTheme(theme){
  document.documentElement.dataset.theme = (theme === "dark") ? "dark" : "light";
  localStorage.setItem("theme", (theme === "dark") ? "dark" : "light");
}
function setupTheme(){
  setTheme(getTheme());
  $("#btnTheme")?.addEventListener("click", ()=>{
    setTheme(getTheme() === "dark" ? "light" : "dark");
    toast("Тема изменена", getTheme() === "dark" ? "Тёмная" : "Светлая");
  });
}

/* Mobile menu */
function setupMenu(){
  const btn = $("#btnMenu");
  const nav = $("#siteNav");
  const ov = $("#navOverlay");
  if(!btn || !nav || !ov) return;

  const close = ()=>{
    nav.classList.remove("open");
    ov.classList.remove("show");
  };
  btn.addEventListener("click", ()=>{
    const open = nav.classList.toggle("open");
    ov.classList.toggle("show", open);
  });
  ov.addEventListener("click", close);
  window.addEventListener("resize", ()=>{
    if(window.matchMedia("(min-width: 921px)").matches){
      close();
    }
  });
  // close on navigation click
  nav.addEventListener("click", (e)=>{
    const a = e.target.closest("a");
    if(a) close();
  });
}

/* Nav active per page */
function setActiveNav(){
  const page = document.body.dataset.page;
  $$(".navlink").forEach(a => a.classList.toggle("active", a.dataset.page === page));
}

/* Common header text */
function renderHeaderProfile(){
  const p = window.SITE_PROFILE || {};
  $$(".js-teacher-name").forEach(el => el.textContent = p.teacherName || "Учитель информатики");
  $(".js-role") && ($(".js-role").textContent = p.role || "Учитель информатики");
}

/* Footer year */
function setYear(){
  $("#year") && ($("#year").textContent = new Date().getFullYear());
}

/* Announcement rotation */
function initAnnouncement(){
  const el = $("#announceText");
  if(!el) return;
  const arr = window.ANNOUNCEMENTS || [];
  if(!arr.length){ el.textContent = "—"; return; }

  const start = Number(localStorage.getItem("announce_i") || "0") % arr.length;
  el.textContent = arr[start];

  $("#btnRotateAnnouncement")?.addEventListener("click", ()=>{
    const i = Number(localStorage.getItem("announce_i") || "0");
    const next = (i + 1) % arr.length;
    localStorage.setItem("announce_i", String(next));
    el.textContent = arr[next];
  });
}

/* GLOBAL SEARCH */
function collectSearchIndex(){
  const items = [];
  const add = (type, title, desc, url, tags=[]) => items.push({ type, title, desc, url, tags });

  (window.MATERIALS || []).forEach(m=>{
    add("Материал", m.title, `${m.topic} • классы: ${m.grade.join(", ")} • ${formatDate(m.date)}`, `materials.html#${m.id}`, [m.topic, ...(m.tags||[])]);
  });
  (window.PROJECTS || []).forEach((p, i)=>{
    add("Проект", p.title, `Класс: ${p.grade}`, `projects.html#p${i}`, p.tags||[]);
  });
  (window.NEWS || []).forEach((n, i)=>{
    add("Новость", n.title, `${formatDate(n.date)} • ${(n.tags||[]).join(", ")}`, `news.html#n${i}`, n.tags||[]);
  });
  (window.NORMS || []).forEach((d, i)=>{
    add("Документ", d.title, d.desc, `norms.html#d${i}`, []);
  });
  (window.RESOURCES?.platforms || []).forEach((r, i)=>{
    add("Ресурс", r.title, "Образовательная платформа", `resources.html#plat${i}`, []);
  });

  return items;
}

function setupSearchModal(){
  const overlay = $("#overlay");
  const modal = $("#searchModal");
  if(!overlay || !modal) return;

  const input = $("#siteSearch");
  const results = $("#searchResults");
  const hint = $("#searchHint");

  const index = collectSearchIndex();

  function close(){
    overlay.classList.remove("show");
    modal.classList.remove("show");
  }
  function open(){
    overlay.classList.add("show");
    modal.classList.add("show");
    input.value = "";
    results.innerHTML = "";
    hint.style.display = "block";
    setTimeout(()=>input.focus(), 0);
  }

  $("#btnSearch")?.addEventListener("click", open);
  $("#btnSearch2")?.addEventListener("click", open);
  $("#closeSearch")?.addEventListener("click", close);
  overlay.addEventListener("click", close);

  document.addEventListener("keydown", (e)=>{
    const tag = document.activeElement?.tagName;
    const inField = ["INPUT","TEXTAREA","SELECT"].includes(tag);
    if(e.key === "/" && !inField){
      e.preventDefault();
      open();
    }
    if(e.key === "Escape" && modal.classList.contains("show")){
      close();
    }
  });

  function render(items){
    results.innerHTML = "";
    if(!items.length){
      results.innerHTML = `<div class="result"><p class="rd">Ничего не найдено. Попробуйте другой запрос.</p></div>`;
      return;
    }
    for(const x of items.slice(0, 12)){
      const el = document.createElement("div");
      el.className = "result";
      el.innerHTML = `
        <div class="badge">
          <span class="tag">${escapeHtml(x.type)}</span>
          ${x.tags?.slice(0,2).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("") || ""}
        </div>
        <p class="rt">${escapeHtml(x.title)}</p>
        <p class="rd">${escapeHtml(x.desc || "")}</p>
        <div class="meta" style="margin-top:10px;">
          <div class="small">Открыть</div>
          <a class="a-btn primary" href="${escapeHtml(x.url)}">Перейти</a>
        </div>
      `;
      results.appendChild(el);
    }
  }

  input.addEventListener("input", debounce(()=>{
    const q = input.value.trim().toLowerCase();
    if(!q){
      hint.style.display = "block";
      results.innerHTML = "";
      return;
    }
    hint.style.display = "none";
    const out = index.filter(x=>{
      const hay = `${x.type} ${x.title} ${x.desc} ${(x.tags||[]).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
    render(out);
  }, 80));
}

/* MATERIALS page */
function materialTypeLabel(type){
  return ({
    lesson: "Конспект",
    worksheet: "Рабочий лист",
    presentation: "Презентация",
    lab: "Практикум",
    checklist: "Памятка"
  }[type] || "Материал");
}

function buildTopicChips(){
  const wrap = $("#topicChips");
  if(!wrap) return;
  const topics = uniq((window.MATERIALS || []).map(m => m.topic)).sort((a,b)=>a.localeCompare(b,'ru'));
  wrap.innerHTML = "";

  const addChip = (label, value, active=false)=>{
    const c = document.createElement("div");
    c.className = "chip" + (active ? " active" : "");
    c.dataset.topic = value;
    c.textContent = label;
    wrap.appendChild(c);
  };

  addChip("Все темы", "all", true);
  topics.forEach(t=>addChip(t, t, false));

  const saved = localStorage.getItem("topic") || "all";
  $$(".chip", wrap).forEach(ch => ch.classList.toggle("active", ch.dataset.topic === saved));
  if(!$(".chip.active", wrap)) $(".chip[data-topic='all']", wrap).classList.add("active");

  wrap.addEventListener("click", (e)=>{
    const chip = e.target.closest(".chip");
    if(!chip) return;
    $$(".chip", wrap).forEach(x=>x.classList.remove("active"));
    chip.classList.add("active");
    localStorage.setItem("topic", chip.dataset.topic);
    applyMaterialsFilters();
  });
}
function getActiveTopic(){
  return $("#topicChips .chip.active")?.dataset.topic || "all";
}

function renderMaterials(items){
  const list = $("#materialsList");
  const empty = $("#materialsEmpty");
  if(!list || !empty) return;

  list.innerHTML = "";
  if(!items.length){ empty.style.display = "block"; return; }
  empty.style.display = "none";

  for(const m of items){
    const grades = (m.grade && m.grade.length && m.grade[0] !== 0) ? [...m.grade].sort((a,b)=>a-b).join(", ") : "—";
    const tags = (m.tags||[]).slice(0,4).map(t=>`<span class="tag">#${escapeHtml(t)}</span>`).join(" ");

    const el = document.createElement("article");
    el.className = "item";
    el.id = m.id;
    el.innerHTML = `
      <div class="badge">
        <span class="tag">${escapeHtml(materialTypeLabel(m.type))}</span>
        <span class="tag">${escapeHtml(m.topic)}</span>
        <span class="tag">PDF</span>
      </div>
      <h3>${escapeHtml(m.title)}</h3>
      <p>${escapeHtml(m.desc)}</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">${tags}</div>
      <div class="meta">
        <div class="small">Класс(ы): ${escapeHtml(grades)} • ${escapeHtml(formatDate(m.date))}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <a class="a-btn primary" href="${escapeHtml(m.link)}" target="_blank" rel="noopener">Открыть / скачать</a>
          <button class="a-btn" type="button" data-copy="${escapeHtml(location.href.split('#')[0] + '#' + m.id)}">Ссылка</button>
        </div>
      </div>
    `;
    list.appendChild(el);
  }

  list.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button[data-copy]");
    if(!btn) return;
    try{ await navigator.clipboard.writeText(btn.dataset.copy); toast("Ссылка скопирована"); }
    catch{ toast("Не удалось скопировать", "Скопируйте вручную."); }
  }, { once:true });
}

function applyMaterialsFilters(){
  const q = ($("#q")?.value || "").trim().toLowerCase();
  const grade = $("#grade")?.value || "all";
  const type = $("#type")?.value || "all";
  const topic = getActiveTopic();

  const filtered = (window.MATERIALS || [])
    .filter(m=>{
      if(grade !== "all"){
        const g = Number(grade);
        if(!(m.grade || []).includes(g)) return false;
      }
      if(type !== "all" && m.type !== type) return false;
      if(topic !== "all" && m.topic !== topic) return false;
      if(q){
        const hay = [m.title, m.desc, m.topic, materialTypeLabel(m.type), (m.tags||[]).join(" "), (m.grade||[]).join(" ")].join(" ").toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a,b)=> b.date.localeCompare(a.date));

  renderMaterials(filtered);
}

function setupMaterialsPage(){
  if(document.body.dataset.page !== "materials") return;
  buildTopicChips();
  applyMaterialsFilters();
  $("#q")?.addEventListener("input", debounce(applyMaterialsFilters, 80));
  $("#grade")?.addEventListener("change", applyMaterialsFilters);
  $("#type")?.addEventListener("change", applyMaterialsFilters);
  $("#btnReset")?.addEventListener("click", ()=>{
    $("#q").value = "";
    $("#grade").value = "all";
    $("#type").value = "all";
    localStorage.setItem("topic","all");
    $$("#topicChips .chip").forEach(x=>x.classList.toggle("active", x.dataset.topic === "all"));
    applyMaterialsFilters();
    toast("Фильтры сброшены");
  });
}

/* PROJECTS page */
function setupProjectsPage(){
  if(document.body.dataset.page !== "projects") return;
  const list = $("#projectsList");
  if(!list) return;

  list.innerHTML = "";
  (window.PROJECTS || []).forEach((p, i)=>{
    const tags = (p.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(" ");
    const el = document.createElement("article");
    el.className = "item";
    el.id = `p${i}`;
    el.innerHTML = `
      <div class="badge">
        <span class="tag">Проект</span>
        <span class="tag">Класс: ${escapeHtml(p.grade)}</span>
      </div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.desc)}</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">${tags}</div>
      <div class="meta">
        <div class="small">Идея для портфолио</div>
        <a class="a-btn primary" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">Открыть материалы</a>
      </div>
    `;
    list.appendChild(el);
  });
}

/* PARENTS page */
function setupParentsPage(){
  if(document.body.dataset.page !== "parents") return;
  const wrap = $("#parentsAccordion");
  if(!wrap) return;

  wrap.innerHTML = "";
  (window.PARENTS_FAQ || []).forEach((x, idx)=>{
    const d = document.createElement("details");
    d.open = idx === 0;
    d.innerHTML = `
      <summary>
        <span>${escapeHtml(x.q)}</span>
        <span style="display:flex; gap:10px; align-items:center;">
          <span class="tag">FAQ</span>
          <span class="chev">▾</span>
        </span>
      </summary>
      <div class="details-body">
        ${escapeHtml(x.a)}
        <div class="callout">Можно скачать памятку для родителей в разделе «Материалы → Родителям».</div>
      </div>
    `;
    wrap.appendChild(d);
  });

  // show quick download
  const dl = $("#parentsDownload");
  if(dl){
    const m = (window.MATERIALS || []).find(x=>x.id==="m12");
    if(m){
      dl.innerHTML = `
        <a class="btn primary" style="text-decoration:none;" href="${escapeHtml(m.link)}" target="_blank" rel="noopener">📄 Скачать памятку для родителей (PDF)</a>
      `;
    }
  }
}

/* CONTACTS page */
function renderContactsProfile(){
  const p = window.SITE_PROFILE || {};
  $("#emailText") && ($("#emailText").textContent = p.email || "—");
  $("#phoneText") && ($("#phoneText").textContent = p.phone || "—");
  $("#schoolText") && ($("#schoolText").textContent = p.school || "—");

  const socialsWrap = $("#socialsText");
  if(socialsWrap){
    const arr = p.socials || [];
    socialsWrap.innerHTML = arr.map(s => `
      <div style="margin:6px 0;">
        <a class="a-btn" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">🔗 ${escapeHtml(s.title)}</a>
      </div>
    `).join("") || "—";
  }
}

function setupContactForm(){
  const form = $("#contactForm");
  if(!form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = $("#name")?.value.trim() || "";
    const contact = $("#contact")?.value.trim() || "";
    const reason = $("#reason")?.value || "other";
    const msg = $("#message")?.value.trim() || "";

    const reasonLabel = ({
      question: "Вопрос по уроку/домашнему",
      project: "Проект/олимпиада",
      parent: "Родителям",
      other: "Другое"
    })[reason] || "Сообщение";

    const text =
`Кому: ${window.SITE_PROFILE?.teacherName || "Учитель информатики"}
Тема: ${reasonLabel}

От: ${name}
Контакт: ${contact}

Сообщение:
${msg}`;

    $("#previewText").textContent = text;
    $("#contactPreview").style.display = "block";
    toast("Сообщение сформировано", "Можно скопировать и отправить.");
  });

  $("#btnCopyMessage")?.addEventListener("click", async ()=>{
    try{ await navigator.clipboard.writeText($("#previewText").textContent || ""); toast("Скопировано"); }
    catch{ toast("Не удалось скопировать", "Выделите текст и скопируйте вручную."); }
  });
}

/* ABOUT page */
function setupAboutPage(){
  if(document.body.dataset.page !== "about") return;
  const p = window.SITE_PROFILE || {};
  $("#teacherPhoto") && ($("#teacherPhoto").src = p.photo || "assets/img/teacher.svg");
  $("#siteGoal") && ($("#siteGoal").textContent = p.siteGoal || "—");
  $("#bioShort") && ($("#bioShort").textContent = p.bioShort || "—");

  const renderList = (id, arr) => {
    const el = $(id);
    if(!el) return;
    el.innerHTML = (arr||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("") || "<li>—</li>";
  };

  renderList("#eduList", p.education);
  renderList("#qualList", p.qualifications);
  renderList("#hobbyList", p.hobbies);

  $("#aboutKvSchool") && ($("#aboutKvSchool").textContent = p.school || "—");
  $("#aboutKvEmail") && ($("#aboutKvEmail").textContent = p.email || "—");
  $("#aboutKvPhone") && ($("#aboutKvPhone").textContent = p.phone || "—");
}

/* NEWS page */
function setupNewsPage(){
  if(document.body.dataset.page !== "news") return;
  const list = $("#newsList");
  if(!list) return;

  const items = (window.NEWS || []).slice().sort((a,b)=> b.date.localeCompare(a.date));
  list.innerHTML = "";
  items.forEach((n, i)=>{
    const tags = (n.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(" ");
    const el = document.createElement("article");
    el.className = "item";
    el.id = `n${i}`;
    el.innerHTML = `
      <div class="badge">
        <span class="tag">Новость</span>
        <span class="tag">${escapeHtml(formatDate(n.date))}</span>
      </div>
      <h3>${escapeHtml(n.title)}</h3>
      <p>${escapeHtml(n.text)}</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">${tags}</div>
      <div class="meta">
        <div class="small">Обновление: ${escapeHtml(formatDate(n.date))}</div>
        <button class="a-btn" type="button" data-copy="${escapeHtml(location.href.split('#')[0] + '#n' + i)}">Ссылка</button>
      </div>
    `;
    list.appendChild(el);
  });

  list.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button[data-copy]");
    if(!btn) return;
    try{ await navigator.clipboard.writeText(btn.dataset.copy); toast("Ссылка скопирована"); }
    catch{ toast("Не удалось скопировать"); }
  }, { once:true });
}

/* NORMS page */
function setupNormsPage(){
  if(document.body.dataset.page !== "norms") return;
  const list = $("#normsList");
  if(!list) return;

  list.innerHTML = "";
  (window.NORMS || []).forEach((d, i)=>{
    const el = document.createElement("article");
    el.className = "item";
    el.id = `d${i}`;
    el.innerHTML = `
      <div class="badge"><span class="tag">Нормативный документ</span></div>
      <h3>${escapeHtml(d.title)}</h3>
      <p>${escapeHtml(d.desc)}</p>
      <div class="meta">
        <div class="small">Внешняя ссылка</div>
        <a class="a-btn primary" href="${escapeHtml(d.url)}" target="_blank" rel="noopener">Открыть</a>
      </div>
    `;
    list.appendChild(el);
  });

  // printable docs
  const prints = $("#printables");
  if(prints){
    const printableIds = ["m3","m4","m5","m12","m13"];
    const cards = printableIds.map(id => (window.MATERIALS||[]).find(x=>x.id===id)).filter(Boolean);
    prints.innerHTML = cards.map(m=>`
      <div class="item" style="min-height:auto;">
        <div class="badge"><span class="tag">Скачать и распечатать</span><span class="tag">PDF</span></div>
        <h3>${escapeHtml(m.title)}</h3>
        <p>${escapeHtml(m.desc)}</p>
        <div class="meta">
          <div class="small">${escapeHtml(m.topic)}</div>
          <a class="a-btn primary" href="${escapeHtml(m.link)}" target="_blank" rel="noopener">Скачать</a>
        </div>
      </div>
    `).join("");
  }
}

/* RESOURCES page */
function setupResourcesPage(){
  if(document.body.dataset.page !== "resources") return;
  const plat = $("#platformsList");
  const col = $("#colleaguesList");
  if(plat){
    plat.innerHTML = (window.RESOURCES?.platforms || []).map((r,i)=>`
      <div class="item" id="plat${i}" style="min-height:auto;">
        <div class="badge"><span class="tag">Платформа</span></div>
        <h3>${escapeHtml(r.title)}</h3>
        <p class="muted">Образовательный ресурс</p>
        <div class="meta">
          <div class="small">Внешняя ссылка</div>
          <a class="a-btn primary" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">Открыть</a>
        </div>
      </div>
    `).join("");
  }
  if(col){
    col.innerHTML = (window.RESOURCES?.colleagues || []).map((r,i)=>`
      <div class="item" style="min-height:auto;">
        <div class="badge"><span class="tag">Сайт коллег</span></div>
        <h3>${escapeHtml(r.title)}</h3>
        <p class="muted">Добавьте реальные ссылки на коллег или МО</p>
        <div class="meta">
          <div class="small">Ссылка</div>
          <a class="a-btn primary" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">Открыть</a>
        </div>
      </div>
    `).join("");
  }

  const forT = $("#forTeachers");
  if(forT){
    forT.innerHTML = (window.RESOURCES?.forTeachers || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("") || "<li>—</li>";
  }
  const forP = $("#forParents");
  if(forP){
    forP.innerHTML = (window.RESOURCES?.forParents || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("") || "<li>—</li>";
  }
}

/* ACHIEVEMENTS page */
function setupAchievementsPage(){
  if(document.body.dataset.page !== "achievements") return;
  const t = $("#achTeacher");
  const s = $("#achStudents");
  if(t){
    t.innerHTML = (window.ACHIEVEMENTS?.teacher || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("") || "<li>—</li>";
  }
  if(s){
    s.innerHTML = (window.ACHIEVEMENTS?.students || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("") || "<li>—</li>";
  }
}

/* TOOLS page: quiz + password generator */
function setupToolsPage(){
  if(document.body.dataset.page !== "tools") return;
  setupQuizTool();
  setupPasswordTool();
}

function setupQuizTool(){
  const select = $("#quizSelect");
  const area = $("#quizArea");
  if(!select || !area) return;

  const quizzes = window.TOOLS?.quizzes || [];
  select.innerHTML = quizzes.map(q=>`<option value="${escapeHtml(q.id)}">${escapeHtml(q.title)}</option>`).join("") || `<option value="">Нет доступных тестов</option>`;

  function renderQuiz(id){
    const qz = quizzes.find(x=>x.id === id);
    if(!qz){ area.innerHTML = `<p class="muted">Тест не найден.</p>`; return; }

    const html = `
      <div class="qcard">
        <div class="badge"><span class="tag">Онлайн‑тест</span></div>
        <h3>${escapeHtml(qz.title)}</h3>
        <p class="muted" style="margin:0;">${escapeHtml(qz.desc || "")}</p>
      </div>
      <form id="quizForm" class="quiz" style="margin-top:12px;">
        ${qz.questions.map((qq, i)=>`
          <div class="qcard">
            <h3>${i+1}. ${escapeHtml(qq.q)}</h3>
            ${qq.options.map((opt, j)=>`
              <label class="opt">
                <input type="radio" name="q${i}" value="${j}" required />
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join("")}
          </div>
        `).join("")}
        <button class="btn primary" type="submit">Проверить</button>
        <div id="scoreBox" style="display:none; margin-top:10px;"></div>
      </form>
    `;
    area.innerHTML = html;

    $("#quizForm").addEventListener("submit", (e)=>{
      e.preventDefault();
      let score = 0;
      qz.questions.forEach((qq, i)=>{
        const v = Number((document.querySelector(`input[name="q${i}"]:checked`) || {}).value);
        if(v === qq.correct) score += 1;
      });
      const total = qz.questions.length;
      const pct = Math.round((score/total)*100);
      const box = $("#scoreBox");
      box.style.display = "block";
      box.innerHTML = `<div class="score"><b>Результат:</b> ${score} из ${total} (${pct}%).</div>`;
      toast("Готово", `Результат: ${score}/${total}`);
    });
  }

  const first = quizzes[0]?.id || "";
  if(first) renderQuiz(first);
  select.addEventListener("change", ()=> renderQuiz(select.value));
}

function setupPasswordTool(){
  const out = $("#pwOut");
  if(!out) return;

  const len = $("#pwLen");
  const lenVal = $("#pwLenVal");
  const optUpper = $("#pwUpper");
  const optLower = $("#pwLower");
  const optDigits = $("#pwDigits");
  const optSymbols = $("#pwSymbols");
  const btnGen = $("#pwGen");
  const btnCopy = $("#pwCopy");
  const strength = $("#pwStrength");

  const chars = {
    upper: "ABCDEFGHJKLMNPQRSTUVWXYZ", // без похожих I/O
    lower: "abcdefghijkmnpqrstuvwxyz", // без l/o
    digits: "23456789", // без 0/1
    symbols: "!@#$%^&*()-_=+[]{};:,.?"
  };

  function buildPool(){
    let pool = "";
    if(optUpper.checked) pool += chars.upper;
    if(optLower.checked) pool += chars.lower;
    if(optDigits.checked) pool += chars.digits;
    if(optSymbols.checked) pool += chars.symbols;
    return pool;
  }

  function randomString(n, pool){
    const arr = new Uint32Array(n);
    crypto.getRandomValues(arr);
    let s = "";
    for(let i=0;i<n;i++){
      s += pool[arr[i] % pool.length];
    }
    return s;
  }

  function calcStrength(pw){
    let score = 0;
    if(pw.length >= 12) score += 2;
    if(pw.length >= 16) score += 1;
    if(/[A-Z]/.test(pw)) score += 1;
    if(/[a-z]/.test(pw)) score += 1;
    if(/[0-9]/.test(pw)) score += 1;
    if(/[^A-Za-z0-9]/.test(pw)) score += 1;

    if(score <= 3) return { label: "слабый", tag: "⚠️" };
    if(score <= 5) return { label: "нормальный", tag: "✅" };
    return { label: "сильный", tag: "🟢" };
  }

  function updateLen(){
    lenVal.textContent = len.value;
  }

  function generate(){
    const pool = buildPool();
    if(!pool){
      toast("Выберите набор символов", "Отметьте хотя бы один пункт.");
      return;
    }
    const pw = randomString(Number(len.value), pool);
    out.value = pw;
    const st = calcStrength(pw);
    strength.textContent = `${st.tag} Надёжность: ${st.label}`;
  }

  updateLen();
  len.addEventListener("input", updateLen);
  [optUpper,optLower,optDigits,optSymbols].forEach(x=>x.addEventListener("change", ()=> {
    // защита от «все выключили»
    if(!optUpper.checked && !optLower.checked && !optDigits.checked && !optSymbols.checked){
      optLower.checked = true;
    }
  }));

  btnGen.addEventListener("click", generate);
  btnCopy.addEventListener("click", async ()=>{
    try{
      await navigator.clipboard.writeText(out.value || "");
      toast("Пароль скопирован");
    }catch{
      toast("Не удалось скопировать", "Скопируйте вручную.");
    }
  });

  // auto-generate on load
  generate();
}

/* INIT */
function init(){
  setupTheme();
  setupMenu();
  setActiveNav();
  renderHeaderProfile();
  setYear();
  setupSearchModal();

  // Page-specific
  initAnnouncement();
  setupAboutPage();
  setupMaterialsPage();
  setupProjectsPage();
  setupParentsPage();
  setupNewsPage();
  setupNormsPage();
  setupResourcesPage();
  setupAchievementsPage();

  if(document.body.dataset.page === "contacts"){
    renderContactsProfile();
    setupContactForm();
  }
  setupToolsPage();
}

document.addEventListener("DOMContentLoaded", init);