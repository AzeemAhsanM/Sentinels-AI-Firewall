import { useState, useEffect } from "react"

export default function Welcome() {

const [loggedIn, setLoggedIn] = useState(false)

useEffect(() => {
  fetch("https://uwqy2amrvl.execute-api.ap-south-1.amazonaws.com/dashboard", {
    credentials: "include"
  })
    .then(res => {
      if (res.ok) {
        setLoggedIn(true)
      }
    })
}, [])

const openDashboard = () => {
  if (loggedIn) {
    window.location.href = "/dashboard"
  } else {
    window.location.href = "https://uwqy2amrvl.execute-api.ap-south-1.amazonaws.com/auth/google"
  }
}

return (
  <div className="welcome">
    <nav className="nav">
      <div className="nav-left">
        <img src="/logo.png" className="logo"/>
        <span className="brand">Sentinels AI Firewall</span>
      </div>
    </nav>

    <div className="welcome-content">
      <h1>Sentinels Installed</h1>

      <p className="subtitle">
        Your AI firewall is now protecting prompts across ChatGPT, Claude and Gemini.
      </p>

      <div className="features">
        <div className="feature-card">
          <h3>Secret Detection</h3>
          <p>API keys and sensitive data are automatically detected.</p>
        </div>

        <div className="feature-card">
          <h3>Your Data Stays With You</h3>
          <p>Your prompts are processed entirely in your browser.
            They never leave your device.

            We don’t store your prompts.</p>
        </div>

        <div className="feature-card">
          <h3>Secure Browsing</h3>
          <p>Works across ChatGPT, Claude and Gemini.</p>
        </div>
      </div>

      <button
        className="dashboard-btn"
        onClick={openDashboard}
      >
        Open Dashboard
      </button>
    </div>
  </div>
)

}
