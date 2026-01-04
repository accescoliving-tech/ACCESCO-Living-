import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // backend only

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase env variables missing");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
