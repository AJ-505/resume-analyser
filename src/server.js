const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fetch = require("node-fetch");
const cors = require("cors");

dotenv.config();
const apiKey = process.env.HUGGINGFACE_API_KEY;
const app = express();

//Add the middleware for handling JSON and CORS
app.use(cors({ origin: "*" }));
app.use(express.json());

//Initialise multer
let uploads = multer({
  dest: "uploads/",
});

const acceptableFileTypes = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

app.post("/analyse", uploads.single("file"), async (request, response) => {
  /*
  1. Read the file contents as text (refer to best practices and the node fs documentation)
  1.1. Check for the file type, if it's a pdf, txt or docx file. (I may have to debug to see it (using console.log))
  1.2. Use the necessary libraries to parse each of the file types depending, and get the text content.
  2. Feed the text content to the API, passing in the API key
  3. Get back the response and convert it into a readable format using the .json() method (Make reference to HUGGINGFACE_API_DOCS)
  4. Pass the response back to the caller of the POST request (index2.js)
  5. 
  
  */
  const file = request.file;
  const fileType = file.mimetype;
  const filePath = file.path;
  let fileText;

  switch (fileType) {
    case acceptableFileTypes[0]:
      //.txt files
      fileText = String(fs.readFileSync(filePath));
      break;

    case acceptableFileTypes[1]:
      //.pdf files
      fileText = await pdfParse(filePath);
      fileText = fileText.text.trim();
      break;

    case acceptableFileTypes[2]:
      //.docx files
      fileText = await mammoth.extractRawText({
        path: filePath,
      });
      fileText = fileText.value.trim();
      console.log(fileText);
      break;
    default:
      console.error("Unsupported file type");
      break;
  }

  //Send the request to the API
  const prompt = `
Please analyze the following text: ${fileText}

Your task is to perform the following steps:

1. **Resume Verification**  
   - Determine if the provided text is a resume or CV.  
   - If it is not, output only: "This file you have uploaded is not a resume or CV." and do not proceed further.

2. **Structured Analysis (if it is a resume/CV)**  
   - Produce a detailed analysis organized into these sections:

   **A. Resume Confirmation:**  
      - Briefly confirm that the file is indeed a resume.

   **B. Job Application Suggestion:**  
      - Based on the content, suggest an appropriate job title or field (e.g., "Entry-Level Software Engineer" or "Tech Internship Candidate").

   **C. Resume Summary:**  
      - Provide a concise 2-3 sentence summary highlighting the candidate's key skills, qualifications, and relevant experience.

   **D. Detailed Analysis and Thought Process:**  
      - Outline your key considerations and reasoning steps in analyzing the resume. This section should be succinct yet transparent.

   **E. Potential Improvements:**  
      - List at least three specific suggestions to improve the resume.  
      - For each suggestion, provide a bullet point that includes both the recommendation and a brief explanation of why it is important.  
      - Avoid including or emphasizing sensitive personal information such as specific academic standings or CGPA.

   **F. Additional Feedback (Optional):**  
      - If relevant, offer any extra insights regarding formatting, clarity, or further refinements.

Instructions:
- Use a clear, professional tone and ensure your output strictly follows the section headers outlined above.
- The final output should be in plain text with distinct headers and bullet points where applicable.
- Avoid extraneous commentary or instructions; focus on delivering clear, actionable analysis.
- Make sure the response is structured in such a way that individual sections can be easily displayed or hidden in the frontend as needed.

Please provide your output exactly following this format.
`;

  let result = await import("./ai-connection.mjs");
  result = await result.default(prompt);

  // return response.json(result);
  response.json({ body: result });
});

const PORT = 7000;
app.listen(PORT, () => console.log("Server has started at port " + PORT));

/*
AI connection is up and running. Next steps:
. Ask other AI (claude, ChatGPT, DeepSeek himself, Gemini etc(do it in reverse sequential order, starting from Gemini), for ways that I can improve the prompt.)
. Tell DeepSeek to give me a furnished final output, which is a comprehensive summary of all that he has said according to my prompt
. Ensure proper connection between frontend and backend, and ensure the output is being put into the textarea correctly.
. Delete all file uploads after showing the AI response to the user. (Ensure to create a duplicate to avoid accidental deletion of wrong files during testing)
. Add a button for Comprehensive Analysis or Brief Summary
. Enhance the frontend styling (the inputs, positioning of the container, special effects, increase aesthetic qualities and so on) (get feedback on this)
. Clean up code and make it readable
. Convert it to TypeScript
*/
