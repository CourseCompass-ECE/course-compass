import CreateAccountButton from "./CreateAccountButton";
import { CONTINUE, GENERIC_ERROR } from "../../utils/constants";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import {
  findParsedResume,
  successfullyDeleteExistingParsedResume,
} from "../../utils/resumeHelperFunctions";
import ParsingLoader from "./ParsingLoader";

const CreateAccountStepThree = (props) => {
  const [resumeError, setResumeError] = useState("");
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);
  const fileInputRef = useRef();

  const STEP_TITLE = "Add Your Résumé";
  const BEFORE_DRAG_INSTRUCTIONS =
    "Drag & drop your résumé or click here to select it (pdf, docx)";
  const AFTER_DRAG_INSTRUCTIONS = "Drop your résumé here!";
  const FILE_TYPES_TO_ACCEPT =
    "application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const INVALID_FILE_TYPE = "Please provide a valid file type: pdf, docx";
  const MISSING_RESUME =
    "Please upload a résumé with one of the following file types: pdf, docx";
  const DEFAULT_PDF_ZOOM = 0.7;
  const UPDATE_RESUME = "Update Résumé";
  const LOADING_DOCX_TEXT = "Loading your docx file...";

  const submitStepThree = (event) => {
    event.preventDefault();
    if (props.resume) {
      props.setCurrentStep(props.currentStep + 1);
    } else {
      setResumeError(MISSING_RESUME);
    }
  };

  const onDrop = useCallback(
    async (fileArray) => {
      setResumeError("");
      let validFileTypes = FILE_TYPES_TO_ACCEPT.split(",");

      if (fileArray.length > 0 && validFileTypes.includes(fileArray[0].type)) {
        if (
          props.parsedResumeData &&
          !(await successfullyDeleteExistingParsedResume(
            props.parsedResumeData?.meta?.identifier,
            props.setParsedResumeData
          ))
        ) {
          setResumeError(GENERIC_ERROR);
          return;
        }

        props.setResume(fileArray[0]);

        let isPdfFile = validFileTypes.slice(0, 2).includes(fileArray[0].type);
        let resumeUri = isPdfFile
          ? window.URL.createObjectURL(fileArray[0])
          : await generateParsedResumeAndPdfUrlFromDocx(fileArray[0]);
        setIsLoadingDocx(false);

        if (resumeUri)
          props.setResumeToDisplay([
            {
              uri: resumeUri,
              fileName: fileArray[0].name,
            },
          ]);
        else props.setResumeToDisplay(null);
      } else {
        setResumeError(INVALID_FILE_TYPE);
      }

      fileInputRef.current.value = null;
    },
    [props.parsedResumeData]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const generateParsedResumeAndPdfUrlFromDocx = async (resumeFile) => {
    setIsLoadingDocx(true);
    const parsedResumeData = await findParsedResume(
      setResumeError,
      resumeFile,
      props.fullName
    );

    if (!parsedResumeData) {
      props.setResume(null);
      props.setParsedResumeData(null);
      return null;
    } else {
      props.setParsedResumeData(parsedResumeData);
      const pdfUrl = parsedResumeData?.meta?.pdf;
      const response = await fetch(pdfUrl);
      const blobData = await response.blob();
      return URL.createObjectURL(blobData);
    }
  };

  return (
    <section className="create-account-form">
      <h1 className="create-account-form-title">{STEP_TITLE}</h1>
      <input
        {...getInputProps()}
        ref={fileInputRef}
        accept={FILE_TYPES_TO_ACCEPT}
      />

      {!props.resumeToDisplay ? (
        <div
          {...getRootProps()}
          className="resume-upload-container"
          style={
            isDragActive
              ? {
                  backgroundColor: "var(--background-mixed)",
                  borderWidth: "3px",
                }
              : {}
          }
          onClick={() => fileInputRef.current.click()}
        >
          <div
            className="resume-upload-background"
            style={
              isDragActive
                ? { background: "linear-gradient(135deg, #c3dafe, #e0c3fc)" }
                : {}
            }
          />
          <div className="resume-upload-items">
            <span className="material-symbols-outlined resume-upload-icon">
              cloud_upload
            </span>
            {isDragActive ? (
              <p>{AFTER_DRAG_INSTRUCTIONS}</p>
            ) : (
              <p>{BEFORE_DRAG_INSTRUCTIONS}</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <DocViewer
            key={
              props.resumeToDisplay
                ? props.resumeToDisplay[0].uri
                : "empty-display"
            }
            documents={props.resumeToDisplay}
            config={{
              pdfZoom: {
                defaultZoom: DEFAULT_PDF_ZOOM,
              },
            }}
            pluginRenderers={DocViewerRenderers}
          />
          <div
            className="update-resume-container"
            onClick={() => fileInputRef.current.click()}
          >
            <div className="update-resume-button">{UPDATE_RESUME}</div>
          </div>
        </>
      )}

      <ParsingLoader
        isLoading={isLoadingDocx}
        loadingText={LOADING_DOCX_TEXT}
      />
      <span className="resume-upload-error">{resumeError}</span>

      <CreateAccountButton
        buttonText={CONTINUE}
        submitStepThree={submitStepThree}
      />
    </section>
  );
};

export default CreateAccountStepThree;
