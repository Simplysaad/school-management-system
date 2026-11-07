// src/lib/csvParser.ts

export async function parseCSVFile<T = Record<string, any>>(
  file: File,
): Promise<{
  success: boolean;
  data?: T[];
  error?: string;
}> {
  try {
    const text = await file.text();
    const lines = text
      .split(/\r\n|\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        error: "The CSV file is empty or missing data rows.",
      };
    }

    // Parse header row (converts column names to clean camelCase or standard strings)
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^["']|["']$/g, ""));

    const records: T[] = [];

    // Loop through data rows (skip header index 0)
    for (let i = 1; i < lines.length; i++) {
      // Split columns while handling simple quotes
      const cols = lines[i]
        .split(",")
        .map((c) => c.trim().replace(/^["']|["']$/g, ""));

      const obj: Record<string, any> = {};
      let hasValidData = false;

      headers.forEach((header, index) => {
        let val: any = cols[index] !== undefined ? cols[index] : "";

        // Optional: Automatically cast numeric strings or booleans for convenience
        if (val !== "") {
          hasValidData = true;
          if (!isNaN(Number(val))) {
            val = Number(val);
          } else if (val.toLowerCase() === "true") {
            val = true;
          } else if (val.toLowerCase() === "false") {
            val = false;
          }
        }

        obj[header] = val;
      });

      if (hasValidData) {
        records.push(obj as T);
      }
    }

    return { success: true, data: records };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to parse CSV file.",
    };
  }
}




export interface ParsedGradeRecord {
    admissionNumber: string;
    scoreObtained: number;
    remarks?: string;
}

export async function parseGradesCSV(file: File): Promise<{
    success: boolean;
    data?: ParsedGradeRecord[];
    error?: string;
}> {
    try {
        const text = await file.text();
        const lines = text
            .split(/\r\n|\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (lines.length < 2) {
            return { success: false, error: "The CSV file is empty or missing data rows." };
        }

        // Parse header row (flexible matching)
        const headerRow = lines[0].split(",").map((h) => h.trim().toLowerCase());
        
        const admissionIdx = headerRow.findIndex((h) => h.includes("admission") || h.includes("id"));
        const scoreIdx = headerRow.findIndex((h) => h.includes("score") || h.includes("mark") || h.includes("grade"));
        const remarksIdx = headerRow.findIndex((h) => h.includes("remark") || h.includes("comment"));

        if (admissionIdx === -1 || scoreIdx === -1) {
            return {
                success: false,
                error: "Invalid CSV headers. Ensure columns include something like 'admissionNumber' and 'scoreObtained'.",
            };
        }

        const parsedRecords: ParsedGradeRecord[] = [];

        // Loop through data rows (skip header)
        for (let i = 1; i < lines.length; i++) {
            // Simple comma split (handles standard CSV without complex inner quotes)
            const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
            
            const admissionNumber = cols[admissionIdx];
            const rawScore = cols[scoreIdx];
            const remarks = remarksIdx !== -1 ? cols[remarksIdx] : undefined;

            if (!admissionNumber) continue; // Skip empty rows

            const scoreObtained = Number(rawScore);
            if (isNaN(scoreObtained)) {
                return {
                    success: false,
                    error: `Row ${i + 1}: Invalid score value "${rawScore}" for student ${admissionNumber}.`,
                };
            }

            parsedRecords.push({
                admissionNumber,
                scoreObtained,
                remarks: remarks || "",
            });
        }

        return { success: true, data: parsedRecords };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to parse CSV file." };
    }
}