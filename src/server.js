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

Your task is to perform a comprehensive, professional, and actionable analysis of the provided text, which is expected to be a resume or CV submitted by a job applicant. Your final response must be fully structured in valid HTML, using appropriate tags (e.g., <strong> for emphasis, <p> for paragraphs, <ul>/<li> for lists) so that the content can be easily styled on the frontend. Do not include any extraneous commentary beyond the structure specified.

Instructions:

1. <strong>Resume Verification</strong>
   - Determine if the provided text is a resume or CV.
   - If it is not, output exactly the following and stop further processing:
     <p><strong>This file you have uploaded is not a resume or CV.</strong></p>

2. <strong>Structured Analysis</strong> (if the text is a resume/CV)
   Provide your analysis in the sections below. Each section must be clearly marked using HTML headings, and your analysis should be concise yet rich in actionable insights. Include specific examples and recommendations wherever applicable.

   <h2>A. Resume Confirmation</h2>
   <ul>
     <li>Confirm that the uploaded file is indeed a resume or CV.</li>
   </ul>

   <h2>B. Job Application Suggestion</h2>
   <ul>
     <li>Suggest an appropriate job title or field based on the content (e.g., <strong>Entry-Level Software Engineer</strong>, <strong>Data Analyst Intern</strong>, etc.). Include a brief explanation for the suggestion.</li>
   </ul>

   <h2>C. Resume Summary</h2>
   <ul>
     <li>Provide a concise 2-3 sentence summary highlighting the candidate's key skills, qualifications, and relevant experience.</li>
   </ul>

   <h2>D. Detailed Analysis and Thought Process</h2>
   <ul>
     <li>Outline the key considerations and reasoning steps you took when analyzing the resume. Address elements such as education, technical skills, project experience, and any noticeable strengths or gaps.</li>
   </ul>

   <h2>E. Potential Improvements</h2>
   <ul>
     <li>List at least three specific, actionable suggestions to improve the resume.</li>
     <li>For each suggestion, include:
         <ul>
             <li><strong>Recommendation:</strong> Clearly state what should be changed or added.</li>
             <li><strong>Explanation:</strong> Briefly explain why this change is important and how it will improve the resume's organization, professional feel, and attractiveness.</li>
         </ul>
     </li>
     <li>Provide concrete examples where possible (e.g., how to format a section, wording for a professional summary, etc.).</li>
   </ul>

   <h2>F. Additional Feedback (Optional)</h2>
   <ul>
     <li>Offer any extra insights on formatting, clarity, or further refinements to enhance the resume’s overall presentation.</li>
     <li>Include recommendations for any areas that can exponentially increase the resume’s quality, such as reorganizing sections, adding quantifiable achievements, or using a modern design approach.</li>
   </ul>

Additional Guidelines:
- Use a clear, formal, and professional tone throughout.
- Ensure that the entire output is wrapped in valid HTML.
- Adhere strictly to the specified structure with no extra commentary.
- Focus solely on delivering a structured, actionable analysis that provides real value to job applicants.

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
