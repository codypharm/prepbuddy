import React from "react";
import { Upload, FileText, Download } from "lucide-react";
import { StudyGroup, GroupFile } from "../types";

interface GroupFilesProps {
  group: StudyGroup;
  isAdmin: boolean;
  onUploadFile: () => void;
  onFileDownload: (file: GroupFile) => void;
}

const GroupFiles: React.FC<GroupFilesProps> = ({
  group,
  isAdmin,
  onUploadFile,
  onFileDownload,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Study Files ({(group.files || []).length})
        </h3>
        {isAdmin && (
          <button
            onClick={onUploadFile}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </button>
        )}
      </div>

      {(group.files?.length || 0) > 0 ? (
        <div className="space-y-3">
          {(group.files || []).map((file) => (
            <div
              key={file.id}
              className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {file.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Uploaded by {file.uploadedBy} •{" "}
                  {file.uploadedAt.toLocaleDateString()} •{" "}
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Content: {file.content.length.toLocaleString()}{" "}
                  characters
                </p>
              </div>
              <button
                onClick={() => onFileDownload(file)}
                className="ml-3 p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-gray-700"
                title="Download file"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Files Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {isAdmin
              ? "Upload study materials for your group members."
              : "The group admin will upload study materials."}
          </p>
        </div>
      )}
    </div>
  );
};

export default GroupFiles;
