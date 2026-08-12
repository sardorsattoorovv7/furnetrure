import { useEffect, useState } from "react";
import { listFurniture, listCategories } from "../api/furniture";
import { listProjects } from "../api/projects";

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    furniture: 0,
    withModel: 0,
    categories: 0,
    projects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [furn, cats, projs] = await Promise.all([
        listFurniture({ page_size: 100 }),
        listCategories(),
        listProjects(),
      ]);
      const furnResults = furn.results ?? furn;
      setStats({
        furniture: furn.count ?? furnResults.length,
        withModel: furnResults.filter((f) => f.has_3d_model).length,
        categories: (cats.results ?? cats).length,
        projects: (projs.results ?? projs).length,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="page-loading">Yuklanmoqda...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="stat-grid">
        <StatCard label="Jami mebel" value={stats.furniture} />
        <StatCard label="3D modeli bor" value={stats.withModel} />
        <StatCard label="Kategoriyalar" value={stats.categories} />
        <StatCard label="Loyihalar" value={stats.projects} />
      </div>
    </div>
  );
}
