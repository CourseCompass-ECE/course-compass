import { BASE_RESUME_ENDPOINT } from "./constants";
const AFFINDA_PARSER_API_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${import.meta.env.VITE_AFFINDA_RESUME_PARSER_API_KEY}`,
};
const RESUME = "Resume";
const END_OF_STRING_TO_REMOVE = "base64,";
const DUPLICATE_DOCUMENT_ERROR_CODE = "duplicate_document_error";
const DUPLICATE_DOCUMENT_ERROR_MESSAGE =
  "Résumé provided is a duplicate of a previously uploaded résumé. Please use a different résumé";
const FAILED_TO_PARSE_STORE_RESUME_ERROR =
  "Something went wrong parsing & storing your résumé. Please reupload your résumé";

export const successfullyDeleteExistingParsedResume = async (
  resumeId,
  setParsedResumeData
) => {
  try {
    const response = await fetch(`${BASE_RESUME_ENDPOINT}/${resumeId}`, {
      method: "DELETE",
      headers: AFFINDA_PARSER_API_HEADER,
    });

    if (response.ok) {
      setParsedResumeData(null);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const findParsedResume = async (setError, resumeFile, fullName) => {
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(resumeFile);
    reader.addEventListener(
      "load",
      async () => {
        try {
          let newBaseURL = reader.result.slice(
            reader.result.indexOf(END_OF_STRING_TO_REMOVE) +
              END_OF_STRING_TO_REMOVE.length
          );

          const resumeData = {
            file: newBaseURL,
            workspace: import.meta.env.VITE_WORKSPACE_ID,
            documentType: import.meta.env.VITE_DOCUMENT_TYPE_ID,
            rejectDuplicates: true,
            fileName: `${fullName}'s ${RESUME}`,
            compact: true,
            enableValidationTool: false,
          };

          const response = await fetch(BASE_RESUME_ENDPOINT, {
            method: "POST",
            headers: AFFINDA_PARSER_API_HEADER,
            body: JSON.stringify(resumeData),
          });

          if (response.ok) {
            const data = await response.json();
            resolve(data);
          } else {
            const errorObject = await response.json();
            if (
              errorObject?.errors &&
              errorObject?.errors[0]?.code === DUPLICATE_DOCUMENT_ERROR_CODE
            )
              setError(DUPLICATE_DOCUMENT_ERROR_MESSAGE);
            else setError(FAILED_TO_PARSE_STORE_RESUME_ERROR);

            resolve(null);
          }
        } catch (error) {
          setError(FAILED_TO_PARSE_STORE_RESUME_ERROR);
          resolve(null);
        }
      },
      false
    );
  });
};
