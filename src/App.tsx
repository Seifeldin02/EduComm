// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Welcome from "@/views/welcome/WelcomePage";
import RoleSelector from "@/views/register/RoleSelector";
import StudentRegisterPage from "@/views/register/student/RegisterPage";
import LecturerRegisterPage from "@/views/register/lecturer/RegisterPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        // User Management Module
        <Route path="/register" element={<RoleSelector />} />
        <Route path="/register/student" element={<StudentRegisterPage />} />
        <Route
          path="/register/lecturer"
          element={<LecturerRegisterPage />}
        />{" "}
      </Routes>
    </Router>
  );
}

export default App;
