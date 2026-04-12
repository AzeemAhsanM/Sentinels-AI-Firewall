console.log("🛡 Sentinels background running")

chrome.runtime.onInstalled.addListener(() => {
  console.log("🛡 Sentinels installed")

  chrome.tabs.create({
    url: "https://sentinels-p4ks.vercel.app/welcome"
  })

  chrome.alarms.create("keepAlive", { periodInMinutes: 4 })
})

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("keepAlive", { periodInMinutes: 4 })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    console.log("🛡 Keep-alive ping")
  }
})


// ── LOCAL REDACTION ENGINE ────────────────────────────────────────────────────

const PATTERNS = [
  [/\bAKIA[0-9A-Z]{16}\b/g,                                         "AWS_ACCESS_KEY"],
  [/\bASIA[0-9A-Z]{16}\b/g,                                         "AWS_TEMP_ACCESS_KEY"],
  [/\b(?:postgres|postgresql|mysql|oracle|mssql):\/\/[^:\s]+:[^@\s]+@[^\s/]+(?:\/\S*)?/g, "DB_CREDENTIALS"],
  [/\bmongodb(?:\+srv)?:\/\/[^:\s]+:[^@\s]+@[^\s/]+/g,             "DB_CREDENTIALS"],
  [/\bredis:\/\/:[^@\s]+@[^\s/]+(?:\/\S*)?/g,                      "REDIS_CREDENTIALS"],
  [/\bamqps?:\/\/[^:\s]+:[^@\s]+@[^\s/]+/g,                        "AMQP_CREDENTIALS"],
  [/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,          "JWT_TOKEN"],
  [/Authorization:\s*Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,             "BEARER_TOKEN"],
  [/\bghp_[A-Za-z0-9]{30,}\b/g,                                     "GITHUB_TOKEN"],
  [/\bgho_[A-Za-z0-9]{30,}\b/g,                                     "GITHUB_TOKEN"],
  [/\bghs_[A-Za-z0-9]{30,}\b/g,                                     "GITHUB_TOKEN"],
  [/\bghr_[A-Za-z0-9]{30,}\b/g,                                     "GITHUB_TOKEN"],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,                             "GITHUB_TOKEN"],
  [/\bglpat-[A-Za-z0-9_\-]{16,}\b/g,                                "GITLAB_TOKEN"],
  [/\bnpm_[A-Za-z0-9]{36,}\b/g,                                     "NPM_TOKEN"],
  [/\bsk-ant-[A-Za-z0-9_\-]{20,}\b/g,                               "ANTHROPIC_KEY"],
  [/\bsk-[A-Za-z0-9_\-]{20,}\b/g,                                   "OPENAI_API_KEY"],
  [/\bgsk_[A-Za-z0-9]{20,}\b/g,                                     "GROQ_API_KEY"],
  [/\bhf_[A-Za-z0-9]{20,}\b/g,                                      "HUGGINGFACE_TOKEN"],
  [/\bsk_live_[0-9A-Za-z]{16,}\b/g,                                 "STRIPE_SECRET"],
  [/\bsk_test_[0-9A-Za-z]{16,}\b/g,                                 "STRIPE_TEST_KEY"],
  [/\brk_live_[A-Za-z0-9]{20,}\b/g,                                 "STRIPE_RESTRICTED_KEY"],
  [/\bwhsec_[A-Za-z0-9]{16,}\b/g,                                   "STRIPE_WEBHOOK_SECRET"],
  [/\bxox[baprs]-[A-Za-z0-9\-]{10,80}\b/g,                          "SLACK_TOKEN"],
  [/\bv0\.[a-z]-[A-Za-z0-9]{32,}\b/g,                               "SLACK_SIGNING_SECRET"],
  [/https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+/g, "SLACK_WEBHOOK"],
  [/https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_\-]+/g,  "DISCORD_WEBHOOK"],
  [/\bSG\.[A-Za-z0-9_\-]{20,}\b/g,                                  "SENDGRID_KEY"],
  [/\bkey-[a-f0-9]{32}\b/g,                                         "MAILGUN_KEY"],
  [/\bAC[A-Za-z0-9]{34}\b/g,                                        "TWILIO_SID"],
  [/\bSK[A-Za-z0-9]{34}\b/g,                                        "TWILIO_AUTH_TOKEN"],
  [/\bAIza[0-9A-Za-z\-_]{30}\b/g,                                   "GOOGLE_API_KEY"],
  [/\bGOCSPX-[A-Za-z0-9\-_]{10,}\b/g,                               "GOOGLE_SECRET"],
  [/\bEAA[A-Za-z0-9]{20,}\b/g,                                      "FACEBOOK_TOKEN"],
  [/\bpat[A-Za-z0-9]{14,}\.[A-Za-z0-9]{40,}\b/g,                   "AIRTABLE_TOKEN"],
  [/-----BEGIN (?:RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----[\s\S]*?-----END (?:RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----/g, "PRIVATE_KEY"],
  [/-----BEGIN (?:RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----/g,       "PRIVATE_KEY"],
  [/-----BEGIN CERTIFICATE-----/g,                                   "CERTIFICATE"],
  [/\b(?:[A-Za-z0-9_]*(?:key|token|secret|password|pwd|auth|credential|api_key)[A-Za-z0-9_]*)\s*[:=]\s*["']?([A-Za-z0-9_\-!@#$%^&*+=./]{16,})["']?/gi, "HIGH_ENTROPY_SECRET"],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,          "EMAIL"],
  [/(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)/g,                               "SSN"],
]

const CC_PATTERN = /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g
const CC_CONTEXT = /credit|card|payment|visa|mastercard|amex|cvv|debit/i

function luhnCheck(card) {
  const digits = card.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0, odd = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i])
    if (odd) { d *= 2; if (d > 9) d -= 9 }
    sum += d
    odd = !odd
  }
  return sum % 10 === 0
}

function isCodeReference(val) {
  if (/^[A-Za-z_][A-Za-z0-9_.]*$/.test(val) && val.includes('.')) return true
  if (/^[A-Z][A-Z0-9_]{2,}$/.test(val)) return true
  if (/^(?:get|set|verify|check|hash|create|update|delete|fetch|validate|generate|parse|format|build|make|init|setup|handle|process|compute|calculate|is|has|can|should)_[a-z][a-z0-9_]*$/.test(val)) return true
  return false
}

function redactLocally(text) {
  let sanitized = text
  const entities = []

  for (const [pattern, label] of PATTERNS) {
    pattern.lastIndex = 0
    sanitized = sanitized.replace(pattern, (match, group1) => {
      if (label === "HIGH_ENTROPY_SECRET" && group1) {
        if (isCodeReference(group1)) return match
        entities.push({ type: label, value: group1 })
        return match.replace(group1, `[REDACTED_${label}]`)
      }
      entities.push({ type: label, value: match })
      return `[REDACTED_${label}]`
    })
  }

  CC_PATTERN.lastIndex = 0
  sanitized = sanitized.replace(CC_PATTERN, (match, offset, str) => {
    const ctx = str.slice(Math.max(0, offset - 30), offset + match.length + 30)
    if (luhnCheck(match) && CC_CONTEXT.test(ctx)) {
      entities.push({ type: "CREDIT_CARD", value: match })
      return "[REDACTED_CREDIT_CARD]"
    }
    return match
  })

  return { sanitized_prompt: sanitized, entities, blocked: false }
}


// ── RISK SCORING ──────────────────────────────────────────────────────────────

const RISK_WEIGHTS = {
  "AWS_ACCESS_KEY": 1.0, "AWS_TEMP_ACCESS_KEY": 1.0, "PRIVATE_KEY": 1.0,
  "DB_CREDENTIALS": 0.9, "REDIS_CREDENTIALS": 0.9, "AMQP_CREDENTIALS": 0.9,
  "STRIPE_SECRET": 0.9, "ANTHROPIC_KEY": 0.9, "CERTIFICATE": 0.9,
  "SSN": 0.9, "CREDIT_CARD": 0.9,
  "STRIPE_RESTRICTED_KEY": 0.85,
  "OPENAI_API_KEY": 0.8, "GROQ_API_KEY": 0.8, "TWILIO_SID": 0.8,
  "TWILIO_AUTH_TOKEN": 0.8, "GOOGLE_SECRET": 0.8, "FACEBOOK_TOKEN": 0.8,
  "GITHUB_TOKEN": 0.75, "GITLAB_TOKEN": 0.75, "NPM_TOKEN": 0.75,
  "SLACK_WEBHOOK": 0.75, "DISCORD_WEBHOOK": 0.7, "JWT_TOKEN": 0.7,
  "BEARER_TOKEN": 0.7, "HIGH_ENTROPY_SECRET": 0.6,
  "SENDGRID_KEY": 0.65, "MAILGUN_KEY": 0.65, "HUGGINGFACE_TOKEN": 0.65,
  "SLACK_TOKEN": 0.65, "SLACK_SIGNING_SECRET": 0.65,
  "STRIPE_WEBHOOK_SECRET": 0.65, "GOOGLE_API_KEY": 0.65,
  "AIRTABLE_TOKEN": 0.65, "STRIPE_TEST_KEY": 0.65,
  "EMAIL": 0.3,
}

function calculateRisk(entities) {
  if (entities.length === 0) return { risk_score: 0, risk_level: "none" }
  const total = entities.reduce((sum, e) => sum + (RISK_WEIGHTS[e.type] || 0.5), 0)
  const risk_score = Math.round(Math.min(total / 3.5, 1.0) * 100) / 100
  const risk_level = risk_score < 0.35 ? "low" : risk_score < 0.7 ? "medium" : "high"
  return { risk_score, risk_level }
}


// ── MESSAGE HANDLER ───────────────────────────────────────────────────────────

const BACKEND_URL = "https://uwqy2amrvl.execute-api.ap-south-1.amazonaws.com"

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === "PING") {
    sendResponse({ ok: true })
    return true
  }

  if (message.type === "ANALYZE_PROMPT") {
    console.log("🛡 Redacting locally:", message.prompt.slice(0, 80))

    const result = redactLocally(message.prompt)
    const { risk_score, risk_level } = calculateRisk(result.entities)
    const entity_types = [...new Set(result.entities.map(e => e.type))]

    result.risk_score = risk_score
    result.risk_level = risk_level

    sendResponse(result)

    // Log to dashboard only if user is signed in
    chrome.storage.local.get(['auth_token'], (data) => {
      if (!data.auth_token) return

      fetch(`${BACKEND_URL}/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.auth_token}`
        },
        body: JSON.stringify({
          risk_score,
          risk_level,
          entity_count: result.entities.length,
          entity_types
        })
      }).catch(() => {})
    })

    return true
  }

  // Called from popup after user signs in — saves token for logging
  if (message.type === "SAVE_TOKEN") {
    chrome.storage.local.set({ auth_token: message.token }, () => {
      sendResponse({ ok: true })
    })
    return true
  }

  // Called from popup on logout — clears token
  if (message.type === "CLEAR_TOKEN") {
    chrome.storage.local.remove("auth_token", () => {
      sendResponse({ ok: true })
    })
    return true
  }
})