import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppHeader from "../AppHeader.jsx";
import ProtectedRoute from "../ProtectedRoute.jsx";
import Login from "../Login.jsx";
import SignUp from "../SignUp.jsx";   
import OddsPage from "../OddsPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OddsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  );
}
