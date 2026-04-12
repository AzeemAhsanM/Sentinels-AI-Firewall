import { useEffect, useState } from "react"

const API = "https://uwqy2amrvl.execute-api.ap-south-1.amazonaws.com"
const EXTENSION_ID = "ipaefbpdpejbpjddefoekbafjkepdohd"

export default function Dashboard() {

  const [data, setData] = useState<any>(null)
  const [showLogout, setShowLogout] = useState(false)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Refresh token on every load — resets 30-day cookie, prevents sign-out
        await fetch(`${API}/auth/refresh`, { credentials: "include" })

        const res = await fetch(`${API}/dashboard`, { credentials: "include" })

        if (!res.ok) {
          window.location.href = "/"
          return
        }

        const json = await res.json()
        setData(json)

        sendTokenToExtension()

      } catch (err) {
        console.error("Dashboard fetch error:", err)
        window.location.href = "/"
      }
    }

    loadDashboard()
  }, [])


  const sendTokenToExtension = async () => {
    try {
      const res = await fetch(`${API}/auth/token`, { credentials: "include" })
      if (!res.ok) return

      const { token } = await res.json()

      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "SAVE_TOKEN", token },
          () => { if (chrome.runtime.lastError) {} }
        )
      }
    } catch (err) {}
  }


  const logout = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "CLEAR_TOKEN" },
          () => { if (chrome.runtime.lastError) {} }
        )
      }

      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include"
      })

    } catch (err) {
      console.error("Logout error:", err)
    }

    window.location.href = "/"
  }


  if (!data) {
    return <div style={{ padding: "40px" }}>Loading dashboard...</div>
  }

  return (
    <div>

      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-left">
          <img src="/logo.png" className="logo" />
          <span className="brand">Sentinels AI Firewall</span>
        </div>
        <div className="nav-right">
          <span className="dashboard-link" onClick={() => setShowLogout(true)}>
            Logout
          </span>
        </div>
      </nav>

      {/* DASHBOARD */}
      <div style={{ padding: "40px" }}>
        <h1>Sentinel Dashboard</h1>

        <div className="stats">
          <div className="stat-card">
            <h3>Total Prompts</h3>
            <p>{data.total}</p>
          </div>
          <div className="stat-card">
            <h3>High Risk</h3>
            <p>{data.high}</p>
          </div>
          <div className="stat-card">
            <h3>Medium Risk</h3>
            <p>{data.medium}</p>
          </div>
          <div className="stat-card">
            <h3>Low Risk</h3>
            <p>{data.low}</p>
          </div>
        </div>
      </div>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div className="modal-overlay">
          <div className="logout-modal">
            <div className="modal-header">
              <img src="/logo.png" className="logo" />
              <span className="brand">Sentinels AI Firewall</span>
            </div>
            <p className="logout-text">Are you sure you want to logout?</p>
            <div className="modal-buttons">
              <button className="btn-no" onClick={() => setShowLogout(false)}>No</button>
              <button className="btn-yes" onClick={logout}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}