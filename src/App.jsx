import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CatalogPage from "./pages/CatalogPage";
import FurnitureDetailPage from "./pages/FurnitureDetailPage";
import DashboardPage from "./pages/DashboardPage";
import AdminFurnitureListPage from "./pages/AdminFurnitureListPage";
import AdminFurnitureFormPage from "./pages/AdminFurnitureFormPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";

// AR pulls in Three.js + @react-three/xr (~1MB) - keep it out of the main
// bundle entirely, load only when the person navigates to /ar.
const ARPage = lazy(() => import("./pages/ARPage"));

function HomeRedirect() {
  const { isStaff } = useAuth();
  return <Navigate to={isStaff ? "/admin" : "/catalog"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/furniture/:idOrSlug" element={<FurnitureDetailPage />} />
          <Route
            path="/ar"
            element={
              <Suspense fallback={<div className="page-loading">AR yuklanmoqda...</div>}>
                <ARPage />
              </Suspense>
            }
          />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute staffOnly>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/furniture"
            element={
              <ProtectedRoute staffOnly>
                <AdminFurnitureListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/furniture/new"
            element={
              <ProtectedRoute staffOnly>
                <AdminFurnitureFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/furniture/:id/edit"
            element={
              <ProtectedRoute staffOnly>
                <AdminFurnitureFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute staffOnly>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
