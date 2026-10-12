const STORAGE_KEY = "composition-lab-115-1-v1";
const skills = ["分析思考", "創意思考", "系統思考", "韌性、彈性與敏捷", "動機與自我覺察", "好奇心與終生學習", "人工智慧與數據資料庫", "科技素養", "領導與社會影響力", "人才管理"];
let state = { currentStep: 0, selectedSkills: [], traits: [{}, {}, {}], actions: [{}, {}, {}] };

try { state = { ...state, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch (_) {}

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const panels = $$(".step-panel");
const navButtons = $$('[data-step-target]');
const saveStatus = $("#saveStatus");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveStatus.textContent = "儲存中…";
  clearTimeout(save.timer);
  save.timer = setTimeout(() => saveStatus.textContent = "已自動儲存", 350);
  updateProgress();
  updateConnection();
}

function bindSavedFields() {
  $$('[data-save]').forEach(el => {
    const key = el.dataset.save;
    if (el.type === "checkbox") el.checked = Boolean(state[key]);
    else el.value = state[key] || "";
    el.addEventListener("input", () => { state[key] = el.type === "checkbox" ? el.checked : el.value; save(); });
  });
}

function renderSkills() {
  const wrap = $("#skillChips");
  wrap.innerHTML = "";
  skills.forEach(skill => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = skill;
    button.setAttribute("aria-pressed", state.selectedSkills.includes(skill));
    button.addEventListener("click", () => {
      const selected = state.selectedSkills.includes(skill);
      if (!selected && state.selectedSkills.length >= 3) return alert("最多選擇三項核心技能。");
      state.selectedSkills = selected ? state.selectedSkills.filter(s => s !== skill) : [...state.selectedSkills, skill];
      renderSkills(); save();
    });
    wrap.append(button);
  });
}

function makeRepeatCard(item, index) {
  const card = document.createElement("div");
  card.className = "repeat-card";
  const fields = [["trait", "特質 能力或興趣"], ["scene", "出現在哪個情境"], ["evidence", "具體表現或回饋"], ["concept", "可連結的圖文概念"]];
  fields.forEach(([key, label]) => {
    const lab = document.createElement("label");
    lab.textContent = label;
    const input = document.createElement(key === "evidence" ? "textarea" : "input");
    if (input.tagName === "TEXTAREA") input.rows = 2;
    input.value = item[key] || "";
    input.addEventListener("input", () => { state.traits[index][key] = input.value; save(); });
    lab.append(input); card.append(lab);
  });
  const remove = document.createElement("button");
  remove.type = "button"; remove.className = "remove-row"; remove.textContent = "×"; remove.ariaLabel = "刪除此筆";
  remove.addEventListener("click", () => { if (state.traits.length > 1) { state.traits.splice(index, 1); renderTraits(); save(); } });
  card.append(remove); return card;
}

function renderTraits() {
  const wrap = $("#traitRows"); wrap.innerHTML = "";
  state.traits.forEach((item, index) => wrap.append(makeRepeatCard(item, index)));
}

function makeActionCard(item, index) {
  const card = document.createElement("div"); card.className = "action-card";
  const fields = [["action", "具體行動"], ["time", "時間與頻率"], ["help", "需要的協助"], ["proof", "完成的證據"]];
  fields.forEach(([key,label]) => {
    const lab = document.createElement("label"); lab.textContent = `${index + 1}  ${label}`;
    const input = document.createElement("textarea"); input.rows = 2; input.value = item[key] || "";
    input.addEventListener("input", () => { state.actions[index][key] = input.value; save(); });
    lab.append(input); card.append(lab);
  });
  const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove-row"; remove.textContent = "×"; remove.ariaLabel = "清除此步驟";
  remove.addEventListener("click", () => { state.actions[index] = {}; renderActions(); save(); });
  card.append(remove); return card;
}

function renderActions() {
  const wrap = $("#actionRows"); wrap.innerHTML = "";
  state.actions.forEach((item, index) => wrap.append(makeActionCard(item, index)));
}

function showStep(index) {
  state.currentStep = Math.max(0, Math.min(panels.length - 1, index));
  panels.forEach((panel, i) => panel.hidden = i !== state.currentStep);
  navButtons.forEach((btn, i) => {
    if (i === state.currentStep) {
      btn.setAttribute("aria-current", "step");
    } else {
      btn.removeAttribute("aria-current");
    }
  });
  $("#prevBtn").disabled = state.currentStep === 0;
  $("#nextBtn").textContent = state.currentStep === panels.length - 1 ? "回到第一步" : "下一步";
  $("#stepCounter").textContent = `${state.currentStep + 1} / ${panels.length}`;
  save();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateProgress() {
  const required = $$('[data-required]');
  const filled = required.filter(el => (state[el.dataset.save] || "").trim()).length;
  const skillPoint = state.selectedSkills.length ? 1 : 0;
  const traitPoint = state.traits.some(t => t.trait && t.evidence) ? 1 : 0;
  const actionPoint = state.actions.some(a => a.action && a.time) ? 1 : 0;
  const checks = [1,2,3,4,5].filter(i => state[`check${i}`]).length;
  const total = required.length + 3 + 5;
  const done = filled + skillPoint + traitPoint + actionPoint + checks;
  const percent = Math.round(done / total * 100);
  $("#progressBar").style.width = `${percent}%`;
  $("#progressText").textContent = `完成 ${percent}%`;
}

function updateConnection() {
  const insight = (state.storyInsight || "").trim();
  const direction = (state.futureDirection || "").trim();
  $("#connectionPreview").textContent = insight && direction
    ? `我從「${insight}」出發，準備朝「${direction}」前進。接著請檢查：你的選擇理由是否清楚連結了兩者？`
    : "完成第二步與第三步後，這裡會整理「現在的我」與「未來方向」之間的連結。";
}

function buildEvidence() {
  const background = state.storyBackground || "＿＿＿＿的經驗";
  const action = state.storyAction || "採取具體行動";
  const insight = state.storyInsight || "自己的特質與能力";
  state.evidenceSentence = `${background}，${action}。這段經驗讓我發現：${insight}。`;
  $('[data-save="evidenceSentence"]').value = state.evidenceSentence; save();
}

function buildThesis() {
  const insight = state.storyInsight || "更認識自己的特質";
  const direction = state.futureDirection || "嘗試新的方向";
  const action = state.actions.find(a => a.action)?.action || "具體行動";
  state.thesis = `現在的我，${insight}；因此我想${direction}，並準備透過${action}逐步實現。`;
  $('[data-save="thesis"]').value = state.thesis; save();
}

function withPeriod(text) {
  const value = (text || "").trim();
  if (!value) return "";
  return /[。！？；]$/.test(value) ? value : `${value}。`;
}

function actionSummary() {
  return state.actions
    .filter(a => a.action || a.time || a.help || a.proof)
    .map((a, index) => {
      const details = [a.time && `安排在${a.time}`, a.help && `並請${a.help}協助`, a.proof && `以${a.proof}檢查成果`].filter(Boolean).join("，");
      return `第${index + 1}步，我會${a.action || "採取具體行動"}${details ? `，${details}` : ""}`;
    }).join("；");
}

function outlineSuggestions() {
  const parallel = "我想認識現在的自己，我想看見未來的方向，我也想用一步一步的行動靠近理想。";
  const skillsText = state.selectedSkills.length ? `我特別注意到「${state.selectedSkills.join("、")}」這些能力。` : "";
  const background = (state.storyBackground || "").trim().replace(/^在/, "").replace(/[，。；]$/, "");
  const experienceLead = background && state.storyAction ? `在${background}的經驗中，${state.storyAction}` : (state.storyAction || background);
  const experienceText = `${withPeriod(experienceLead)}${withPeriod(state.storyResult && `最後，${state.storyResult}`)}${withPeriod(state.storyInsight && `這讓我更認識自己：${state.storyInsight}`)}`;
  return [
    `${parallel}${withPeriod(state.chartSentence || "圖文資料讓我開始思考：現在的選擇，會形塑未來的自己")}`,
    `${withPeriod(state.chartTopic && `這份圖文資料主要談到${state.chartTopic}`)}${withPeriod(state.chartRelation)}${skillsText}${withPeriod(state.chartConnection)}` || "圖文資料讓我看見現在的能力與未來發展之間的關係。",
    experienceText || "一次具體經驗，讓我更清楚看見自己的特質與能力。",
    `${withPeriod(state.futureDirection && `未來，我想${state.futureDirection}`)}${withPeriod(state.futureReason && `我做出這個選擇，是因為${state.futureReason}`)}${withPeriod(state.futureValue && `我重視的是${state.futureValue}`)}${withPeriod(state.futureHope && `我期待${state.futureHope}`)}` || "認識自己之後，我也逐漸看見想前往的方向。",
    `${withPeriod(actionSummary())}${withPeriod(state.adjustment && `遇到困難時，${state.adjustment}`)}${withPeriod(state.futureChallenge && `即使可能面對${state.futureChallenge}，我仍願意調整方法繼續前進`)}我相信，只要把想法化成具體行動，未來就會從現在慢慢展開。`
  ];
}

function importOutline(askBeforeReplace = true) {
  const hasOutline = [1,2,3,4,5].some(i => (state[`outline${i}`] || "").trim());
  if (askBeforeReplace && hasOutline && !confirm("帶入內容會取代目前五段提綱，確定要繼續嗎？")) return;
  outlineSuggestions().forEach((text, index) => {
    const key = `outline${index + 1}`;
    state[key] = text;
    const field = $(`[data-save="${key}"]`);
    if (field) field.value = text;
  });
  buildThesis();
  save();
}

function buildEssay() {
  if (![1,2,3,4,5].some(i => (state[`outline${i}`] || "").trim())) importOutline(false);
  const suggestions = outlineSuggestions();
  const paragraphs = [1,2,3,4,5].map((i, index) => (state[`outline${i}`] || suggestions[index]).trim());
  const parallelCount = (paragraphs[0].match(/我(?:也)?想/g) || []).length;
  if (parallelCount < 3) {
    paragraphs[0] = `我想認識現在的自己，我想看見未來的方向，我也想用一步一步的行動靠近理想。${paragraphs[0]}`;
  }
  state.articleDraft = paragraphs.join("\n\n");
  $('[data-save="articleDraft"]').value = state.articleDraft;
  save();
}

function textReport() {
  const traitText = state.traits.filter(t => Object.values(t).some(Boolean)).map((t,i) => `${i+1}. ${t.trait || ""}｜${t.scene || ""}｜${t.evidence || ""}｜${t.concept || ""}`).join("\n");
  const actionText = state.actions.map((a,i) => `${i+1}. ${a.action || ""}｜${a.time || ""}｜${a.help || ""}｜${a.proof || ""}`).join("\n");
  return `115 1 三年級一段作文互動學習單\n班級：${state.className || ""}　姓名：${state.studentName || ""}\n\n一 讀懂圖文資料\n主題：${state.chartTopic || ""}\n概念關係：${state.chartRelation || ""}\n選擇技能：${state.selectedSkills.join("、")}\n與我的連結：${state.chartConnection || ""}\n一句話：${state.chartSentence || ""}\n\n二 認識現在的自己\n${traitText}\n事情背景：${state.storyBackground || ""}\n我的行動：${state.storyAction || ""}\n結果與回饋：${state.storyResult || ""}\n自我認識：${state.storyInsight || ""}\n\n三 選擇未來方向\n方向：${state.futureDirection || ""}\n理由：${state.futureReason || ""}\n價值：${state.futureValue || ""}\n期待：${state.futureHope || ""}\n困難：${state.futureChallenge || ""}\n\n四 具體行動\n${actionText}\n調整方法：${state.adjustment || ""}\n\n五 五段提綱\n第一段：${state.outline1 || ""}\n第二段：${state.outline2 || ""}\n第三段：${state.outline3 || ""}\n第四段：${state.outline4 || ""}\n第五段：${state.outline5 || ""}\n主旨：${state.thesis || ""}\n\n六 完整作文\n${state.articleDraft || ""}\n`;
}

function downloadReport() {
  if (!(state.articleDraft || "").trim()) buildEssay();
  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const paragraphs = (state.articleDraft || "").split(/\n\s*\n/).filter(Boolean).map(text => `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>從現在的自己走向未來</title><style>@page{size:A4;margin:2.2cm}body{font-family:"Microsoft JhengHei",sans-serif;font-size:14pt;line-height:1.9;color:#222}h1{text-align:center;font-size:20pt}p{text-indent:2em;margin:0 0 1em}.info{text-indent:0;text-align:right;font-size:11pt;color:#555}</style></head><body><h1>從現在的自己走向未來</h1><p class="info">班級：${escapeHtml(state.className)}　姓名：${escapeHtml(state.studentName)}</p>${paragraphs}</body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.className || "班級"}_${state.studentName || "學生"}_從現在的自己走向未來.doc`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}

function resetAll() {
  if (!confirm("確定要清除這台裝置上的所有作答嗎？此動作無法復原。")) return;
  localStorage.removeItem(STORAGE_KEY); location.reload();
}

navButtons.forEach(btn => btn.addEventListener("click", () => showStep(Number(btn.dataset.stepTarget))));
$("#prevBtn").addEventListener("click", () => showStep(state.currentStep - 1));
$("#nextBtn").addEventListener("click", () => showStep(state.currentStep === panels.length - 1 ? 0 : state.currentStep + 1));
$("#addTrait").addEventListener("click", () => { state.traits.push({}); renderTraits(); save(); });
$("#buildEvidenceSentence").addEventListener("click", buildEvidence);
$("#buildThesis").addEventListener("click", buildThesis);
$("#importOutlineBtn").addEventListener("click", () => importOutline(true));
$("#buildEssayBtn").addEventListener("click", buildEssay);
$("#downloadBtn").addEventListener("click", downloadReport);
$("#printBtn").addEventListener("click", () => window.print());
$("#resetBtn").addEventListener("click", resetAll);

const dialog = $("#chartDialog");
$("#zoomChart").addEventListener("click", () => dialog.showModal());
$("#chartButton").addEventListener("click", () => dialog.showModal());
$("#closeChart").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

$("#finishBtn").addEventListener("click", () => {
  const checks = [1,2,3,4,5].filter(i => state[`check${i}`]).length;
  $("#finishMessage").textContent = checks === 5 ? "五項檢核都完成了，可以開始正式寫作。" : `你已完成 ${checks} 項檢核，再看看還能補強哪裡。`;
  if (checks === 5) $("#celebration").hidden = false;
});
$("#closeCelebration").addEventListener("click", () => $("#celebration").hidden = true);

renderSkills(); renderTraits(); renderActions(); bindSavedFields(); showStep(Number(state.currentStep) || 0); updateProgress(); updateConnection();
