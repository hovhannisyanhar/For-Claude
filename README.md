# Фабрика видео-фактов

Вертикальные ролики для Reels / TikTok / Shorts, собранные кодом (Remotion): тема → факт-чек → сценарий → AI-озвучка → анимация → mp4 + обложка + текст поста.

```
npm install
npm run new -- my-topic          # создать сценарий videos/my-topic/script.json
npm run make -- my-topic         # озвучка + рендер → out/my-topic/
npm run make -- my-topic --provider=none   # черновик без голоса
npm run studio                   # предпросмотр в браузере
```

Полный процесс и правила сценариев — в [CLAUDE.md](CLAUDE.md).
