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

  // let result = await generateResponse(prompt);
  let result =
    "<think>Okay, let's start by verifying if this text is indeed a resume or CV. The content includes sections like EDUCATION, PROJECTS/ACHIEVEMENTS/AWARDS, VOLUNTEER ACTIVITIES, SKILLS AND INTERESTS, along with contact information. That structure is typical for a resume, so it's confirmed.\n\nNext, suggesting a job title. The candidate is pursuing a BSc in Computer Science with a focus on Full-Stack Web Development, proficient in React, Node.js, Rust, and Python. Projects like PAU Compass and awards indicate a strong technical background. An appropriate role might be Entry-Level Full-Stack Developer or Software Engineer Intern.\n\nFor the summary, highlight their education, technical skills in full-stack development, programming languages, and relevant projects. Mention academic excellence and leadership in volunteer activities.\n\nIn the detailed analysis, assess each section. Education shows a strong academic record with relevant courses. Technical skills are solid, but the project section is sparse. Volunteer experience shows leadership, but more detail could help. Strengths include high GPA and diverse skills, but gaps might be lack of work experience and limited project details.\n\nPotential improvements: Elaborate on projects to show impact, add more technical skills like databases or version control, and include professional experience even if through internships or part-time roles. These improvements would make the resume more compelling.\n\nAdditional feedback could address formatting consistency, using bullet points uniformly, and ensuring all dates are present. Also, adding measurable outcomes to projects would strengthen them.\n</think>\n\n<div>\n  <h2>A. Resume Confirmation</h2>\n  <ul>\n    <li>The uploaded file is confirmed to be a resume/CV, containing standard sections such as contact information, education, projects, skills, and volunteer experience.</li>\n  </ul>\n\n  <h2>B. Job Application Suggestion</h2>\n  <ul>\n    <li><strong>Entry-Level Full-Stack Developer</strong> or <strong>Software Engineering Intern</strong>, given the candidate’s focus on web development, programming languages, and academic alignment with computer science.</li>\n  </ul>\n\n  <h2>C. Resume Summary</h2>\n  <ul>\n    <li>A motivated Computer Science student with a First Class academic standing, proficient in Full-Stack Web Development (HTML, CSS, JavaScript, React, Node.js) and programming languages like Rust and Python. Demonstrated leadership through organizing tech events and developing educational tools like PAU Compass. Strong foundation in UI/UX design, data science, and problem-solving.</li>\n  </ul>\n\n  <h2>D. Detailed Analysis and Thought Process</h2>\n  <ul>\n    <li><strong>Education</strong>: High CGPA (4.81) and relevant coursework (e.g., Problem-Solving, Linear Algebra) signal strong analytical abilities. The expected 2028 graduation date suggests the candidate is early in their academic journey.</li>\n    <li><strong>Technical Skills</strong>: Full-stack and language proficiencies (Rust, Python) align with backend and data science roles, but frameworks like React/Node.js could benefit from project examples.</li>\n    <li><strong>Projects/Achievements</strong>: PAU Compass highlights initiative, but the description lacks technical depth (e.g., tools used, impact). The Best Graduating Student award underscores academic excellence.</li>\n    <li><strong>Gaps</strong>: Limited professional experience and sparse project details reduce visibility into real-world application of skills. Volunteer activities show leadership but need more context on responsibilities.</li>\n  </ul>\n\n  <h2>E. Potential Improvements</h2>\n  <ul>\n    <li><strong>Expand Project Descriptions</strong>: Add specifics like technologies used, challenges overcome, and measurable outcomes (e.g., “Built PAU Compass using React and Firebase, reducing resource access time by 30%”). This clarifies technical competency.</li>\n    <li><strong>Include Technical Tools</strong>: Mention databases (SQL/NoSQL), version control (Git), or cloud platforms to broaden appeal for full-stack roles. These are often expected in developer job descriptions.</li>\n    <li><strong>Add Professional Experience Section</strong>: Even informal roles (freelancing, internships) or academic collaborations can demonstrate practical skills and teamwork.</li>\n  </ul>\n\n  <h2>F. Additional Feedback</h2>\n  <ul>\n    <li><strong>Formatting Consistency</strong>: Align dates to the right margin for easier scanning. Use bullet points uniformly across all sections.</li>\n    <li><strong>Clarify Timeline</strong>: The PAU Compass project is listed for February 2025, which is future-dated. Ensure all entries reflect completed or ongoing work.</li>\n    <li><strong>Prioritize Skills</strong>: Group technical skills (e.g., “Web Development,” “Programming Languages”) under subheadings to improve readability.</li>\n  </ul>\n</div>";
  response.json({ body: result });
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log("Server has started at port " + PORT));

/*
AI connection is up and running. Next steps:
. Ask other AI (claude, ChatGPT, DeepSeek himself, Gemini etc(do it in reverse sequential order, starting from Gemini), for ways that I can improve the prompt.)
. Tell DeepSeek to give me a furnished final output, which is a comprehensive summary of all that he has said according to my prompt
. Ensure proper connection between frontend and backend, and ensure the output is being put into the textarea correctly.
. Delete all file uploads after showing the AI response to the user. (Ensure to create a duplicate to avoid accidental deletion of wrong files during testing)
. Add a button for Comprehensive Analysis or Brief Summary (get feedback before implementing this)
. Enhance the frontend styling (the inputs, positioning of the container, special effects, increase aesthetic qualities and so on) (get feedback on this) ✅
. Clean up code and make it readable and modularised ✅
. Convert it to TypeScript
*/
