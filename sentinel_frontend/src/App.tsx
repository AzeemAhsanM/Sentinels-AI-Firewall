import { BrowserRouter, Routes, Route } from "react-router-dom"

import Landing from "./pages/Landing"
import Dashboard from "./pages/Dashboard"
import Welcome from "./pages/Welcome"
import Privacy from "./pages/Privacy"

export default function App() {

return (

<BrowserRouter>

<Routes>

<Route path="/" element={<Landing />} />
<Route path="/welcome" element={<Welcome />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/privacy" element={<Privacy />} />

</Routes>

</BrowserRouter>

)

}