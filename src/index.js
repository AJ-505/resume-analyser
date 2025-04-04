//TODO: Convert all codebase to typescript
const form = document.querySelector("#resume-form");
const file = document.querySelector("#file");
const fileName = document.querySelector(".file-upload__label");
const output = document.querySelector("#output");
let selectedFile;

async function sendData() {
  try {
    const formData = new FormData();
    formData.append("file", selectedFile, selectedFile.name);

    const result = await fetch("http://localhost:7000/analyse", {
      method: "POST",
      body: formData,
    });

    if (result.ok) {
      const text = await result.json();
      output.innerHTML = text.body;
      /*
      TODO: Decide whether to put the analysis in a new page,
            Or to use a carousel to display each section of the analysis.
            (Get feedback to help decide)
      */
      /*
      TODO: Create a carousel where all each sections of the summary are displayed nicely.
            Also add the option to view the comprehensive report on a page.
      */
    } else {
      output.textContent = "Unable to generate resume summary.";
      return;
    }
  } catch (error) {
    output.textContent = "Unable to generate resume summary.";
    console.error(error);
    return;
  }
}

file.addEventListener("change", (event) => {
  selectedFile = event.target.files[0];
  fileName.textContent = selectedFile.name;
  //TODO: When the fileName is too long, the button should show, for example, "MICHAEL JOHN BRADY'S RE....pdf", to illustrate.
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  output.textContent = "Analysing your resume...";
  if (selectedFile) {
    await sendData();
  } else {
    alert("Please upload a resume first.");
  }
});
