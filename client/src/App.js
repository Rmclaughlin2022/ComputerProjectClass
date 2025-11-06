import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import Login from "../pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import Home from "../pages/Home.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  );
}
