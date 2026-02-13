import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

// Single shared Supabase client to avoid multiple GoTrue instances in dev
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase