import { createClient } from "@supabase/supabase-js";

// A "publishable key" (antigo "anon key") é feita para ser pública —
// ela por si só não dá acesso a nada que as regras do banco não permitam.
const SUPABASE_URL = "https://wumdeezvfmdxxmvbwqdo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_O22NfZ-sjO3F9vXXK-ffaA_YJFvLMkb";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
