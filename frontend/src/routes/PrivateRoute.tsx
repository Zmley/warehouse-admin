import { Routes, Route } from "react-router-dom";
import Profile from "../pages/Profile";
import { useContext, useEffect } from "react";
import { AuthContext } from "../contexts/auth";
import Dashboard from "../pages/Dashboard";
import AdminManagement from "../pages/AdminManagement";

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!;
  useEffect(() => {
    getMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route
        path="/admin-management/:warehouseId"
        element={<AdminManagement />}
      />{" "}
    </Routes>
  );
};

export default PrivateRoutes;
