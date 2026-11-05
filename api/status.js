
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Используй GET-запрос"
    });
  }

  const configured = Boolean(
    process.env.AI_API_KEY &&
    process.env.AI_BASE_URL &&
    process.env.AI_MODEL
  );

  return res.status(200).json({
    configured
  });
}
