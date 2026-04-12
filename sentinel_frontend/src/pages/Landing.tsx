import { useEffect, useState } from "react"
import { FaChrome } from "react-icons/fa"

export default function Landing() {

const [loggedIn, setLoggedIn] = useState(false)

// Check login status from backend
useEffect(() => {
fetch("https://uwqy2amrvl.execute-api.ap-south-1.amazonaws.com/dashboard", {
credentials: "include"
})
.then(res => {
if (res.ok) {
setLoggedIn(true)
}
})
.catch(() => {})
}, [])

const openDashboard = () => {
  if (loggedIn) {
    window.location.href = "/dashboard"
  } else {
    window.location.href = "https://uwqy2amrvl.execute-api.ap-south-1.amazonaws.com/auth/google"
  }
}

return (
  <div className="landing">
    <nav className="nav">
      <div className="nav-left">
        <img src="/logo.png" className="logo"/>
        <span className="brand">Sentinels AI Firewall</span>
      </div>

      <div className="nav-right">
        <span
          className="dashboard-link"
          onClick={openDashboard}
        >
          Dashboard
        </span>
      </div>
    </nav>

    <section className="hero">
      <div className="hero-left">
        <h1>Sentinels</h1>

        <p className="subtitle">AI FIREWALL</p>

        <p className="desc">
          Protect your prompts. Detect secrets. Analyze risk.
          Sentinels secures developers from accidental data leaks — 100% client-side, 
          your prompts never leave your device.
        </p>

        <button className="chrome-btn" onClick={() => window.open("https://chromewebstore.google.com/detail/sentinels-ai-firewall/omdneacjpgkckpbpahalolphokglfplb?authuser=0&hl=en-GB", "_blank")}>
          <FaChrome size={20}/>
          Add Chrome Extension
        </button>
      </div>

      <div className="hero-right">
        <div className="feature-card">
          <h3>Secret Detection</h3>
          <p>
            Automatically detect API keys,
            tokens and sensitive company data
            before it reaches an AI model.
          </p>
        </div>

        <div className="feature-card">
          <h3>Your Data Stays With You</h3>
          <p>
            Your prompts are processed entirely in your browser.
            They never leave your device.

            We don’t store your prompts.
          </p>
        </div>

        <div className="feature-card">
          <h3>Enterprise Ready</h3>
          <p>
            Built for developers and teams
            using AI tools daily.
          </p>
        </div>
      </div>
    </section>
  </div>
)

}
