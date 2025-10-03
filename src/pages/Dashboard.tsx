import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
