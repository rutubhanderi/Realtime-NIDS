import { Eye, EyeOff } from "lucide-react";

const LoginForm = ({
  username, setUsername,
  password, setPassword,
  showPassword, setShowPassword,
  loginError, handleLogin
}) => (
  <div className="max-w-md mx-auto mt-10 bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
    <h2 className="text-2xl font-bold text-center mb-6 text-blue-400">Login to NetCap Pro</h2>

    {loginError && (
      <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-4 text-sm">
        {loginError}
      </div>
    )}

    <form onSubmit={handleLogin}>
      <div className="mb-4">
        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
          placeholder="Enter your username"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white pr-10"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
        Sign In
      </button>
    </form>

    <div className="mt-4 text-center text-sm text-gray-400">
      <p>Demo credentials: "admin" / "password123"</p>
    </div>
  </div>
);

export default LoginForm;
