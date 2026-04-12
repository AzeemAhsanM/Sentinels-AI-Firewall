export default function Privacy() {

return (
  <div className="welcome">

    {/* NAVBAR */}
    <nav className="nav">
      <div className="nav-left">
        <img src="/logo.png" className="logo"/>
        <span className="brand">Sentinels AI Firewall</span>
      </div>
    </nav>

    {/* CONTENT */}
    <div className="welcome-content" style={{maxWidth:"800px"}}>

      <h1>Privacy Policy</h1>

      <p style={{marginTop:"20px"}}>
        <strong>Privacy Policy for Sentinels AI Firewall</strong>
      </p>

      <p>
        Sentinels AI Firewall is a browser extension designed to prevent accidental
        sharing of sensitive information with AI chat platforms such as ChatGPT,
        Claude, and Gemini.
      </p>

      <p>
        The extension analyzes prompts entered by the user before they are sent
        to AI models in order to detect sensitive data such as API keys,
        passwords, tokens, and database credentials.
      </p>

      <p>
        Prompts may be temporarily sent to a secure backend service for
        security analysis and sanitization. The backend returns a sanitized
        version of the prompt with sensitive information removed before it is
        sent to the AI model.
      </p>

      <p>
        Sentinels AI Firewall does <strong>not store user prompts</strong>.
        Prompt data is processed only for the purpose of detecting sensitive
        information and is immediately discarded after analysis.
      </p>

      <p>
        Sentinels AI Firewall does not sell, share, or transfer user data to
        third parties.
      </p>

      <p>
        Only minimal data required for security analysis is processed in order
        to detect potential exposure of confidential information.
      </p>

      <p>
        If you have questions about this privacy policy, please contact the
        developer.
      </p>

    </div>

  </div>
)
}