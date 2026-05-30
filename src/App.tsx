/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Pillars from "./pages/Pillars";
import PillarDetail from "./pages/PillarDetail";
import Transparency from "./pages/Transparency";
import Partners from "./pages/Partners";
import Documents from "./pages/Documents";
import News from "./pages/News";
import Join from "./pages/Join";
import Constitution from "./pages/Constitution";
import Shop from "./pages/Shop";
import Chapters from "./pages/Chapters";
import Projects from "./pages/Projects";
import ContactFAQ from "./pages/ContactFAQ";

import Dashboard from "./pages/Dashboard";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import TreasurerDashboard from "./pages/TreasurerDashboard";
import LoginPage from "./pages/LoginPage";

import BusinessManagerDashboard from "./pages/BusinessManagerDashboard";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="4h-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="pillars" element={<Pillars />} />
            <Route path="pillars/:id" element={<PillarDetail />} />
            <Route path="transparency" element={<Transparency />} />
            <Route path="partners" element={<Partners />} />
            <Route path="documents" element={<Documents />} />
            <Route path="news" element={<News />} />
            <Route path="join" element={<Join />} />
            <Route path="cbl" element={<Constitution />} />
            <Route path="shop" element={<Shop />} />
            <Route path="chapters" element={<Chapters />} />
            <Route path="projects" element={<Projects />} />
            <Route path="contact-faq" element={<ContactFAQ />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/secretary" element={<SecretaryDashboard />} />
          <Route path="/treasurer" element={<TreasurerDashboard />} />
          <Route path="/business" element={<BusinessManagerDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
