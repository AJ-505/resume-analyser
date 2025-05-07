import express from "express";
import { config } from "dotenv";
import multer from "multer";
import { readFileSync } from "fs";
import mammoth from "mammoth";
import cors from "cors";
import parsePdf from "./parse-pdf.cjs";
import generateResponse from "./ai-connection.js";

const app = express();
config();

//Add the middleware for handling JSON and CORS
app.use(cors({ origin: "*" }));
app.use(express.json());

let uploads = multer({
  dest: "uploads/",
});

const acceptableFileTypes = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

app.post("/analyse", uploads.single("file"), async (request, response) => {
  const file = request.file;
  const fileType = file.mimetype;
  const filePath = file.path;
  let fileText;

  switch (fileType) {
    case acceptableFileTypes[0]:
      fileText = String(readFileSync(filePath));
      break;

    case acceptableFileTypes[1]:
      fileText = await parsePdf(filePath);
      fileText = fileText.text.trim();
      break;

    case acceptableFileTypes[2]:
      fileText = await mammoth.extractRawText({
        path: filePath,
      });
      fileText = fileText.value.trim();
      break;
    default:
      console.error("Unsupported file type");
      break;
  }

  const prompt = `
You are an expert career assistant and resume analyst.

You will analyze the following text input (expected to be a resume or CV) and produce a professional, clear, and fully structured analysis in clean, valid HTML. Wrap all the cleanly formatted HTML in a single <div> element. This output will be rendered directly on a frontend interface — avoid any non-HTML content or commentary outside the specified structure.

TEXT TO ANALYZE:
---------------
${fileText}
---------------

Your response must strictly follow the HTML structure and sections outlined below:

---

1. <strong>Resume Validation</strong>  
Check if the uploaded text resembles a resume or CV.  
- If **not a resume**, immediately return the following and stop further output:
  <p><strong>This file you have uploaded is not a resume or CV.</strong></p>

---

2. <strong>Resume Analysis</strong>  
If it **is** a resume, perform a deep, structured analysis under the following clearly defined HTML sections:

<h2>A. Resume Confirmation</h2>
<ul>
  <li>Confirm that the uploaded file is a resume or CV.</li>
</ul>

<h2>B. Suggested Job Title or Field</h2>
<ul>
  <li>Suggest a suitable job title or field based on the candidate’s background (e.g., <strong>Front-End Developer Intern</strong>, <strong>AI Research Assistant</strong>, etc.). Provide a one-sentence explanation.</li>
</ul>

<h2>C. Professional Summary</h2>
<ul>
  <li>Provide a 2-3 sentence executive summary capturing the candidate’s core strengths, technical skills, and standout experience.</li>
</ul>

<h2>D. Evaluation and Thought Process</h2>
<ul>
  <li>Explain your reasoning and evaluation method, addressing education, technical stack, projects, achievements, and leadership/volunteering experience.</li>
</ul>

<h2>E. Targeted Improvement Suggestions</h2>
<ul>
  <li>List <strong>at least three</strong> clear and actionable resume improvement tips.</li>
  <li>For each tip, provide:
    <ul>
      <li><strong>Recommendation:</strong> State what should be added, changed, or removed.</li>
      <li><strong>Explanation:</strong> Justify why it matters and how it improves impact or clarity.</li>
      <li>Give an example or mini-template if applicable.</li>
    </ul>
  </li>
</ul>

<h2>F. Additional Formatting or Presentation Feedback (Optional)</h2>
<ul>
  <li>Suggest enhancements to visual appeal, section ordering, fonts, spacing, or content clarity.</li>
  <li>Note any ATS-compatibility issues or keyword optimization advice.</li>
</ul>

---

Additional Rules:
- Maintain a formal, clear, and supportive tone.
- Your full response must be enclosed in clean, semantic HTML.
- Avoid repetition. Be concise but comprehensive.
- Do not include the original resume content in your output.
- Do not break out of HTML mode or add markdown, JSON, or extra labels.

Begin your analysis now.
`;

  let result = await generateResponse(prompt);
  response.json({ body: result });
  //TODO: Clear the uploads folder after all the operations have been carried out. Highly important during production.
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log("Server has started at port " + PORT));

/*
TODO:
. Brainstorm for ways that I can improve the AI prompt to obtain better results.)
. Delete all file uploads after showing the AI response to the user.
. Consider adding a button for Comprehensive Analysis or Brief Summary, with different prompts depending on user input (get feedback before implementing this)
. Improve UI&UX design and increase aesthetical quality.
*/
