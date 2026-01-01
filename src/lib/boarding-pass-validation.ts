export interface BoardingPassResult {
  boardingPassUrl: string;
  passportUrl: string;
  renamedFilename: string;
  campus: string;
}

/**
 * Validates the team and site, and returns boarding pass and passport URLs if found.
 * @param teamName Team name to validate
 * @param siteName Campus/site name (case-insensitive)
 * @returns BoardingPassResult or null if not found
 */
export async function validateBoardingPass(teamName: string, siteName: string): Promise<BoardingPassResult | null> {
  if (!teamName || !siteName) return null;
  const site = siteName.toLowerCase();
  try {
    const res = await fetch("/data/boarding_pass_mappings.json");
    if (!res.ok) return null;
    const mappings = await res.json();
    const siteArr = mappings[site];
    if (!Array.isArray(siteArr)) return null;
    const found = siteArr.find((item: any) => item.original_filename === teamName);
    if (found) {
      const campus = site;
      const renamedFilename = found.renamed_filename;
      const safeFileName = renamedFilename.replace(/\s+/g, "_");
      const boardingPassPath = `boarding_pass/${campus}/${safeFileName}_boardingpass.pdf`;
      const passportPath = `passport/${campus}/${safeFileName}_passport.pdf`;
      // Use env variable for the public flight-details bucket base URL
      const supabaseBaseUrl =
        (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_FLIGHT_DETAILS_URL)
        || (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_FLIGHT_DETAILS_URL)
      return {
        boardingPassUrl: supabaseBaseUrl + boardingPassPath,
        passportUrl: supabaseBaseUrl + passportPath,
        renamedFilename,
        campus,
      };
    }
    return null;
  } catch {
    return null;
  }
}
