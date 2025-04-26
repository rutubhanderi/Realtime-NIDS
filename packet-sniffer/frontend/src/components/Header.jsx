import { Activity, Info } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  
  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center space-x-3">
            <Activity className="text-blue-400" size={28} />
            <div>
              <h1 className="text-xl font-bold text-white">NetSift</h1>
              <p className="text-xs text-gray-400">Network Intrusion Detection System</p>
            </div>
          </Link>
          
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link 
                  to="/"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === "/" 
                      ? "text-blue-400 bg-gray-700" 
                      : "text-gray-300 hover:text-blue-400 hover:bg-gray-700"
                  }`}
                >
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/about"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === "/about" 
                      ? "text-blue-400 bg-gray-700" 
                      : "text-gray-300 hover:text-blue-400 hover:bg-gray-700"
                  }`}
                >
                  <Info size={18} />
                  <span>About</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;