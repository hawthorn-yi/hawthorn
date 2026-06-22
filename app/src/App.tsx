import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Board = lazy(() => import("./pages/Board"));
const HistoryPage = lazy(() => import("./pages/History"));
const Categories = lazy(() => import("./pages/Categories"));
const AttachmentsList = lazy(() => import("./pages/AttachmentsList"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Admin = lazy(() => import("./pages/Admin"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Account = lazy(() => import("./pages/Account"));
const FollowUp = lazy(() => import("./pages/FollowUp"));
const Mentions = lazy(() => import("./pages/Mentions"));
const MyMentions = lazy(() => import("./pages/MyMentions"));
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#94A3B8]">加载中...</p>
        </div>
      </div>
    }>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/board"
        element={
          <ProtectedRoute>
            <Board />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attachments"
        element={
          <ProtectedRoute>
            <AttachmentsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <AdminRoute>
            <Analytics />
          </AdminRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route
        path="/follow-up"
        element={
          <ProtectedRoute>
            <FollowUp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentions"
        element={
          <ProtectedRoute>
            <Mentions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-mentions"
        element={
          <ProtectedRoute>
            <MyMentions />
          </ProtectedRoute>
        }
      />
     </Routes>
    </Suspense>
  );
}
