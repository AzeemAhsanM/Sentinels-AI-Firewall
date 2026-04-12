console.log("🛡 Sentinels AI Firewall active")

let sentinelsProcessing = false
let sentinelsJustSubmitted = false
let activeEditor = null

const BACKEND_URL = "https://uwqy2amrvl.execute-api.ap-south-1.amazonaws.com/analyze"

/* Track active editor */
function updateActiveEditor() {
  const editor =
    document.querySelector("#prompt-textarea") ||
    document.querySelector('[contenteditable="true"]') ||
    document.querySelector('[role="textbox"]') ||
    document.querySelector('.ql-editor') ||
    document.querySelector("textarea")

  if (editor) activeEditor = editor
}

setInterval(updateActiveEditor, 1500)


/* Find send button */
function findSendButton() {
  return (
    document.querySelector('button[data-testid="send-button"]') ||
    document.querySelector('button[aria-label="Send message"]') ||
    document.querySelector('button[aria-label="Send prompt"]') ||
    document.querySelector('button[aria-label="Send"]') ||
    document.querySelector('button[aria-label="Submit"]') ||
    document.querySelector('button[type="submit"]') ||
    document.querySelector('button[class*="composer-submit-button-color"]') ||
    document.querySelector('button[class*="composer-submit"]')
  )
}


/* getPromptText — DOM walk preserves newlines from ProseMirror/Quill */
function getPromptText(input) {
  if (input.tagName === "TEXTAREA") return input.value || ""
  return extractTextWithNewlines(input)
}

const BLOCK_TAGS = new Set([
  "P", "DIV", "BR", "LI", "H1", "H2", "H3", "H4", "H5", "H6",
  "BLOCKQUOTE", "PRE", "TR", "TD", "TH"
])

function extractTextWithNewlines(node) {
  let result = ""
  function walk(n) {
    if (n.nodeType === Node.TEXT_NODE) { result += n.textContent; return }
    if (n.nodeType !== Node.ELEMENT_NODE) return
    if (n.tagName === "BR") { result += "\n"; return }
    for (const child of n.childNodes) walk(child)
    if (BLOCK_TAGS.has(n.tagName) && !result.endsWith("\n")) result += "\n"
  }
  walk(node)
  return result.replace(/\n{3,}/g, "\n\n").trim()
}


/* Set editor content */
function setEditorContent(input, text) {
  if (input.tagName === "TEXTAREA") {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    ).set
    nativeSetter.call(input, text)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  } else {
    input.focus()
    document.execCommand("selectAll", false, null)
    const success = document.execCommand("insertText", false, text)
    if (!success) {
      const shadow = document.querySelector('textarea[name="prompt-textarea"]')
      if (shadow) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        ).set
        nativeSetter.call(shadow, text)
        shadow.dispatchEvent(new Event("input", { bubbles: true }))
      }
    }
    input.dispatchEvent(new Event("input", { bubbles: true }))
  }
}


/* Submit */
function submitAfterSanitize(input) {
  setTimeout(() => {
    const btn = findSendButton()
    if (btn) {
      sentinelsJustSubmitted = true
      btn.click()
      setTimeout(() => { sentinelsJustSubmitted = false }, 1000)
    } else {
      sentinelsJustSubmitted = true
      input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter", code: "Enter", keyCode: 13,
        bubbles: true, cancelable: true
      }))
      setTimeout(() => { sentinelsJustSubmitted = false }, 1000)
    }
  }, 120)
}


/* All requests go through background service worker —
   content script fetch is blocked by CSP on all three platforms */
function analyzePrompt(prompt, callback) {
  let attempts = 0

  function send() {
    chrome.runtime.sendMessage(
      { type: "ANALYZE_PROMPT", prompt },
      (response) => {
        if (chrome.runtime.lastError) {
          const msg = chrome.runtime.lastError.message || ""
          console.warn("🛡 SW error:", msg)

          if (attempts < 2) {
            attempts++

            // wake service worker
            chrome.runtime.sendMessage({ type: "PING" }, () => {
              setTimeout(send, 300)
            })
            return
          }

          // FINAL FALLBACK → DO NOT BLOCK USER
          callback(prompt)
          return
        }

        callback(response?.sanitized_prompt ?? prompt)
      }
    )
  }

  send()
}


/* KEYBOARD SUBMIT INTERCEPT */
window.addEventListener("keydown", function (e) {
  const isEnter = e.key === "Enter"
  const isCmdEnter = e.metaKey && e.key === "Enter"
  const isCtrlEnter = e.ctrlKey && e.key === "Enter"

  if (!(isEnter || isCmdEnter || isCtrlEnter)) return
  if (e.shiftKey) return
  if (sentinelsProcessing) return
  if (sentinelsJustSubmitted) return

  const input = activeEditor
  if (!input) return

  const prompt = getPromptText(input)
  if (!prompt || prompt.trim() === "") return
  if (prompt.includes("[REDACTED_")) return

  console.log("🛡 Keyboard send intercepted")
  e.preventDefault()
  e.stopImmediatePropagation()

  sentinelsProcessing = true

  analyzePrompt(prompt, (sanitized) => {
    console.log("🛡 Prompt sanitized:", sanitized)
    setEditorContent(input, sanitized)
    sentinelsProcessing = false
    submitAfterSanitize(input)
  })

}, true)


/* MOUSE CLICK INTERCEPT */
document.addEventListener("click", function (e) {
  const sendBtn = findSendButton()
  if (!sendBtn) return
  if (!sendBtn.contains(e.target) && e.target !== sendBtn) return

  if (sentinelsJustSubmitted) {
    sentinelsJustSubmitted = false
    return
  }

  if (sentinelsProcessing) {
    e.preventDefault()
    e.stopImmediatePropagation()
    return
  }

  const input = activeEditor
  if (!input) return

  const prompt = getPromptText(input)
  if (!prompt || prompt.trim() === "") return
  if (prompt.includes("[REDACTED_")) return

  console.log("🛡 Mouse send intercepted")
  e.preventDefault()
  e.stopImmediatePropagation()

  sentinelsProcessing = true

  analyzePrompt(prompt, (sanitized) => {
    console.log("🛡 Prompt sanitized:", sanitized)
    setEditorContent(input, sanitized)
    sentinelsProcessing = false
    submitAfterSanitize(input)
  })

}, true)