const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const SCHEMA_CONTEXT = `
You are a smart assistant for the "Smart Street" platform. 
We have a PostgreSQL database with PostGIS for location data.
Here is the schema:

1. users (user_id, name, email, role [VENDOR, OWNER, ADMIN], phone)
2. vendors (vendor_id, user_id, business_name, category, license_number, verified)
3. owners (owner_id, user_id, owner_name, contact_info)
4. spaces (space_id, owner_id, center [GEOGRAPHY POINT], allowed_radius, space_name, address)
5. space_requests (request_id, vendor_id, space_id, center, status [PENDING, APPROVED, REJECTED], start_time, end_time)
6. permits (permit_id, request_id, status [VALID, EXPIRED, REVOKED], valid_from, valid_to)

IMPORTANT RULES FOR SQL GENERATION:
- Return ONLY the SQL query string. Do NOT use markdown code blocks.
- Use PostgreSQL syntax.
- **CRITICAL**: Use correct ENUM values. 
  - 'permits.status' can ONLY be: 'VALID', 'EXPIRED', 'REVOKED'.
  - 'space_requests.status' can ONLY be: 'PENDING', 'APPROVED', 'REJECTED'.
  - Do NOT use 'APPROVED' for permits. Use 'VALID' instead.
- For location queries: The 'spaces' table has a 'center' column of type GEOGRAPHY(POINT, 4326).
- To find spaces near a lat/long: ST_DWithin(center, ST_SetSRID(ST_MakePoint(LONGITUDE, LATITUDE), 4326), RADIUS_IN_METERS).
- Join tables correctly. 'vendors' links to 'users' via 'user_id'.
- Do NOT generate DELETE, UPDATE, INSERT, or DROP statements. SELECT only.
- If the user asks for "flowers", look in vendors.category or vendors.business_name.
- **CRITICAL**: To show "View on Map" button, we need location. When querying 'vendors', ALWAYS JOIN with 'space_requests' AS sr ON vendors.vendor_id = sr.vendor_id WHERE sr.status = 'APPROVED'. Select 'ST_Y(sr.center::geometry) as lat' and 'ST_X(sr.center::geometry) as lng'.
- **CRITICAL**: When querying 'spaces' or 'space_requests', ALWAYS use the alias (e.g. s.center or sr.center) for the center column. Select 'ST_Y(center::geometry) as lat' and 'ST_X(center::geometry) as lng'.
`;

const generateSQL = async (userQuery) => {
  const prompt = `
    ${SCHEMA_CONTEXT}
    
    User Question: "${userQuery}"
    
    Generate a safe SELECT SQL query to answer this. 
    If the question cannot be answered with the database, return "NO_SQL".
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Cleanup potential markdown formatting
    text = text.replace(/^```sql/, '').replace(/^```/, '').replace(/;$/, '').trim();
    
    return text;
  } catch (error) {
    console.error("Error interacting with Gemini:", error);
    // Propagate the specific error status if available (e.g. 429, 503) from the library error
    if (error.status === 429) {
      throw { status: 429, message: "AI Quota Exceeded. Please try again later." };
    }
    if (error.status === 503) {
      throw { status: 503, message: "AI Service Overloaded. Please try again later." };
    }
    throw new Error("Failed to generate SQL from AI.");
  }
};

const answerQuestion = async (userQuery, context = "") => {
  const prompt = `
    You are a helpful support assistant for Smart Street (a platform for street vendors to book spaces).
    
    User Query: "${userQuery}"
    
    Context (if any): ${context}
    
    Provide a friendly, concise answer. If it's a general greeting, respond politely.
    If it's about the platform:
    - Vendors can book spaces.
    - Owners can list spaces.
    - Admins approve requests.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating answer:", error);
    throw new Error("Failed to generate answer.");
  }
};

module.exports = {
  generateSQL,
  answerQuestion
};
