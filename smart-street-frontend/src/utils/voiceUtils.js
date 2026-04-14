export const parseBookingIntent = (transcript, spaces = []) => {
  const text = transcript.toLowerCase();
  const now = new Date();
  
  const result = {
    spaceId: null,
    spaceName: null,
    startTime: null,
    endTime: null,
    missingFields: []
  };

  // --- 1. Extract Space/Location (Fuzzy Match) ---
  // Look for "near X", "at X", "in X", or just assume fuzzy match on the whole string
  let bestMatch = null;
  let maxScore = 0;

  spaces.forEach(space => {
    const name = space.space_name.toLowerCase();
    // Simple check: does the transcript contain the space name?
    if (text.includes(name)) {
      if (name.length > maxScore) { // Prefer longer matches (more specific)
        maxScore = name.length;
        bestMatch = space;
      }
    }
    
    // Check address too
    const addr = space.address.toLowerCase();
    if (text.includes(addr)) {
       if (addr.length > maxScore) {
          maxScore = addr.length;
          bestMatch = space;
       }
    }
  });

  if (bestMatch) {
    result.spaceId = bestMatch.space_id;
    result.spaceName = bestMatch.space_name;
  } else {
    // If no existing space matched, check if the user provided a "new" location intent
    // Look for phrases like "near X", "at X"
    const locationRegex = /\b(?:near|at|in)\s+(.+?)(?:\s+(?:tomorrow|today|next|from|at\s+\d)|$)/i;
    const locMatch = text.match(locationRegex);
    
    if (locMatch && locMatch[1]) {
       result.searchQuery = locMatch[1].trim();
    } else {
       result.missingFields.push("location");
    }
  }

  // --- 2. Extract Date ---
  let targetDate = new Date(); // Default to today
  
  if (text.includes("tomorrow")) {
    targetDate.setDate(now.getDate() + 1);
  } else if (text.includes("today")) {
    // already today
  } else {
    // Check for "next [Day]" or "[Day]"
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayMatch = text.match(new RegExp(`(?:next\\s+)?(${days.join("|")})`, "i"));
    
    if (dayMatch) {
      const dayName = dayMatch[1].toLowerCase();
      const targetDay = days.indexOf(dayName);
      const currentDay = now.getDay();
      
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
      
      // If user specifically said "next Friday" and today is Tuesday, it usually means THIS Friday.
      // But "next Friday" can interpret as NEXT week's Friday.
      // For simplicity: "Friday" => next occurrence. "Next Friday" => next occurrence + 7?
      // Let's stick to simple "next occurrence" logic for now, or check for "next" keyword strictness if needed.
      if (text.includes("next " + dayName) && daysToAdd < 7) {
         // If they say "next Friday" and it's Tuesday, they might mean next week's Friday using strict English, 
         // but functionally usually means "the coming Friday". 
         // Let's assume "next [Day]" adds 7 days ONLY if today is that day, otherwise it's just the next one.
         // Actually, standard colloquial:
         // "this Friday" = coming Friday.
         // "next Friday" = Friday of next week.
         if (text.includes("next ")) {
            daysToAdd += 7;
         }
      }
      
      targetDate.setDate(now.getDate() + daysToAdd);
    }
  } 
  // TODO: Add "Day of Week" support (e.g. "next Monday") if needed
  
  // --- 3. Extract Time Range ---
  // Patterns: "6pm to 8pm", "6 to 8 pm", "18:00 to 20:00"
  // Regex for "X pm/am to Y pm/am"
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:to|-|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i;
  const match = text.match(timeRegex);

  if (match) {
    let [_, startH, startM, startMeridiem, endH, endM, endMeridiem] = match;
    startH = parseInt(startH);
    startM = parseInt(startM || "0");
    endH = parseInt(endH);
    endM = parseInt(endM || "0");
    
    // Normalize meridiem (am/pm)
    // Heuristic: If start meridiem is missing but end is present, assume same (e.g., "6 to 8 pm" -> 6pm to 8pm)
    if (!startMeridiem && endMeridiem) startMeridiem = endMeridiem;
    
    // Convert to 24h
    if (startMeridiem) {
      const isPm = startMeridiem.toLowerCase().includes("p");
      if (isPm && startH < 12) startH += 12;
      if (!isPm && startH === 12) startH = 0;
    }
    
    if (endMeridiem) {
      const isPm = endMeridiem.toLowerCase().includes("p");
      if (isPm && endH < 12) endH += 12;
      if (!isPm && endH === 12) endH = 0;
    }
    
    // Construct ISO strings
    const start = new Date(targetDate);
    start.setHours(startH, startM, 0, 0);
    
    const end = new Date(targetDate);
    end.setHours(endH, endM, 0, 0);
    
    // Handle overnight (e.g. 11pm to 1am) -> end date is +1
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    result.startTime = start.toISOString();
    result.endTime = end.toISOString();

  } else {
    result.missingFields.push("time range");
  }

  return result;
};
