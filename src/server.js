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
Please analyze the following text: ${fileText}

Your task is to perform a thorough, professional analysis of the provided text, which is expected to be a resume or CV submitted by a job applicant. Follow the instructions below meticulously. Your output must be comprehensive, clear, and actionable. Ensure that your final response is fully structured in valid HTML. Use appropriate HTML tags (for example, <strong> for emphasis, <p> for paragraphs, and <ul>/<li> for lists) so that the content can be easily styled on the frontend. Do not include any extraneous commentary beyond the structure specified.

Instructions:

1. <strong>Resume Verification</strong>  
   - First, determine if the provided text is indeed a resume or CV.  
   - If the text is not a resume or CV, output exactly the following and stop further processing:
     <p><strong>This file you have uploaded is not a resume or CV.</strong></p>

2. <strong>Structured Analysis</strong> (if the text is a resume/CV)  
   Provide your analysis in the following sections. Each section must be clearly marked using HTML headings so that individual sections can be displayed or hidden on the frontend as needed.

   <h2>A. Resume Confirmation</h2>
   <ul>
     <li>Briefly confirm that the uploaded file is indeed a resume or CV.</li>
   </ul>

   <h2>B. Job Application Suggestion</h2>
   <ul>
     <li>Based on the content, suggest an appropriate job title or field (for example, <strong>Entry-Level Software Engineer</strong>, <strong>Data Analyst Intern</strong>, etc.).</li>
   </ul>

   <h2>C. Resume Summary</h2>
   <ul>
     <li>Provide a concise 2-3 sentence summary highlighting the candidate's key skills, qualifications, and relevant experience.</li>
   </ul>

   <h2>D. Detailed Analysis and Thought Process</h2>
   <ul>
     <li>Outline the key considerations and reasoning steps you took in analyzing the resume. This should include assessments of education, technical skills, project experience, and any noticeable strengths or gaps.</li>
   </ul>

   <h2>E. Potential Improvements</h2>
   <ul>
     <li>List at least three specific suggestions to improve the resume.</li>
     <li>For each suggestion, provide a bullet point that includes both the recommendation and a brief explanation of why it is important.</li>
     <li>Avoid including or emphasizing sensitive personal information (such as exact academic standings or CGPA) in your recommendations.</li>
   </ul>

   <h2>F. Additional Feedback (Optional)</h2>
   <ul>
     <li>If relevant, offer any extra insights regarding formatting, clarity, or further refinements to enhance the resume’s overall presentation.</li>
   </ul>

Additional Guidelines:
- Use a clear, formal, and professional tone throughout your analysis.
- Ensure that the entire output is wrapped in valid HTML.
- Use HTML tags appropriately: use <strong> to highlight key details, <p> for paragraph breaks, and <ul>/<li> for lists.
- Focus solely on delivering a structured, actionable analysis that aligns exactly with the sections outlined above.
- Avoid any extraneous commentary or instructions beyond the specified structure.

Please provide your final output exactly following this HTML structure.
`;

  let result = await generateResponse(prompt);
  response.json({ body: result });
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log("Server has started at port " + PORT));

/*
TODO:
. Brainstorm for ways that I can improve the AI prompt to obtain better results.)
. Delete all file uploads after showing the AI response to the user.
. Consider adding a button for Comprehensive Analysis or Brief Summary, with different prompts depending on user input (get feedback before implementing this)
. Improve UI&UX design and increase aesthetical quality.
. Convert entire codebase to TypeScript
*/
