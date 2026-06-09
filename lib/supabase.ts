import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bnjvlykodoxmtyxsrxpt.supabase.co";
const supabaseAnonKey = "sb_publishable_s22X2QYQLZ29h1lgOY0qrQ_eclEdodr";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);