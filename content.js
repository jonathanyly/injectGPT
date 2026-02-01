(() => {
  // ---- Constants ----
  const BTN_ID = "injectgpt-settings-btn";
  const PANEL_ID = "injectgpt-settings-panel";
  
  // Available models
  const MODELS = [
    { value: "gpt-5-2", label: "GPT-5-2" },
    { value: "gpt-5-2-instant", label: "GPT-5-2 Instant" },
    { value: "gpt-5-2-thinking", label: "GPT-5-2 Thinking" },
    { value: "gpt-5-mini-thinking", label: "GPT-5 Thinking Mini (Alpha)" },
  ];

  // ---- Helpers ----
  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else n.setAttribute(k, v);
    }
    for (const c of children) n.appendChild(c);
    return n;
  }

  function injectInterceptor() {
    if (document.getElementById("chatgpt-translator-injector")) return;
    const script = document.createElement("script");
    script.id = "chatgpt-translator-injector";
    script.src = chrome.runtime.getURL("injector.js");
    (document.head || document.documentElement).appendChild(script);
  }

  function updateModel(model) {
    window.dispatchEvent(
      new CustomEvent("chatgpt-translator-update-model", {
        detail: { model },
      })
    );
  }

  function updateSystemPrompt(prompt) {
    window.dispatchEvent(
      new CustomEvent("chatgpt-translator-update-system-prompt", {
        detail: { prompt },
      })
    );
  }

  function updateDeveloperPrompt(prompt) {
    window.dispatchEvent(
      new CustomEvent("chatgpt-translator-update-developer-prompt", {
        detail: { prompt },
      })
    );
  }

  function ensureStyles() {
    if (document.getElementById("injectgpt-settings-styles")) return;

    const style = el("style", { id: "injectgpt-settings-styles" });
    style.textContent = `
      #${BTN_ID}{
        position:fixed;
        right:16px;
        bottom:16px;
        z-index:2147483647;
        border:0;
        padding:10px 12px;
        border-radius:999px;
        background:#111;
        color:#fff;
        font:600 13px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        cursor:pointer;
        box-shadow:0 10px 30px rgba(0,0,0,.25);
      }
      #${BTN_ID}:hover{ transform: translateY(-1px); }
      #${BTN_ID}:active{ transform: translateY(0px); }

      #${PANEL_ID}{
        position:fixed;
        inset:0;
        z-index:2147483647;
        display:none;
        background:rgba(0,0,0,.35);
        font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      #${PANEL_ID}.show{ display:block; }

      #${PANEL_ID} .box{
        position:absolute;
        right:16px;
        bottom:72px;
        width:min(520px, calc(100vw - 32px));
        background:#fff;
        color:#111;
        border-radius:16px;
        box-shadow:0 20px 60px rgba(0,0,0,.35);
        overflow:hidden;
      }

      #${PANEL_ID} .hdr{
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:12px 14px;
        border-bottom:1px solid #eee;
      }
      #${PANEL_ID} .hdr h3{
        margin:0;
        font-size:14px;
      }
      #${PANEL_ID} .close{
        border:0;
        background:transparent;
        font-size:18px;
        cursor:pointer;
        line-height:1;
        padding:6px 10px;
        border-radius:10px;
      }
      #${PANEL_ID} .close:hover{ background:#f3f3f3; }

      #${PANEL_ID} .body{ padding:14px; display:flex; flex-direction:column; gap:12px; }
      #${PANEL_ID} label{ font-size:12px; font-weight:700; display:block; margin-bottom:6px; }
      #${PANEL_ID} textarea{
        width:100%;
        min-height:92px;
        resize:vertical;
        padding:10px 12px;
        border-radius:12px;
        border:1px solid #ddd;
        font: 13px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        outline:none;
      }
      #${PANEL_ID} textarea:focus{ border-color:#999; }
      
      #${PANEL_ID} select{
        width:100%;
        padding:10px 12px;
        border-radius:12px;
        border:1px solid #ddd;
        font: 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        outline:none;
        background:#fff;
        cursor:pointer;
      }
      #${PANEL_ID} select:focus{ border-color:#999; }

      #${PANEL_ID} .actions{
        display:flex;
        gap:10px;
        justify-content:flex-end;
        padding:12px 14px;
        border-top:1px solid #eee;
        background:#fafafa;
      }
      #${PANEL_ID} .btn{
        border:0;
        border-radius:12px;
        padding:9px 12px;
        cursor:pointer;
        font:600 13px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      #${PANEL_ID} .btn.secondary{ background:#eee; }
      #${PANEL_ID} .btn.primary{ background:#111; color:#fff; }
      #${PANEL_ID} .hint{
        font-size:12px;
        color:#555;
        margin-top:6px;
      }
    `;
    document.documentElement.appendChild(style);
  }

  // ---- Storage helpers ----
  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }
  function storageSet(obj) {
    return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
  }

  // ---- UI ----
  async function ensureUI() {
    if (document.getElementById(BTN_ID) && document.getElementById(PANEL_ID)) return;

    ensureStyles();

    // Load saved values (with defaults)
    const saved = await storageGet(["systemPrompt", "developerPrompt", "selectedModel"]);
    const systemPrompt = typeof saved.systemPrompt === "string" ? saved.systemPrompt : "You are a helpful assistant.";
    const developerPrompt = typeof saved.developerPrompt === "string" ? saved.developerPrompt : "";
    const selectedModel = typeof saved.selectedModel === "string" ? saved.selectedModel : "gpt-5-2";

    // Button
    if (!document.getElementById(BTN_ID)) {
      const btn = el("button", { id: BTN_ID, type: "button", text: "⚙️ InjectGPT Settings" });
      btn.addEventListener("click", () => {
        const panel = document.getElementById(PANEL_ID);
        panel.classList.toggle("show");
      });
      document.documentElement.appendChild(btn);
    }

    // Panel
    if (!document.getElementById(PANEL_ID)) {
      // Model select
      const modelSelect = el("select");
      for (const model of MODELS) {
        const option = el("option", { value: model.value, text: model.label });
        if (model.value === selectedModel) {
          option.selected = true;
        }
        modelSelect.appendChild(option);
      }
      
      const sysTa = el("textarea");
      sysTa.value = systemPrompt;

      const devTa = el("textarea");
      devTa.value = developerPrompt;

      const panel = el("div", { id: PANEL_ID }, [
        el("div", { class: "box" }, [
          el("div", { class: "hdr" }, [
            el("h3", { text: "InjectGPT Settings" }),
            el("button", { class: "close", type: "button", text: "✕", title: "Close" }),
          ]),
          el("div", { class: "body" }, [
            el("div", {}, [
              el("label", { text: "Model" }),
              modelSelect,
              el("div", { class: "hint", text: "Select the GPT model to use." }),
            ]),
            el("div", {}, [
              el("label", { text: "System prompt" }),
              sysTa,
              el("div", { class: "hint", text: "Highest priority instruction for the assistant." }),
            ]),
            el("div", {}, [
              el("label", { text: "Developer prompt" }),
              devTa,
              el("div", { class: "hint", text: "Additional instruction after system, before user." }),
            ]),
          ]),
          el("div", { class: "actions" }, [
            el("button", { class: "btn secondary", type: "button", text: "Reset" }),
            el("button", { class: "btn primary", type: "button", text: "Save" }),
          ]),
        ]),
      ]);

      // Close interactions
      const closeBtn = panel.querySelector(".close");
      closeBtn.addEventListener("click", () => panel.classList.remove("show"));
      panel.addEventListener("click", (e) => {
        if (e.target === panel) panel.classList.remove("show");
      });

      // Buttons
      const [resetBtn, saveBtn] = panel.querySelectorAll(".actions .btn");

      resetBtn.addEventListener("click", async () => {
        modelSelect.value = "gpt-5-2";
        sysTa.value = "You are a helpful assistant.";
        devTa.value = "";
        await storageSet({ 
          selectedModel: modelSelect.value,
          systemPrompt: sysTa.value, 
          developerPrompt: devTa.value 
        });
        updateModel(modelSelect.value);
        updateSystemPrompt(sysTa.value);
        updateDeveloperPrompt(devTa.value);
      });

      saveBtn.addEventListener("click", async () => {
        const model = modelSelect.value;
        const sys = sysTa.value ?? "";
        const dev = devTa.value ?? "";
        await storageSet({ 
          selectedModel: model,
          systemPrompt: sys, 
          developerPrompt: dev 
        });
        updateModel(model);
        updateSystemPrompt(sys);
        updateDeveloperPrompt(dev);
        panel.classList.remove("show");
      });

      document.documentElement.appendChild(panel);

      // Push current settings to page context once injector is likely present
      setTimeout(() => {
        updateModel(selectedModel);
        updateSystemPrompt(sysTa.value);
        updateDeveloperPrompt(devTa.value);
      }, 300);
    }
  }

  // ---- Boot ----
  injectInterceptor();

  // Ensure UI now + keep it alive across SPA navigations
  ensureUI();
  const obs = new MutationObserver(() => ensureUI());
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();