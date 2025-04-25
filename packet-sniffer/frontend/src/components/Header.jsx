import { Activity } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-3">
            <Activity className="text-blue-400" size={28} />
            <div>
              <h1 className="text-xl font-bold text-white ">NetGuard</h1>
              <p className="text-xs text-gray-400">Network Intrusion Detection System</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;