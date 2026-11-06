
export default async function handler(req, res) {
  // Разрешаем только POST-запросы
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Используй POST-запрос"
    });
  }

  // Проверяем настройки API
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !baseUrl || !model) {
    return res.status(500).json({
      error: "Quantum не настроен. Проверь переменные Vercel."
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "История сообщений должна быть массивом."
      });
    }

    // Оставляем только последние 30 сообщений
    const safeMessages = messages
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-30);

    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "Ты — Quantum, полезный, умный и дружелюбный ИИ-помощник. Отвечай понятно, точно и на языке пользователя."
            },
            ...safeMessages
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Ошибка AI API"
      });
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        error: "Модель не вернула ответ."
      });
    }

    return res.status(200).json({
      reply: answer
    });

  } catch (error) {
    return res.status(500).json({
      error: "Ошибка сервера Quantum."
    });
  }
      }
