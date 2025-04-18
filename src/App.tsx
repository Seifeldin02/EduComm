// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Welcome from "@/views/welcome/WelcomePage";
import Register from "@/views/register/RegisterPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        // User Management Module
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
