// Supabase (PostgREST) returns at most 1000 rows per request and silently
// drops the rest, so any server-side read that can grow past that - all
// users' sessions, sets, checklist rows - has to page through it. `build`
// returns a fresh query each call, with a stable .order() so pages don't
// overlap or skip rows. Same { data, error } shape as a normal query.
const PAGE = 1000;

export async function selectAll(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return { data: rows, error: null };
  }
}

// auth.admin.listUsers() only returns its first page (50 users by
// default), so a lookup by email has to walk every page.
export async function findUserByEmail(admin, email) {
  const target = email.trim().toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) throw new Error(`could not look up account: ${error.message}`);
    const users = data?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (users.length < PAGE) return null;
  }
}
