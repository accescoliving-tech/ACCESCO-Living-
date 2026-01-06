import "dotenv/config";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL:", supabaseUrl);
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY exists:",
    !!supabaseKey
  );
  throw new Error("Supabase env variables missing");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch
  }
});
