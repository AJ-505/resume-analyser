const form = document.querySelector("#resume-form");
const file = document.querySelector("#file");
const fileName = document.querySelector(".file-upload__label");
const outputText = document.querySelector(".output__text");
const loader = document.querySelector(".loader");
const copyButton = document.querySelector(".copy-output-button");
const popupMessage = document.querySelector(".copied-popup-message");
const analyseResumeButton = document.querySelector(
  ".file-upload__submit-button"
);

let selectedFile;
let selectedFileName;
let fileHasChanged = false;

function hide(element) {
  if (!element.dataset.originalDisplay) {
    element.dataset.originalDisplay = getComputedStyle(element).display;
  }
  element.style.display = "none";
}

function show(element) {
  element.style.display = element.dataset.originalDisplay || "block";
}

hide(loader);
hide(copyButton);

async function sendData() {
  show(loader);
  hide(copyButton);
  hide(outputText);
  try {
    const formData = new FormData();
    formData.append("file", selectedFile, selectedFile.name);

    analyseResumeButton.style.pointerEvents = "none"; //Disallow the user from clicking the button until the process is completed
    const API_URL = "https://resume-analyser-api.onrender.com/analyse" // Remember to switch to "http://localhost:7000/analyse" in dev mode
    alert(API_URL);
    const result = await fetch(API_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });

    if (result && result.ok) {
      const text = await result.json();
      const processedText = processText(text.body);
      if (!processedText.trim()) {
        show(outputText);
        outputText.innerHTML =
          "<div>Unable to generate resume summary. Please Retry.</div>";
        return;
      }
      show(outputText);
      outputText.innerHTML = processedText;
      show(copyButton);
      hide(loader);
      analyseResumeButton.style.pointerEvents = "auto";
      /*89
      TODO: Decide whether to put the analysis in a new page,
            Or to use a carousel to display each section of the analysis.
            (Get feedback to help decide)
      */
      /*
      TODO: Create a carousel where all each sections of the summary are displayed nicely.
            Also add the option to view the comprehensive report on a page.
      */
    } else {
      show(outputText);
      outputText.innerHTML =
        "<div>Unable to generate resume summary. Please Retry.</div>";
      return;
    }
  } catch (error) {
    show(outputText);
    console.error("Error:", error);
    outputText.innerHTML =
      "<div>Unable to generate resume summary. Please Retry.</div>";
    return;
  } finally {
    hide(loader);
    analyseResumeButton.style.pointerEvents = "auto";
  }
}

file.addEventListener("change", (event) => {
  selectedFile = event.target.files[0];
  if (selectedFileName == selectedFile.name) {
    fileHasChanged = false;
    analyseResumeButton.textContent = "Re-Analyse Resume";
  } else {
    fileHasChanged = true;
    selectedFileName = selectedFile.name;
    analyseResumeButton.textContent = "Analyse Resume";
  }
  if (selectedFileName.length > 20) {
    const fileExt = selectedFileName.slice(
      selectedFileName.lastIndexOf("."),
      selectedFileName.length
    );
    selectedFileName = selectedFileName.slice(0, 16) + ".." + fileExt;
  }
  fileName.textContent = selectedFileName;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (selectedFile) {
    await sendData();
  } else {
    alert("Please upload a resume first.");
  }
  analyseResumeButton.textContent = "Re-Analyse Resume";
});

copyButton.addEventListener("click", async () => {
  const result = outputText.textContent.replaceAll("  ", "\n");
  await navigator.clipboard.writeText(result);
  showCopiedMessage();
});

function processText(text) {
  const start = text.indexOf("<div>");
  const end = text.lastIndexOf("</div>") + 6; // +6 to include </div>
  let result = text.slice(start, end);
  result = result.replaceAll("\\n", "");
  result = result.replaceAll("\\", "");
  return result;
}

function showCopiedMessage() {
  popupMessage.style.opacity = "1";
  setTimeout(() => {
    popupMessage.style.opacity = "0";
  }, 2000);
}
