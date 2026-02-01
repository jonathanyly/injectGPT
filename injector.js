// This script runs in the MAIN world (page context) and intercepts fetch requests
(function() {
  if (window.__CHATGPT_TRANSLATOR_INTERCEPTED__) return;
  window.__CHATGPT_TRANSLATOR_INTERCEPTED__ = true;
  window.__CHATGPT_TRANSLATOR_MODEL__ = "gpt-5-2";
  window.__CHATGPT_TRANSLATOR_SYSTEM_PROMPT__ = "You are a helpful assistant.";
  window.__CHATGPT_TRANSLATOR_DEVELOPER_PROMPT__ = "";
  window.__CHATGPT_TRANSLATOR_CONVERSATION_MODE__ = null;
  
  function isConversationUrl(url) {
    if (!url) return false;
    const urlString = url.toString();
    return urlString.includes('/conversation') && !urlString.includes('/prepare');
  }

  function modifyRequestBody(bodyData) {
    const currentModel = window.__CHATGPT_TRANSLATOR_MODEL__;
    const systemPrompt = window.__CHATGPT_TRANSLATOR_SYSTEM_PROMPT__;
    const developerPrompt = window.__CHATGPT_TRANSLATOR_DEVELOPER_PROMPT__;
    const conversationMode = window.__CHATGPT_TRANSLATOR_CONVERSATION_MODE__;
    
    // Modify the model
    if (currentModel) {
      bodyData.model = currentModel;
    }
    
    // Modify conversation_mode if set
    if (conversationMode && bodyData.conversation_mode) {
      bodyData.conversation_mode.kind = conversationMode;
    }
    
    // Modify messages array if it exists
    if (bodyData.messages && Array.isArray(bodyData.messages)) {
      bodyData.messages = bodyData.messages.map(msg => {
        // Modify system message
        if (msg.author && msg.author.role === 'system') {
          return {
            ...msg,
            content: {
              ...msg.content,
              parts: [systemPrompt]
            }
          };
        }
        
        // Modify developer message
        if (msg.author && msg.author.role === 'developer') {
          return {
            ...msg,
            content: {
              ...msg.content,
              parts: [developerPrompt]
            }
          };
        }
        
        return msg;
      });
      
      // If there's no developer message but we have a developer prompt, add one
      if (developerPrompt) {
        const hasDeveloperMsg = bodyData.messages.some(msg => msg.author && msg.author.role === 'developer');
        if (!hasDeveloperMsg) {
          bodyData.messages.push({
            id: crypto.randomUUID(),
            author: { role: 'developer' },
            content: {
              content_type: 'text',
              parts: [developerPrompt]
            }
          });
        }
      }
      
      // If there's no system message but we have a system prompt, add one at the beginning
      if (systemPrompt) {
        const hasSystemMsg = bodyData.messages.some(msg => msg.author && msg.author.role === 'system');
        if (!hasSystemMsg) {
          bodyData.messages.unshift({
            id: crypto.randomUUID(),
            author: { role: 'system' },
            content: {
              content_type: 'text',
              parts: [systemPrompt]
            }
          });
        }
      }
    }
    
    return bodyData;
  }
  
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    let [input, options] = args;
    
    // Get URL from input (could be string, URL, or Request)
    let url;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input instanceof Request) {
      url = input.url;
    }
    
    if (isConversationUrl(url)) {
      let body = options?.body;
      
      if (!body && input instanceof Request) {
        try {
          const cloned = input.clone();
          body = await cloned.text();
        } catch (e) {
          // Could not clone request body
        }
      }
      
      if (body && typeof body === 'string') {
        try {
          let bodyData = JSON.parse(body);
          bodyData = modifyRequestBody(bodyData);
          
          const newBody = JSON.stringify(bodyData);
          
          if (input instanceof Request) {
            const newOptions = {
              method: input.method,
              headers: input.headers,
              body: newBody,
              mode: input.mode,
              credentials: input.credentials,
              cache: input.cache,
              redirect: input.redirect,
              referrer: input.referrer,
              integrity: input.integrity,
            };
            return originalFetch.call(this, url, newOptions);
          } else {
            options = { ...options, body: newBody };
          }
        } catch (e) {
          // Could not parse body
        }
      }
    }
    
    return originalFetch.apply(this, [input, options]);
  };
  
  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(...args) {
    this._url = args[1];
    this._method = args[0];
    return originalXHROpen.apply(this, args);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    if (isConversationUrl(this._url) && body && typeof body === 'string') {
      try {
        let bodyData = JSON.parse(body);
        bodyData = modifyRequestBody(bodyData);
        body = JSON.stringify(bodyData);
      } catch (e) {
        // Could not parse XHR body
      }
    }
    
    return originalXHRSend.call(this, body);
  };
  
  // Listen for model updates from content script
  window.addEventListener('chatgpt-translator-update-model', function(e) {
    if (e.detail && e.detail.model) {
      window.__CHATGPT_TRANSLATOR_MODEL__ = e.detail.model;
    }
  });
  
  // Listen for system prompt updates from content script
  window.addEventListener('chatgpt-translator-update-system-prompt', function(e) {
    if (e.detail && e.detail.prompt !== undefined) {
      window.__CHATGPT_TRANSLATOR_SYSTEM_PROMPT__ = e.detail.prompt;
    }
  });
  
  // Listen for developer prompt updates from content script
  window.addEventListener('chatgpt-translator-update-developer-prompt', function(e) {
    if (e.detail && e.detail.prompt !== undefined) {
      window.__CHATGPT_TRANSLATOR_DEVELOPER_PROMPT__ = e.detail.prompt;
    }
  });
  
  // Listen for conversation mode updates from content script
  window.addEventListener('chatgpt-translator-update-conversation-mode', function(e) {
    if (e.detail && e.detail.kind !== undefined) {
      window.__CHATGPT_TRANSLATOR_CONVERSATION_MODE__ = e.detail.kind;
    }
  });
})();