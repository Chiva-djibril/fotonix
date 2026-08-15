import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Book from "./pages/Book";
import Dashboard from "./pages/Dashboard";
import Albums from "./pages/Albums";
import PublicAlbum from "./pages/PublicAlbum";
import Feedback from "./pages/Feedback";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Notifications from "./pages/Notifications";
import FloatingChat from "./components/FloatingChat";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const titleMap = {
      "/": "Fotonix | Let your story shine",
      "/services": "Services | Fotonix Studio",
      "/contact": "Contact | Fotonix Studio",
      "/feedback": "Feedback | Fotonix Studio",
      "/login": "Login | Fotonix Studio",
      "/register": "Register | Fotonix Studio",
      "/book": "Booking | Fotonix Studio",
      "/albums": "Albums | Fotonix Studio",
      "/albums/public": "Shared Album | Fotonix Studio",
      "/dashboard": "Dashboard | Fotonix Studio",
      "/notifications": "Notifications | Fotonix Studio",
      "/admin-login": "Admin Login | Fotonix Studio",
      "/admin": "Admin | Fotonix Studio",
      "/admin-panel": "Admin | Fotonix Studio",
    };

    document.title = titleMap[location.pathname] || (location.pathname.startsWith("/albums") ? "Albums | Fotonix Studio" : "Fotonix Studio");
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#221e19",
            color: "#F4EEE1",
            border: "1px solid rgba(232,163,61,0.22)",
            fontFamily: "'Fraunces', serif",
            fontSize: "14px",
          },
        }}
      />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/book"
            element={
              <ProtectedRoute>
                <Book />
              </ProtectedRoute>
            }
          />
          <Route
            path="/albums/public/:slug"
            element={<PublicAlbum />}
          />
          <Route
            path="/albums"
            element={
              <ProtectedRoute>
                <Albums />
              </ProtectedRoute>
            }
          />
          <Route
            path="/albums/:id"
            element={
              <ProtectedRoute>
                <Albums />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
}
