// ----------------------------------------------------------------
// FILE: index.js
// This is the main Cloud Function that will be deployed.
// (Corrected with modern v2 syntax and updated model names)
// ----------------------------------------------------------------

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { ImageAnnotatorClient } = require("@google-cloud/vision");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const os = require("os");
const fs = require("fs");
const pdf = require("pdf-parse");

// Initialize Firebase Admin SDK
initializeApp();

// Initialize Cloud services clients
const db = getFirestore();
const storage = getStorage();
const visionClient = new ImageAnnotatorClient();

// Initialize the Gemini AI with your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Cloud Function that triggers when a new file is uploaded to Cloud Storage.
 * It performs OCR if needed, analyzes the text with Gemini,
 * and saves the structured data back to Firestore using the modern v2 syntax.
 */
exports.analyzePolicyDocument = onObjectFinalized(
    {
        // v2 runtime options are passed as the first argument
        region: "europe-west1",
        memory: "1GiB", // Note: Use GiB/MiB for v2 options
        timeoutSeconds: 300,
        cpu: 1,
    },
    async (event) => {
        const fileObject = event.data;
        const bucket = storage.bucket(fileObject.bucket);
        const filePath = fileObject.name;
        const contentType = fileObject.contentType;

        // --- 1. Validate Trigger ---
        const pathParts = filePath.split("/");
        if (pathParts[0] !== "artifacts" || pathParts[2] !== "users" || pathParts[4] !== "uploads") {
            console.log(`File path ${filePath} is not a user upload. Exiting function.`);
            return;
        }

        const appId = pathParts[1];
        const userId = pathParts[3];
        const originalFileName = path.basename(filePath);
        const docStatusRef = db.collection("artifacts").doc(appId).collection("users").doc(userId).collection("documents").doc(originalFileName);

        console.log(`Processing file: ${originalFileName} for user: ${userId}`);

        const tempFilePath = path.join(os.tmpdir(), originalFileName);
        try {
            // --- 2. Download File from Storage ---
            await bucket.file(filePath).download({ destination: tempFilePath });
            console.log("File downloaded locally to", tempFilePath);

            // --- 3. Extract Text (OCR or PDF Parse) ---
            let extractedText = "";
            let useMultimodal = false;

            if (contentType.startsWith("image/")) {
                console.log("Image file detected. This will be a multimodal request.");
                useMultimodal = true;
            } else if (contentType === "application/pdf") {
                console.log("PDF file detected. Attempting to parse text content.");
                const dataBuffer = fs.readFileSync(tempFilePath);
                const data = await pdf(dataBuffer);
                extractedText = data.text;
                if (!extractedText || extractedText.trim().length < 50) {
                    console.log("PDF contains little or no text. Falling back to multimodal analysis.");
                    useMultimodal = true;
                }
            } else {
                throw new Error(`Unsupported file type: ${contentType}`);
            }

            // --- 4. Analyze Content with Gemini ---
            // Use the latest stable model which can handle both text and vision
            const modelName = "gemini-1.5-flash-latest";
            const model = genAI.getGenerativeModel({ model: modelName });
            console.log(`Using Gemini model: ${modelName}`);

            const prompt = `Please analyze this insurance policy document. Extract the provider name, policy number, effective dates, and a detailed list of all coverages and perks. Structure the output as a clean JSON object with the keys: "provider", "policyNumber", "effectiveDates", "coverages", and "perks". For each coverage and perk, provide a "name" and a "description". Do not wrap the JSON in markdown backticks.`;
            
            let result;
            if (useMultimodal) {
                console.log("Sending file to Gemini for multimodal analysis.");
                const fileBuffer = fs.readFileSync(tempFilePath);
                const imagePart = {
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType: contentType,
                    },
                };
                result = await model.generateContent([prompt, imagePart]);
            } else {
                console.log("Sending extracted text to Gemini for analysis.");
                result = await model.generateContent(`${prompt}\n\nText to analyze:\n\n${extractedText}`);
            }

            const responseText = result.response.text();
            const structuredResponse = JSON.parse(responseText.trim());

            // --- 5. Save Structured Data to Firestore ---
            console.log("Saving structured data to Firestore.");
            const policiesRef = db.collection("artifacts").doc(appId).collection("users").doc(userId).collection("policies");
            await policiesRef.add({
                ...structuredResponse,
                sourceFile: originalFileName,
                createdAt: FieldValue.serverTimestamp(),
            });

            // --- 6. Update Document Status to 'completed' ---
            await docStatusRef.update({
                status: "completed",
                completedAt: FieldValue.serverTimestamp(),
            });

            console.log("Successfully processed and saved policy:", originalFileName);

        } catch (error) {
            console.error("Error processing file:", error);
            await docStatusRef.update({
                status: "failed",
                error: error.message,
                completedAt: FieldValue.serverTimestamp(),
            });
        } finally {
            // Clean up the temporary file
            fs.unlinkSync(tempFilePath);
        }
    }
);
