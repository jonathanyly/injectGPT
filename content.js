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

  // Default profile
  const DEFAULT_PROFILE = {
    id: "default",
    name: "Default",
    systemPrompt: "You are a helpful assistant.",
    developerPrompt: ""
  };

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

  function generateId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function injectInterceptor() {
    if (document.getElementById("chatgpt-injector")) return;
    const script = document.createElement("script");
    script.id = "chatgpt-injector";
    script.src = chrome.runtime.getURL("injector.js");
    (document.head || document.documentElement).appendChild(script);
  }

  function updateModel(model) {
    window.dispatchEvent(
      new CustomEvent("chatgpt-update-model", {
        detail: { model },
      })
    );
  }

  function updateSystemPrompt(prompt) {
    window.dispatchEvent(
      new CustomEvent("chatgpt-update-system-prompt", {
        detail: { prompt },
      })
    );
  }

  function updateDeveloperPrompt(prompt) {
    window.dispatchEvent(
      new CustomEvent("chatgpt-update-developer-prompt", {
        detail: { prompt },
      })
    );
  }

  function updateEnabled(enabled) {
    window.dispatchEvent(
      new CustomEvent("chatgpt-update-enabled", {
        detail: { enabled },
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
        transition: background 0.2s;
      }
      #${BTN_ID}:hover{ transform: translateY(-1px); }
      #${BTN_ID}:active{ transform: translateY(0px); }
      #${BTN_ID}.disabled{ background:#666; }

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
        max-height:calc(100vh - 100px);
        background:#fff;
        color:#111;
        border-radius:16px;
        box-shadow:0 20px 60px rgba(0,0,0,.35);
        overflow:hidden;
        display:flex;
        flex-direction:column;
      }

      #${PANEL_ID} .hdr{
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:12px 14px;
        border-bottom:1px solid #eee;
        flex-shrink:0;
      }
      #${PANEL_ID} .hdr h3{
        margin:0;
        font-size:14px;
      }
      #${PANEL_ID} .hdr-right{
        display:flex;
        align-items:center;
        gap:8px;
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

      #${PANEL_ID} .toggle-container{
        display:flex;
        align-items:center;
        gap:8px;
      }
      #${PANEL_ID} .toggle-label{
        font-size:12px;
        font-weight:600;
        color:#555;
      }
      #${PANEL_ID} .toggle{
        position:relative;
        width:44px;
        height:24px;
        background:#ccc;
        border-radius:24px;
        cursor:pointer;
        transition:background 0.2s;
      }
      #${PANEL_ID} .toggle.on{ background:#22c55e; }
      #${PANEL_ID} .toggle::after{
        content:'';
        position:absolute;
        top:2px;
        left:2px;
        width:20px;
        height:20px;
        background:#fff;
        border-radius:50%;
        transition:transform 0.2s;
        box-shadow:0 1px 3px rgba(0,0,0,.2);
      }
      #${PANEL_ID} .toggle.on::after{ transform:translateX(20px); }

      #${PANEL_ID} .body{ 
        padding:14px; 
        display:flex; 
        flex-direction:column; 
        gap:12px;
        overflow-y:auto;
        flex:1;
      }
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
      
      #${PANEL_ID} input[type="text"]{
        width:100%;
        padding:10px 12px;
        border-radius:12px;
        border:1px solid #ddd;
        font: 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        outline:none;
      }
      #${PANEL_ID} input[type="text"]:focus{ border-color:#999; }

      #${PANEL_ID} .actions{
        display:flex;
        gap:10px;
        justify-content:flex-end;
        padding:12px 14px;
        border-top:1px solid #eee;
        background:#fafafa;
        flex-shrink:0;
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
      #${PANEL_ID} .btn.danger{ background:#fee2e2; color:#dc2626; border:1px solid #fecaca; transition: background 0.15s; }
      #${PANEL_ID} .btn.danger:hover{ background:#fecaca; }
      #${PANEL_ID} .btn.danger:disabled{ background:#f5f5f5; color:#ccc; border-color:#eee; }
      #${PANEL_ID} .btn:disabled{ opacity:0.5; cursor:not-allowed; }
      #${PANEL_ID} .hint{
        font-size:12px;
        color:#555;
        margin-top:6px;
      }
      
      #${PANEL_ID} .profile-section{
        background:#f8f8f8;
        border-radius:12px;
        padding:12px;
        display:flex;
        flex-direction:column;
        gap:10px;
      }
      #${PANEL_ID} .profile-row{
        display:flex;
        gap:8px;
        align-items:center;
      }
      #${PANEL_ID} .profile-row select{
        flex:1;
      }
      #${PANEL_ID} .profile-row .btn{
        flex-shrink:0;
        padding:10px 12px;
      }
      #${PANEL_ID} .profile-name-row{
        display:none;
        gap:8px;
        align-items:center;
      }
      #${PANEL_ID} .profile-name-row.show{
        display:flex;
      }
      #${PANEL_ID} .profile-name-row input{
        flex:1;
      }
      #${PANEL_ID} .divider{
        height:1px;
        background:#e5e5e5;
        margin:4px 0;
      }
      #${PANEL_ID} .bmc-btn{
        display:inline-flex;
        align-items:center;
        gap:6px;
        background:#FFDD00;
        color:#000;
        border:0;
        border-radius:10px;
        padding:6px 12px;
        font:600 12px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        cursor:pointer;
        text-decoration:none;
        transition: background 0.15s, transform 0.1s;
        white-space:nowrap;
      }
      #${PANEL_ID} .bmc-btn:hover{ background:#ffca00; transform:translateY(-1px); }
      #${PANEL_ID} .bmc-btn:active{ transform:translateY(0); }
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
    const saved = await storageGet(["selectedModel", "enabled", "profiles", "activeProfileId"]);
    const selectedModel = typeof saved.selectedModel === "string" ? saved.selectedModel : "gpt-5-2";
    const enabled = typeof saved.enabled === "boolean" ? saved.enabled : true;
    let profiles = Array.isArray(saved.profiles) ? saved.profiles : [DEFAULT_PROFILE];
    let activeProfileId = typeof saved.activeProfileId === "string" ? saved.activeProfileId : "default";
    
    // Ensure default profile exists
    if (!profiles.find(p => p.id === "default")) {
      profiles.unshift(DEFAULT_PROFILE);
    }
    
    // Ensure active profile exists
    let activeProfile = profiles.find(p => p.id === activeProfileId);
    if (!activeProfile) {
      activeProfileId = "default";
      activeProfile = profiles.find(p => p.id === "default");
    }

    // Button
    if (!document.getElementById(BTN_ID)) {
      const btn = el("button", { id: BTN_ID, type: "button", text: enabled ? "⚙️ InjectGPT" : "⚙️ InjectGPT (Off)" });
      if (!enabled) btn.classList.add("disabled");
      btn.addEventListener("click", () => {
        const panel = document.getElementById(PANEL_ID);
        panel.classList.toggle("show");
      });
      document.documentElement.appendChild(btn);
    }

    // Panel
    if (!document.getElementById(PANEL_ID)) {
      // Toggle switch
      const toggle = el("div", { class: enabled ? "toggle on" : "toggle" });
      
      // Model select
      const modelSelect = el("select");
      for (const model of MODELS) {
        const option = el("option", { value: model.value, text: model.label });
        if (model.value === selectedModel) {
          option.selected = true;
        }
        modelSelect.appendChild(option);
      }
      
      // Profile select
      const profileSelect = el("select");
      function updateProfileSelect() {
        profileSelect.innerHTML = "";
        for (const profile of profiles) {
          const option = el("option", { value: profile.id, text: profile.name });
          if (profile.id === activeProfileId) {
            option.selected = true;
          }
          profileSelect.appendChild(option);
        }
      }
      updateProfileSelect();
      
      // Profile name input (for new/rename)
      const profileNameInput = el("input", { type: "text", placeholder: "Profile name..." });
      const profileNameRow = el("div", { class: "profile-name-row" }, [
        profileNameInput,
        el("button", { class: "btn primary", type: "button", text: "Create" }),
        el("button", { class: "btn secondary", type: "button", text: "Cancel" }),
      ]);
      
      const newProfileBtn = el("button", { class: "btn secondary", type: "button", text: "+ New" });
      const deleteProfileBtn = el("button", { class: "btn danger", type: "button", html: "✕ Delete" });
      
      // Disable delete for default profile
      function updateDeleteBtn() {
        deleteProfileBtn.disabled = activeProfileId === "default";
      }
      updateDeleteBtn();
      
      const sysTa = el("textarea");
      sysTa.value = activeProfile.systemPrompt;

      const devTa = el("textarea");
      devTa.value = activeProfile.developerPrompt;

      // Buy Me a Coffee link
      const bmcLink = el("a", { 
        class: "bmc-btn", 
        href: "https://buymeacoffee.com/jonathanyly", 
        target: "_blank",
        rel: "noopener noreferrer",
        html: '☕'
      });

      const panel = el("div", { id: PANEL_ID }, [
        el("div", { class: "box" }, [
          el("div", { class: "hdr" }, [
            el("h3", { text: "InjectGPT Settings" }),
            el("div", { class: "hdr-right" }, [
              bmcLink,
              el("div", { class: "toggle-container" }, [
                el("span", { class: "toggle-label", text: "Enabled" }),
                toggle,
              ]),
              el("button", { class: "close", type: "button", text: "✕", title: "Close" }),
            ]),
          ]),
          el("div", { class: "body" }, [
            el("div", {}, [
              el("label", { text: "Model" }),
              modelSelect,
              el("div", { class: "hint", text: "Select the GPT model to use." }),
            ]),
            el("div", { class: "profile-section" }, [
              el("label", { text: "Profile", style: "margin-bottom:0" }),
              el("div", { class: "profile-row" }, [
                profileSelect,
                newProfileBtn,
                deleteProfileBtn,
              ]),
              profileNameRow,
            ]),
            el("div", { class: "divider" }),
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
            el("button", { class: "btn secondary", type: "button", html: "Reset Profile" }),
            el("button", { class: "btn primary", type: "button", text: "Save" }),
          ]),
        ]),
      ]);

      // Profile name row buttons
      const [createBtn, cancelBtn] = profileNameRow.querySelectorAll(".btn");
      
      newProfileBtn.addEventListener("click", () => {
        profileNameInput.value = "";
        profileNameRow.classList.add("show");
        profileNameInput.focus();
      });
      
      cancelBtn.addEventListener("click", () => {
        profileNameRow.classList.remove("show");
      });
      
      createBtn.addEventListener("click", async () => {
        const name = profileNameInput.value.trim();
        if (!name) return;
        
        const newProfile = {
          id: generateId(),
          name: name,
          systemPrompt: sysTa.value,
          developerPrompt: devTa.value
        };
        
        profiles.push(newProfile);
        activeProfileId = newProfile.id;
        
        await storageSet({ profiles, activeProfileId });
        updateProfileSelect();
        updateDeleteBtn();
        profileNameRow.classList.remove("show");
      });
      
      profileNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          createBtn.click();
        } else if (e.key === "Escape") {
          cancelBtn.click();
        }
      });
      
      deleteProfileBtn.addEventListener("click", async () => {
        if (activeProfileId === "default") return;
        
        if (!confirm(`Delete profile "${profiles.find(p => p.id === activeProfileId)?.name}"?`)) return;
        
        profiles = profiles.filter(p => p.id !== activeProfileId);
        activeProfileId = "default";
        activeProfile = profiles.find(p => p.id === "default");
        
        sysTa.value = activeProfile.systemPrompt;
        devTa.value = activeProfile.developerPrompt;
        
        await storageSet({ profiles, activeProfileId });
        updateProfileSelect();
        updateDeleteBtn();
        
        // Update injector
        updateSystemPrompt(sysTa.value);
        updateDeveloperPrompt(devTa.value);
      });
      
      profileSelect.addEventListener("change", async () => {
        // Save current profile first
        const currentProfile = profiles.find(p => p.id === activeProfileId);
        if (currentProfile) {
          currentProfile.systemPrompt = sysTa.value;
          currentProfile.developerPrompt = devTa.value;
        }
        
        // Switch to new profile
        activeProfileId = profileSelect.value;
        activeProfile = profiles.find(p => p.id === activeProfileId);
        
        if (activeProfile) {
          sysTa.value = activeProfile.systemPrompt;
          devTa.value = activeProfile.developerPrompt;
        }
        
        await storageSet({ profiles, activeProfileId });
        updateDeleteBtn();
        
        // Update injector
        updateSystemPrompt(sysTa.value);
        updateDeveloperPrompt(devTa.value);
      });

      // Helper to save current settings
      async function saveSettings() {
        const model = modelSelect.value;
        const sys = sysTa.value ?? "";
        const dev = devTa.value ?? "";
        const isEnabled = toggle.classList.contains("on");
        
        // Update active profile
        const currentProfile = profiles.find(p => p.id === activeProfileId);
        if (currentProfile) {
          currentProfile.systemPrompt = sys;
          currentProfile.developerPrompt = dev;
        }
        
        await storageSet({ 
          selectedModel: model,
          enabled: isEnabled,
          profiles,
          activeProfileId
        });
        updateModel(model);
        updateSystemPrompt(sys);
        updateDeveloperPrompt(dev);
        updateEnabled(isEnabled);
        
        // Update button text
        const btn = document.getElementById(BTN_ID);
        if (btn) {
          btn.textContent = isEnabled ? "⚙️ InjectGPT" : "⚙️ InjectGPT (Off)";
          btn.classList.toggle("disabled", !isEnabled);
        }
      }

      // Toggle click handler
      toggle.addEventListener("click", async () => {
        toggle.classList.toggle("on");
        await saveSettings();
      });

      // Close interactions - save on close
      const closeBtn = panel.querySelector(".close");
      closeBtn.addEventListener("click", async () => {
        await saveSettings();
        panel.classList.remove("show");
      });
      
      // Save when clicking outside (on backdrop)
      panel.addEventListener("click", async (e) => {
        if (e.target === panel) {
          await saveSettings();
          panel.classList.remove("show");
        }
      });

      // Buttons
      const [resetBtn, saveBtn] = panel.querySelectorAll(".actions .btn");

      resetBtn.addEventListener("click", async () => {
        // Reset current profile to defaults
        if (activeProfileId === "default") {
          sysTa.value = "You are a helpful assistant.";
          devTa.value = "";
        } else {
          sysTa.value = "";
          devTa.value = "";
        }
        
        // Update profile
        const currentProfile = profiles.find(p => p.id === activeProfileId);
        if (currentProfile) {
          currentProfile.systemPrompt = sysTa.value;
          currentProfile.developerPrompt = devTa.value;
        }
        
        await storageSet({ profiles });
        updateSystemPrompt(sysTa.value);
        updateDeveloperPrompt(devTa.value);
      });

      saveBtn.addEventListener("click", async () => {
        await saveSettings();
        panel.classList.remove("show");
      });

      document.documentElement.appendChild(panel);

      // Push current settings to page context once injector is likely present
      setTimeout(() => {
        updateModel(selectedModel);
        updateSystemPrompt(activeProfile.systemPrompt);
        updateDeveloperPrompt(activeProfile.developerPrompt);
        updateEnabled(enabled);
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
