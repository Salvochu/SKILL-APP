import "server-only";

// Pushes profile fields into the matching GHL contact (matched by
// email), so a buyer's goal/age/experience/phone show up in the CRM as
// soon as they fill in their profile, instead of you having to go
// looking for it. Best effort on purpose: a GHL hiccup must never stop
// someone from saving their own profile, so every call site treats this
// as fire and forget and only logs failures server-side.
//
// Fully inert until GHL_CONTACTS_API_KEY and GHL_LOCATION_ID are set.
// The four GHL_FIELD_ID_* vars are optional per field: unset ones are
// simply left out of the payload, so this can be turned on for name,
// email and phone (GHL's built-in contact fields) before the custom
// fields for goal/experience/age/country exist yet.
export async function syncProfileToGHL({ email, fullName, phone, age, country, fitnessGoal, experienceLevel }) {
  const apiKey = process.env.GHL_CONTACTS_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId || !email) return;

  const [firstName, ...rest] = String(fullName || "").trim().split(/\s+/);
  const lastName = rest.join(" ");

  const customFields = [];
  const pushField = (envVar, value) => {
    const id = process.env[envVar];
    if (id && value !== "" && value != null) customFields.push({ id, field_value: String(value) });
  };
  pushField("GHL_FIELD_ID_FITNESS_GOAL", fitnessGoal);
  pushField("GHL_FIELD_ID_EXPERIENCE_LEVEL", experienceLevel);
  pushField("GHL_FIELD_ID_AGE", age);
  pushField("GHL_FIELD_ID_COUNTRY", country);

  const body = {
    locationId,
    email,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(phone ? { phone } : {}),
    ...(customFields.length ? { customFields } : {}),
  };

  try {
    const res = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("GHL profile sync failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("GHL profile sync failed:", err.message);
  }
}
