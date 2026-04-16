import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import UserHome from "./pages/UserHome";
import LawyerHome from "./pages/LawyerHome";
import Chat from "./pages/Chat";
import CaseNotes from "./pages/CaseNotes";
import LawyerCases from "./pages/LawyerCases";
import AuthLayout from "./components/AuthLayout";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public Landing & Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={null} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/chat" element={<Chat />} />

        <Route path="/lawyer-home" element={<LawyerHome />} />

        <Route path="/lawyer-cases" element={<LawyerCases />} />

        <Route path="/notes" element={<CaseNotes />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;