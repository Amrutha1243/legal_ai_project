export default function DocumentUpload({
  selectedFile,
  setSelectedFile,
  disabled = false,
}) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExts = [".pdf", ".docx", ".txt"];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExts.includes(fileExt) && file.type !== "application/pdf") {
      alert("Only PDF, DOCX, and TXT files are supported.");
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="border-t bg-white p-4 space-y-3">

      {/* ===== TITLE ===== */}
      <p className="text-sm font-medium text-gray-700">
        Upload a legal document (PDF, Word, Text)
      </p>

      {/* ===== FILE INPUT ===== */}
      <label
        className={`flex items-center justify-center border-2 border-dashed rounded-md p-4 cursor-pointer text-sm ${
          disabled
            ? "bg-gray-100 border-gray-300 cursor-not-allowed"
            : "border-gray-300 hover:border-blue-400"
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        {selectedFile ? (
          <span className="text-gray-700">
            📄 {selectedFile.name}
          </span>
        ) : (
          <span>Click to select a document</span>
        )}
      </label>

      {/* ===== FILE ACTIONS ===== */}
      {selectedFile && !disabled && (
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>File ready to be analyzed</span>
          <button
            onClick={removeFile}
            className="text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {/* ===== HELPER TEXT ===== */}
      <p className="text-xs text-gray-500">
        Supported format: PDF, DOCX, TXT • Max size depends on server limits
      </p>
    </div>
  );
}
