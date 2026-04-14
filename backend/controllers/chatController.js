const aiService = require('../services/aiService');
const db = require('../config/db');

exports.handleChat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // 1. Attempt to generate SQL
    let sqlQuery = await aiService.generateSQL(message);
    
    console.log("Generated SQL:", sqlQuery);

    if (sqlQuery === "NO_SQL" || !sqlQuery.toLowerCase().startsWith("select")) {
      // Treat as general conversation
      const reply = await aiService.answerQuestion(message);
      return res.json({ type: "text", content: reply });
    }

    // 2. Execute SQL (Safety check: Ensure read-only is enforced conceptually, but here we check 'SELECT')
    if (/insert|update|delete|drop|alter|truncate/i.test(sqlQuery)) {
       console.warn("Unsafe SQL detected:", sqlQuery);
       return res.json({ type: "text", content: "I cannot perform modifications, only search." });
    }

    const { rows } = await db.query(sqlQuery);

    // 3. If results found, return them. If empty, maybe explain why?
    if (rows.length > 0) {
      return res.json({ 
        type: "data", 
        sql: sqlQuery, 
        results: rows 
      });
    } else {
      return res.json({ 
        type: "text", 
        content: "I understood your query, but I couldn't find any matching results in our database." 
      });
    }

  } catch (error) {
    console.error("Chat Controller Error:", error);
    
    if (error.status) {
       return res.status(error.status).json({ 
         error: error.message || "AI Service Error",
         type: "text",
         content: error.message || "I'm experiencing high traffic. Please try again in a moment."
       });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};
