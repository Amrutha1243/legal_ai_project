import Chat from "./Chat";
import { useAuth } from "../auth/AuthContext";

export default function UserHome() {
  const { logout } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
        <h1 className="text-lg font-semibold">
          Legal AI – User Portal
        </h1>
        <button
          onClick={logout}
          className="text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </div>

      {/* CHAT */}
      <div className="flex-1">
        <Chat />
      </div>
    </div>
  );
}
