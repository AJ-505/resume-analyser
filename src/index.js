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
      output.textContent = text.body;
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
