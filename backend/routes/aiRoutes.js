  const express = require('express');
  require('dotenv').config();
  const router = express.Router();
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const Invoice = require('../models/Invoice');
  const auth = require('../middleware/auth');

  // Initialize Gemini
  // Ensure GEMINI_API_KEY is in your .env file
  
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY is not set in environment variables.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

 // Route: AI Insights for Dashboard
router.get('/insight', auth, async (req, res) => {
  console.log("req recived")
  try {
    const companyId = req.user.companyId;
const invoices = await Invoice.find({ companyId });


    if (!invoices.length) {
      return res.json({
        insight: "You have no invoices yet. Create your first invoice to start receiving insights."
      });
    }

    const today = new Date();

    let totalInvoices = invoices.length;
    let overdueCount = 0;
    let overdueAmount = 0;
    let totalDelayDays = 0;
    let delayCount = 0;

    for (const inv of invoices) {
      // --- 1. OVERDUE LOGIC (Using status field)
      if (inv.status === "overdue") {
        overdueCount++;
        overdueAmount += inv.total || 0;
      }

      // --- 2. PAYMENT DELAY LOGIC (Using invoiceDate + updatedAt)
      if (inv.status === "paid") {
        const created = new Date(inv.invoiceDate);
        const paid = new Date(inv.updatedAt);

        const delay =
          (paid - created) / (1000 * 60 * 60 * 24); // milliseconds → days

        if (delay > 0) {
          totalDelayDays += delay;
          delayCount++;
        }
      }
    }

    const avgDelay =
      delayCount > 0 ? Number((totalDelayDays / delayCount).toFixed(1)) : 0;

    const stats = {
      totalInvoices,
      overdueCount,
      overdueAmount,
      avgDelay
    };

    console.log("INSIGHT: stats:", stats);

    // -------------------------------
    // AI MODEL CALL
    // -------------------------------
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash"
    });

    const prompt = `
      You are an AI that generates short, actionable business insights for invoice management.
      Use this data: ${JSON.stringify(stats)}

      Your task:
      - Generate only ONE concise sentence.
      - No emojis.
      - No bullet points.
      - No fluff.
      - Must be an actual business insight.
    `;

    console.log("INSIGHT: calling Gemini...");

    const result = await model.generateContent(prompt);

    console.log("INSIGHT: Gemini responded");

    const response = await result.response;
    const insight = response.text().trim();

    return res.json({ insight });

  } catch (err) {
    console.error("AI Insight Error:", err);
    res.status(500).json({ insight: "Unable to generate insights" });
  }
});



  // Route to Parse Invoice Text
  router.post('/parse-invoice', async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text input is required" });
      }

      const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

      // The Prompt: Explicitly defines the schema matching your React State
      const prompt = `
        You are an intelligent invoice data extractor. 
        Extract structured invoice details from the following user query: "${text}"
        
        Return ONLY a raw JSON object (no markdown formatting, no code blocks) with this exact schema:
        {
          "client": {
            "name": "String (Extracted or inferred company/person name)",
            "address": "String (If mentioned)",
            "gstin": "String (If mentioned)",
            "email": "String (If mentioned)",
            "mobile": "String (If mentioned)",
            "state": "String (Default to 'KARNATAKA' if not mentioned)"
          },
          "items": [
            {
              "description": "String (Item name)",
              "qty": Number (Default 1),
              "rate": Number (Price per unit, remove currency symbols),
              "hsn": "String (Optional)",
              "discount": Number (Default 0)
            }
          ]
        }
        
        If specific details are missing, leave them as empty strings or 0. 
        Do not invent data, only extract what is implied or stated.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let textResponse = response.text();

      console.log("Raw Gemini Response:", textResponse); // For server logs debugging

      // Robust JSON Extraction: Find the substring between the first '{' and last '}'
      const jsonStartIndex = textResponse.indexOf('{');
      const jsonEndIndex = textResponse.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        textResponse = textResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      } else {
        throw new Error("No JSON structure found in AI response");
      }

      const parsedData = JSON.parse(textResponse);

      res.status(200).json(parsedData);

    } catch (error) {
      console.error("Gemini AI Error:", error);
      res.status(500).json({ 
          message: "Failed to parse invoice data", 
          error: error.message || error.toString() 
      });
    }
  });

  

  // Route to Parse Quotation Text
  router.post('/parse-quotation', async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text input is required" });
      }

      // Using the same model as your other routes
      const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

      const prompt = `
        You are an intelligent quotation and proposal data extractor. 
        Extract structured quotation details from the following user query: "${text}"
        
        Return ONLY a raw JSON object (no markdown formatting, no code blocks) with this exact schema:
        {
          "client": {
            "name": "String (Extracted or inferred company/person name)",
            "address": "String (If mentioned)",
            "gstin": "String (If mentioned)",
            "email": "String (If mentioned)",
            "mobile": "String (If mentioned)",
            "state": "String (Default to 'KARNATAKA' if not mentioned)"
          },
          "items": [
            {
              "description": "String (Item name)",
              "make": "String (Brand or Make if mentioned, e.g., 'L&T', 'Dell')",
              "qty": Number (Default 1),
              "unit": "String (e.g., 'Nos', 'Mtrs', 'Sets' - Default 'NOS')",
              "rate": Number (Price per unit, remove currency symbols),
              "discount": Number (Default 0)
            }
          ],
          "subject": "String (Infer a professional subject line for this quotation based on the items, e.g., 'Quotation for CCTV Installation')"
        }
        
        If specific details are missing, leave them as empty strings or 0. 
        Do not invent data, only extract what is implied or stated.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let textResponse = response.text();

      console.log("Raw Gemini Quotation Response:", textResponse); 

      // Robust JSON Extraction
      const jsonStartIndex = textResponse.indexOf('{');
      const jsonEndIndex = textResponse.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        textResponse = textResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      } else {
        throw new Error("No JSON structure found in AI response");
      }

      const parsedData = JSON.parse(textResponse);

      res.status(200).json(parsedData);

    } catch (error) {
      console.error("Gemini AI Quotation Error:", error);
      res.status(500).json({ 
          message: "Failed to parse quotation data", 
          error: error.message || error.toString() 
      });
    }
  });

  

  module.exports = router;