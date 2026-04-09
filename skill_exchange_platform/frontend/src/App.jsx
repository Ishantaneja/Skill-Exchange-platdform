import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Skills from './pages/Skills';
import Requests from './pages/Requests';
import Sessions from './pages/Sessions';
import Rating from './pages/Rating';
import Home from './pages/Home';
import Admin from './pages/Admin';
import ChatInbox from './pages/ChatInbox';
import './App.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />
        <Route
          path="/requests"
          element={<ProtectedRoute><Requests /></ProtectedRoute>}
        />
        <Route
          path="/sessions"
          element={<ProtectedRoute><Sessions /></ProtectedRoute>}
        />
        <Route
          path="/chat"
          element={<ProtectedRoute><ChatInbox /></ProtectedRoute>}
        />
        <Route
          path="/chat/:sessionId"
          element={<ProtectedRoute><ChatInbox /></ProtectedRoute>}
        />
        <Route
          path="/rating/:sessionId"
          element={<ProtectedRoute><Rating /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute><Admin /></ProtectedRoute>}
        />
      </Routes>
    </Layout>
  );
}

export default App;
