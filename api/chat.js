
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Используй POST-запрос"
    });
  }

  const configs = {
    flash: {
      key: process.env.FLASH_API_KEY,
      url: process.env.FLASH_BASE_URL,
      model: process.env.FLASH_MODEL
    },
    genesis: {
      key: process.env.AI_API_KEY,
      url: process.env.AI_BASE_URL,
      model: process.env.AI_MODEL
    },
    infinity: {
      key: process.env.INFINITY_API_KEY,
      url: process.env.INFINITY_BASE_URL,
      model: process.env.INFINITY_MODEL
    }
  };

  try {
    const { messages, version = "genesis" } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "История сообщений должна быть массивом."
      });
    }

    const config = configs[version];

    if (!config) {
      return res.status(400).json({
        error: "Неизвестная версия Quantum."
      });
    }

    if (!config.key || !config.url || !config.model) {
      return res.status(500).json({
        error: `Quantum ${version} не настроен в Vercel.`
      });
    }

    const safeMessages = messages
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-70);

    const response = await fetch(
      `${config.url.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.key}`
        },
        body: JSON.stringify({
          model: config.model,
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
