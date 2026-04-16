import { useLocation, useNavigate } from "react-router-dom";

export default function Lawyer() {
  const location = useLocation();
  const navigate = useNavigate();

  const lawyers = location.state?.lawyers || [];

  return (
    <div className="h-screen flex bg-gray-100">

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600 mb-8">
            ⚖️ Legal AI
          </h2>

          <nav className="space-y-4">
            <p
              onClick={() => navigate("/")}
              className="text-gray-700 font-medium cursor-pointer hover:text-blue-600"
            >
              Dashboard
            </p>

            <p
              onClick={() => navigate("/chat")}
              className="text-gray-700 font-medium cursor-pointer hover:text-blue-600"
            >
              Chat Assistant
            </p>

            <p className="text-blue-600 font-semibold">
              Lawyer Recommendations
            </p>
          </nav>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mt-6 bg-gray-200 hover:bg-gray-300 text-sm py-2 rounded"
        >
          ⬅ Back
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">

        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          👨‍⚖️ Recommended Lawyers
        </h2>

        {/* No Data */}
        {lawyers.length === 0 ? (
          <div className="text-gray-500 text-center mt-20">
            <p>No recommendations available.</p>
            <button
              onClick={() => navigate("/chat")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to Chat
            </button>
          </div>
        ) : (

          /* Lawyer Cards */
          <div className="grid gap-6 md:grid-cols-2">
            {lawyers.map((lawyer, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {lawyer.title}
                </h3>

                <p className="text-sm text-gray-500 mb-3">
                  Verified legal resource
                </p>

                {/* Clickable Link */}
                <a
                  href={lawyer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  🔗 Visit Website
                </a>

                {/* Button */}
                <div className="mt-4">
                  <button
                    onClick={() => window.open(lawyer.url, "_blank")}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}