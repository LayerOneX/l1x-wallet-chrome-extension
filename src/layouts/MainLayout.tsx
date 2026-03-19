import { Outlet } from "react-router-dom";
import BottomNav from "@ui/BottomNav";

const MainLayout = () => {
  return (
    <div className="app-frame">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
