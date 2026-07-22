import React, { useState, useMemo } from "react";

// ============ ДИЗАЙН-ТОКЕНЫ ============
// Палитра «лабораторный журнал»: бумага в клетку, чернила, теал-прибор, маркер ошибки
const C = {
  paper: "#F3F5F4",
  grid: "#DCE3E1",
  ink: "#182420",
  inkSoft: "#4B5B55",
  teal: "#0E6E64",
  tealSoft: "#DCEEEB",
  marker: "#FFDE59",
  red: "#C2492F",
  white: "#FFFFFF",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`;

// ============ ДАННЫЕ УРОКОВ (неделя 1) ============
const LESSONS = [
  {
    id: 1,
    title: "Две скорости мышления",
    minutes: 12,
    steps: [
      {
        type: "hookNumber",
        prompt:
          "Бита и мяч вместе стоят 1100 ₽. Бита дороже мяча на 1000 ₽. Сколько стоит мяч?",
        placeholder: "₽",
        correct: 50,
        trap: 100,
        revealTrap:
          "Вы ответили «100» — как и примерно 80% людей, включая студентов MIT. Это ответила быстрая система. Проверим: если мяч 100, то бита 1100, вместе 1200. Не сходится. Верный ответ: 50 ₽.",
        revealCorrect:
          "Верно: 50 ₽. Вы либо включили медленную систему, либо уже встречали задачу. В любом случае — заметьте: первым в голове почти наверняка всплыло «100».",
      },
      {
        type: "concept",
        title: "Система 1 и Система 2",
        body: "У мышления две скорости. Быстрая (Система 1) — автоматическая, лёгкая, всегда отвечает первой. Медленная (Система 2) — затратная, ленивая, включается по требованию.\n\nПроблема не в том, что быстрая система ошибается. Проблема в том, что её ответы ощущаются такими же достоверными, как ответы медленной. Изнутри «100» и «50» чувствуются одинаково.\n\nКритическое мышление — это не «всегда думать медленно» (невозможно и не нужно). Это навык замечать ситуации, где ставки высоки, а ответ пришёл подозрительно легко — и вручную включать вторую скорость.",
      },
      {
        type: "check",
        prompt: "Где здесь, скорее всего, ответила быстрая система?",
        options: [
          {
            t: "«Посмотрел коммит мельком — норм, апрувлю»",
            ok: true,
            fb: "Да. Мгновенная оценка по знакомым паттернам — классическая Система 1. Иногда это оправданно (мелкая правка), иногда — нет.",
          },
          {
            t: "Инженер полчаса считает нагрузку на сервер в таблице",
            ok: false,
            fb: "Это медленная система: пошаговый расчёт с удержанием чисел в голове.",
          },
          {
            t: "«Этот подрядчик не нравится — что-то в нём не то»",
            ok: true,
            fb: "Да. Впечатление без сформулированных причин — быстрая система. Сигнал стоит проверки, но это не вывод.",
          },
        ],
        multi: true,
      },
      {
        type: "transfer",
        prompt:
          "Задание на сегодня: поймайте один момент, когда вы ответили мгновенно и уверенно. Запишите: какой был вопрос, что вы ответили, и был ли повод замедлиться.",
        journalTag: "Урок 1 · быстрый ответ",
      },
    ],
  },
  {
    id: 2,
    title: "Мысль ≠ факт",
    minutes: 11,
    steps: [
      {
        type: "hookChoice",
        prompt:
          "Сообщение от руководителя в 18:47: «Надо завтра поговорить про твой релиз». Что вы подумали первым делом?",
        options: [
          "Что-то сломалось, будут претензии",
          "Наверное, хочет обсудить планы",
          "Хм, странно. Подожду и узнаю",
        ],
        reveal:
          "А теперь три реальных продолжения этой истории: (1) релиз похвалили наверху, руководитель хочет предложить рассказать о нём на демо; (2) вопрос про сроки следующего этапа; (3) в релизе нашли баг. Все три случаются. Сообщение было одно — интерпретаций три, и ваша реакция на вечер зависела не от факта, а от выбранной истории.",
      },
      {
        type: "concept",
        title: "Между событием и реакцией стоит интерпретация",
        body: "Мы почти никогда не реагируем на факты. Мы реагируем на свои мысли о фактах — и не замечаем разницы, потому что интерпретация приклеивается к событию мгновенно и невидимо.\n\nФакт: «руководитель написал: надо поговорить». Интерпретация: «будут претензии». Первое произошло в мире. Второе произошло в голове.\n\nНавык недели: расклеивать. Не запрещать себе интерпретации (невозможно), а видеть шов между «что произошло» и «что я об этом подумал». Один этот шов возвращает выбор реакции.",
      },
      {
        type: "check",
        prompt: "Отметьте, что здесь факт, а что интерпретация:",
        options: [
          { t: "«Заказчик не ответил на письмо за два дня»", ok: true, fb: "Факт: проверяемо, произошло в мире." },
          { t: "«Заказчик нас игнорирует»", ok: false, fb: "Интерпретация: приписывает намерение. Он мог болеть, быть в отпуске, ждать своего руководителя." },
          { t: "«Джун третий раз переспросил про задачу»", ok: true, fb: "Факт: счётное событие." },
          { t: "«Джун не тянет»", ok: false, fb: "Интерпретация: вывод о человеке из трёх наблюдений. Возможно, задача плохо поставлена." },
        ],
        multi: true,
        labels: ["Факт", "Интерпретация"],
      },
      {
        type: "transfer",
        prompt:
          "Задание: один раз за день, поймав сильную реакцию, письменно разделите: что произошло (факт) — что я об этом подумал (интерпретация) — какие ещё интерпретации возможны.",
        journalTag: "Урок 2 · факт/интерпретация",
      },
    ],
  },
  {
    id: 3,
    title: "Дневник решений: прибор для наблюдения",
    minutes: 13,
    steps: [
      {
        type: "hookChoice",
        prompt:
          "Вспомните важное рабочее решение полугодовой давности. Насколько точно вы помните аргументы, которыми тогда руководствовались?",
        options: [
          "Помню довольно точно",
          "Помню общую логику",
          "Честно — помню в основном результат",
        ],
        reveal:
          "Подвох в том, что проверить это без записей невозможно — и именно на это рассчитывает память. Исследования hindsight bias показывают: узнав результат, люди систематически «вспоминают», что предвидели его, и переписывают свои прошлые аргументы под то, что случилось. Вы помните не то, что думали. Вы помните удобную версию.",
      },
      {
        type: "concept",
        title: "Чёрный ящик для собственных решений",
        body: "Единственный способ честно изучать своё мышление — фиксировать его в моменте, до результата. Потом будет поздно: память перепишет.\n\nДневник решений — 5 минут на запись: какое решение, ключевые аргументы (2–3), чего я ожидаю, уверенность в процентах.\n\nЭто ваш чёрный ящик самолёта. Он скучен ровно до первого расследования: через месяц-два, сверяя записи с реальностью, вы впервые увидите своё мышление со стороны — без ретуши. На этих записях построена половина программы, включая финальное упражнение недели 12.\n\nВажно: дневник личный. Никто — включая руководителя — не видит записей, кроме тех, которыми вы сами решите поделиться на встрече.",
      },
      {
        type: "firstEntry",
        prompt:
          "Первая запись — прямо сейчас. Возьмите любое реальное решение, которое принимаете на этой неделе:",
      },
      {
        type: "transfer",
        prompt:
          "С этого дня — напоминания дневника. Норма: три и больше записи в неделю. Ловите решения тёпленькими, до результата.",
        journalTag: null,
      },
    ],
  },
];

// ============ КАЛИБРОВОЧНЫЙ КВИЗ ============
const QUIZ = [
  { q: "Длина МКАД, км", a: 109 },
  { q: "Год основания МГУ", a: 1755 },
  { q: "Население Новосибирска, тыс. чел.", a: 1633 },
  { q: "Высота Эльбруса, м", a: 5642 },
  { q: "Год выхода первого iPhone", a: 2007 },
];

// ============ СЦЕНАРНАЯ КАРТОЧКА (неделя 1) ============
const CARD1 = {
  week: 1,
  title: "Запуск: контракт и первая ошибка",
  lead: "Ведёт инициатор программы (единственная встреча без ротации)",
  goal: "Психологическая безопасность. Без неё следующие 11 недель — театр.",
  timeline: [
    ["00:00", "Калибровочный разогрев. Ведущий первым озвучивает свои (плохие) результаты"],
    ["00:10", "Круг знакомства с программой: чего жду, чего опасаюсь — по минуте"],
    ["00:20", "«Моя дорогая ошибка»: ведущий начинает — своя ошибка в решении + что в мышлении её вызвало. Затем каждый по кругу. Без советов, только вопросы на понимание"],
    ["01:00", "Групповой контракт: 6 правил, обсудить, дополнить, зафиксировать"],
    ["01:15", "Ротация ведущих: порядок на 11 недель — сразу в календарь"],
    ["01:25", "Рефлексия в приложении, 2 минуты"],
  ],
  rules: [
    "Атакуем идеи, не людей",
    "Пересказ перед возражением",
    "Ошибка — валюта встречи",
    "Ведущий говорит меньше всех",
    "Статусы за дверью: руководитель высказывается последним",
    "Личные записи неприкосновенны",
  ],
  phrase: "«Здесь нет оценки. Есть лаборатория. В лаборатории взрыв — это данные».",
};

// ============ ДАННЫЕ УЧАСТНИКОВ (мок для кураторского раздела) ============
// lessons: [номер, день, минуты на прохождение]; quizHits: попаданий из 5 (null = не проходил)
const TEAM = [
  { name: "Марина К.", role: "Тимлид разработки", last: "сегодня 09:12", lessons: [["1", "пн", 9], ["2", "вт", 11], ["3", "ср", 14]], journal: 4, shared: 1, preds: 3, quizHits: 2 },
  { name: "Игорь М.", role: "Архитектор", last: "сегодня 08:40", lessons: [["1", "пн", 12], ["2", "вт", 10], ["3", "ср", 12]], journal: 5, shared: 2, preds: 4, quizHits: 3 },
  { name: "Дмитрий С.", role: "Руководитель поддержки", last: "вчера 21:05", lessons: [["1", "пн", 11], ["2", "ср", 13]], journal: 2, shared: 0, preds: 2, quizHits: 3 },
  { name: "Алексей В.", role: "DevOps-лид", last: "сегодня 07:55", lessons: [["1", "пн", 8], ["2", "вт", 4], ["3", "ср", 5]], journal: 0, shared: 0, preds: 1, quizHits: 1 },
  { name: "Ольга Т.", role: "Руководитель проектов", last: "2 дня назад", lessons: [["1", "вт", 15]], journal: 1, shared: 0, preds: 0, quizHits: null },
  { name: "Сергей П.", role: "Лид аналитики", last: "вчера 18:30", lessons: [["1", "пн", 10], ["2", "ср", 12]], journal: 3, shared: 1, preds: 0, quizHits: 2 },
];

// Автоматические флаги внимания по метаданным активности
function teamFlags(team) {
  const flags = [];
  team.forEach((p) => {
    const fast = p.lessons.filter(([, , m]) => m <= 5);
    if (fast.length >= 2) flags.push({ who: p.name, level: "warn", text: `уроки ${fast.map((f) => f[0]).join(", ")} пройдены за ≤5 минут — возможно, пролистаны без выполнения крючков` });
    if (p.journal === 0 && p.lessons.length >= 3) flags.push({ who: p.name, level: "warn", text: "уроки пройдены, но в дневнике ноль записей — практика переноса не началась" });
    if (p.last.includes("дня") || p.last.includes("дней")) flags.push({ who: p.name, level: "risk", text: `последняя активность: ${p.last} — теряет темп, стоит поговорить лично до встречи` });
    if (p.quizHits === null) flags.push({ who: p.name, level: "info", text: "калибровочный квиз недели не пройден" });
    if (p.preds === 0 && p.lessons.length >= 2) flags.push({ who: p.name, level: "info", text: "нет ни одного прогноза" });
  });
  return flags;
}

// ============ УТИЛИТЫ UI ============
const Btn = ({ children, onClick, variant = "primary", disabled, small }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 600,
      fontSize: small ? 13 : 15,
      padding: small ? "8px 14px" : "12px 20px",
      borderRadius: 10,
      border: variant === "ghost" ? `1.5px solid ${C.ink}` : "none",
      background: disabled ? C.grid : variant === "ghost" ? "transparent" : C.teal,
      color: variant === "ghost" ? C.ink : disabled ? C.inkSoft : C.white,
      cursor: disabled ? "default" : "pointer",
      transition: "transform .1s",
    }}
  >
    {children}
  </button>
);

const Tag = ({ children, color = C.tealSoft, text = C.teal }) => (
  <span
    style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: ".04em",
      background: color,
      color: text,
      padding: "3px 8px",
      borderRadius: 6,
      textTransform: "uppercase",
    }}
  >
    {children}
  </span>
);

const Card = ({ children, style }) => (
  <div
    style={{
      background: C.white,
      border: `1px solid ${C.grid}`,
      borderRadius: 14,
      padding: 20,
      boxShadow: "0 1px 3px rgba(24,36,32,.05)",
      ...style,
    }}
  >
    {children}
  </div>
);

// ============ ГРАФИК КАЛИБРОВКИ (SVG) ============
function CalibrationChart({ quizResults, predictions }) {
  // квиз: попадания из 5 при заявленных 90%
  const quizPts = quizResults.map((r, i) => ({ week: i + 1, hit: (r.hits / 5) * 100 }));
  const resolved = predictions.filter((p) => p.resolved !== null);
  // бакеты прогнозов
  const buckets = [55, 65, 75, 85, 95].map((b) => {
    const inB = resolved.filter((p) => {
      const conf = p.conf >= 50 ? p.conf : 100 - p.conf;
      return conf >= b - 5 && conf < b + 5;
    });
    if (!inB.length) return null;
    const hits = inB.filter((p) => {
      const said = p.conf >= 50 ? p.outcome : !p.outcome;
      return p.resolved === said;
    }).length;
    return { conf: b, actual: (hits / inB.length) * 100, n: inB.length };
  }).filter(Boolean);

  const W = 300, H = 190, pad = 34;
  const x = (v) => pad + ((v - 50) / 50) * (W - pad - 12);
  const y = (v) => H - pad + ((0 - v) / 100) * (H - pad - 14) * -1 * -1; // computed below properly
  const yy = (v) => H - 26 - (v / 100) * (H - 26 - 14);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: C.white, borderRadius: 10 }}>
        {[50, 60, 70, 80, 90, 100].map((v) => (
          <g key={v}>
            <line x1={x(v)} y1={14} x2={x(v)} y2={H - 26} stroke={C.grid} strokeWidth="1" />
            <text x={x(v)} y={H - 10} fontSize="9" fontFamily="'IBM Plex Mono',monospace" fill={C.inkSoft} textAnchor="middle">{v}</text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={"h" + v}>
            <line x1={pad} y1={yy(v)} x2={W - 12} y2={yy(v)} stroke={C.grid} strokeWidth="1" />
            <text x={pad - 6} y={yy(v) + 3} fontSize="9" fontFamily="'IBM Plex Mono',monospace" fill={C.inkSoft} textAnchor="end">{v}</text>
          </g>
        ))}
        {/* идеальная калибровка */}
        <line x1={x(50)} y1={yy(50)} x2={x(100)} y2={yy(100)} stroke={C.teal} strokeWidth="1.5" strokeDasharray="5 4" opacity=".55" />
        <text x={x(96)} y={yy(99)} fontSize="9" fontFamily="'IBM Plex Mono',monospace" fill={C.teal} textAnchor="end">идеал</text>
        {/* точки квиза (заявлено 90%) */}
        {quizPts.map((p, i) => (
          <circle key={"q" + i} cx={x(90)} cy={yy(p.hit)} r="5" fill={C.marker} stroke={C.ink} strokeWidth="1.2" />
        ))}
        {/* бакеты прогнозов */}
        {buckets.map((b, i) => (
          <rect key={"b" + i} x={x(b.conf) - 5} y={yy(b.actual) - 5} width="10" height="10" fill={C.teal} rx="2" />
        ))}
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.inkSoft }}>
        <span><span style={{ display: "inline-block", width: 9, height: 9, background: C.marker, border: `1px solid ${C.ink}`, borderRadius: 9, marginRight: 5 }} />квизы (заявлено 90%)</span>
        <span><span style={{ display: "inline-block", width: 9, height: 9, background: C.teal, borderRadius: 2, marginRight: 5 }} />прогнозы</span>
      </div>
      {quizResults.length === 0 && buckets.length === 0 && (
        <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 8 }}>
          Пока пусто. Пройдите калибровочный квиз и заведите первые прогнозы — точки появятся здесь. По горизонтали — насколько вы были уверены, по вертикали — как часто оказались правы. У откалиброванного человека точки лежат на пунктире.
        </p>
      )}
    </div>
  );
}

// ============ ДВИЖОК УРОКА ============
function LessonPlayer({ lesson, onDone, onJournal }) {
  const [step, setStep] = useState(0);
  const [numAns, setNumAns] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState(null);
  const [checkSel, setCheckSel] = useState({});
  const [checkDone, setCheckDone] = useState(false);
  const [entry, setEntry] = useState({ decision: "", args: "", expect: "", conf: 70 });
  const [entrySaved, setEntrySaved] = useState(false);

  const s = lesson.steps[step];
  const next = () => {
    setRevealed(false); setChoice(null); setCheckSel({}); setCheckDone(false); setNumAns("");
    if (step < lesson.steps.length - 1) setStep(step + 1);
    else onDone();
  };

  const H = ({ children }) => (
    <h3 style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 700, fontSize: 17, margin: "0 0 12px", color: C.ink }}>{children}</h3>
  );

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <Tag>Урок {lesson.id} · шаг {step + 1}/{lesson.steps.length}</Tag>
        <div style={{ display: "flex", gap: 4 }}>
          {lesson.steps.map((_, i) => (
            <div key={i} style={{ width: 22, height: 4, borderRadius: 2, background: i <= step ? C.teal : C.grid }} />
          ))}
        </div>
      </div>

      {/* КРЮЧОК ЧИСЛОВОЙ */}
      {s.type === "hookNumber" && (
        <div>
          <Tag color={C.marker} text={C.ink}>Крючок</Tag>
          <p style={{ fontSize: 16, lineHeight: 1.55, margin: "12px 0" }}>{s.prompt}</p>
          {!revealed ? (
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={numAns}
                onChange={(e) => setNumAns(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={s.placeholder}
                style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 18, padding: "10px 14px", border: `1.5px solid ${C.ink}`, borderRadius: 10, width: 110, background: C.paper }}
              />
              <Btn onClick={() => setRevealed(true)} disabled={!numAns}>Ответить</Btn>
            </div>
          ) : (
            <div>
              <div style={{ background: Number(numAns) === s.correct ? C.tealSoft : "#FFF3D6", borderLeft: `4px solid ${Number(numAns) === s.correct ? C.teal : C.marker}`, padding: "12px 16px", borderRadius: "0 10px 10px 0", fontSize: 15, lineHeight: 1.55 }}>
                {Number(numAns) === s.correct ? s.revealCorrect : s.revealTrap}
              </div>
              <div style={{ marginTop: 14 }}><Btn onClick={next}>Дальше</Btn></div>
            </div>
          )}
        </div>
      )}

      {/* КРЮЧОК-ВЫБОР */}
      {s.type === "hookChoice" && (
        <div>
          <Tag color={C.marker} text={C.ink}>Крючок</Tag>
          <p style={{ fontSize: 16, lineHeight: 1.55, margin: "12px 0" }}>{s.prompt}</p>
          {choice === null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.options.map((o, i) => (
                <button key={i} onClick={() => setChoice(i)} style={{ textAlign: "left", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.grid}`, background: C.white, fontSize: 14.5, cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif" }}>
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ background: "#FFF3D6", borderLeft: `4px solid ${C.marker}`, padding: "12px 16px", borderRadius: "0 10px 10px 0", fontSize: 15, lineHeight: 1.55 }}>
                {s.reveal}
              </div>
              <div style={{ marginTop: 14 }}><Btn onClick={next}>Дальше</Btn></div>
            </div>
          )}
        </div>
      )}

      {/* КОНЦЕПТ */}
      {s.type === "concept" && (
        <div>
          <Tag>Концепт</Tag>
          <H>{s.title}</H>
          {s.body.split("\n\n").map((p, i) => (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.62, color: C.ink, margin: "0 0 12px" }}>{p}</p>
          ))}
          <Btn onClick={next}>Понятно, дальше</Btn>
        </div>
      )}

      {/* ПРОВЕРКА */}
      {s.type === "check" && (
        <div>
          <Tag>Проверка</Tag>
          <p style={{ fontSize: 15.5, fontWeight: 600, margin: "12px 0" }}>{s.prompt}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {s.options.map((o, i) => {
              const sel = checkSel[i];
              return (
                <div key={i}>
                  <button
                    onClick={() => !checkDone && setCheckSel({ ...checkSel, [i]: !sel })}
                    style={{
                      width: "100%", textAlign: "left", padding: "11px 15px", borderRadius: 10, fontSize: 14.5, cursor: "pointer",
                      fontFamily: "'IBM Plex Sans',sans-serif",
                      border: `1.5px solid ${checkDone ? (sel === o.ok ? C.teal : C.red) : sel ? C.ink : C.grid}`,
                      background: checkDone ? (sel === o.ok ? C.tealSoft : "#F9E3DC") : sel ? C.paper : C.white,
                    }}
                  >
                    {s.labels ? `${o.t}` : o.t}
                    {s.labels && <span style={{ float: "right", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.inkSoft }}>{sel ? s.labels[0] : s.labels[1]}</span>}
                  </button>
                  {checkDone && (
                    <p style={{ fontSize: 13, color: C.inkSoft, margin: "5px 4px 0", lineHeight: 1.5 }}>{o.fb}</p>
                  )}
                </div>
              );
            })}
          </div>
          {s.labels && !checkDone && <p style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 8 }}>Нажатие переключает: {s.labels[0]} / {s.labels[1]}. Отметьте все как «{s.labels[0]}», что считаете фактами.</p>}
          <div style={{ marginTop: 14 }}>
            {!checkDone ? <Btn onClick={() => setCheckDone(true)}>Проверить</Btn> : <Btn onClick={next}>Дальше</Btn>}
          </div>
        </div>
      )}

      {/* ПЕРВАЯ ЗАПИСЬ ДНЕВНИКА */}
      {s.type === "firstEntry" && (
        <div>
          <Tag>Практика</Tag>
          <p style={{ fontSize: 15.5, fontWeight: 600, margin: "12px 0" }}>{s.prompt}</p>
          {!entrySaved ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={entry.decision} onChange={(e) => setEntry({ ...entry, decision: e.target.value })} placeholder="Какое решение принимаю" style={inputStyle} />
              <textarea value={entry.args} onChange={(e) => setEntry({ ...entry, args: e.target.value })} placeholder="Ключевые аргументы (2–3)" rows={2} style={inputStyle} />
              <input value={entry.expect} onChange={(e) => setEntry({ ...entry, expect: e.target.value })} placeholder="Чего ожидаю в результате" style={inputStyle} />
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: C.inkSoft }}>
                Уверенность: <b style={{ color: C.teal }}>{entry.conf}%</b>
                <input type="range" min="50" max="99" value={entry.conf} onChange={(e) => setEntry({ ...entry, conf: +e.target.value })} style={{ width: "100%", accentColor: C.teal }} />
              </label>
              <Btn disabled={!entry.decision} onClick={() => { onJournal({ ...entry, tag: "Урок 3 · первая запись", date: new Date().toLocaleDateString("ru") }); setEntrySaved(true); }}>
                Сохранить в дневник
              </Btn>
            </div>
          ) : (
            <div>
              <div style={{ background: C.tealSoft, borderLeft: `4px solid ${C.teal}`, padding: "12px 16px", borderRadius: "0 10px 10px 0", fontSize: 15 }}>
                Записано. Через несколько недель эта запись станет материалом для аудита — и вы удивитесь, читая её.
              </div>
              <div style={{ marginTop: 14 }}><Btn onClick={next}>Дальше</Btn></div>
            </div>
          )}
        </div>
      )}

      {/* ПЕРЕНОС */}
      {s.type === "transfer" && (
        <div>
          <Tag color={C.ink} text={C.white}>Перенос в жизнь</Tag>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: "12px 0" }}>{s.prompt}</p>
          {s.journalTag && (
            <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 12 }}>
              Вечером приложение напомнит и предложит записать наблюдение в дневник с меткой «{s.journalTag}».
            </p>
          )}
          <Btn onClick={next}>Завершить урок</Btn>
        </div>
      )}
    </Card>
  );
}

const inputStyle = {
  fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14.5, padding: "10px 14px",
  border: `1.5px solid ${C.grid}`, borderRadius: 10, background: C.paper, width: "100%", boxSizing: "border-box",
};

// ============ КВИЗ ============
function Quiz({ onDone }) {
  const [answers, setAnswers] = useState(QUIZ.map(() => ({ lo: "", hi: "" })));
  const [done, setDone] = useState(false);
  const hits = QUIZ.filter((q, i) => {
    const lo = +answers[i].lo, hi = +answers[i].hi;
    return lo && hi && q.a >= lo && q.a <= hi;
  }).length;

  return (
    <Card>
      <Tag color={C.marker} text={C.ink}>Калибровочный квиз</Tag>
      <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "12px 0" }}>
        Для каждого вопроса дайте интервал, в который истинный ответ попадёт <b>с уверенностью 90%</b>. Цель — не угадать точно, а честно откалиброваться: при 90% вы должны попадать в 4–5 случаях из 5.
      </p>
      {QUIZ.map((q, i) => (
        <div key={i} style={{ margin: "12px 0", padding: "12px 14px", background: done ? (q.a >= +answers[i].lo && q.a <= +answers[i].hi ? C.tealSoft : "#F9E3DC") : C.paper, borderRadius: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>{q.q}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 14 }}>
            <input disabled={done} value={answers[i].lo} onChange={(e) => { const a = [...answers]; a[i] = { ...a[i], lo: e.target.value.replace(/[^\d]/g, "") }; setAnswers(a); }} placeholder="от" style={{ ...inputStyle, width: 90, fontFamily: "'IBM Plex Mono',monospace" }} />
            —
            <input disabled={done} value={answers[i].hi} onChange={(e) => { const a = [...answers]; a[i] = { ...a[i], hi: e.target.value.replace(/[^\d]/g, "") }; setAnswers(a); }} placeholder="до" style={{ ...inputStyle, width: 90, fontFamily: "'IBM Plex Mono',monospace" }} />
            {done && <span style={{ marginLeft: "auto", fontWeight: 600, color: C.teal }}>= {q.a}</span>}
          </div>
        </div>
      ))}
      {!done ? (
        <Btn disabled={answers.some((a) => !a.lo || !a.hi)} onClick={() => setDone(true)}>Проверить</Btn>
      ) : (
        <div>
          <div style={{ background: C.ink, color: C.white, borderRadius: 12, padding: "16px 20px", margin: "8px 0 14px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, opacity: .7 }}>ПОПАДАНИЙ ПРИ ЗАЯВЛЕННЫХ 90%</div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{hits} из 5 <span style={{ fontSize: 16, fontWeight: 400, opacity: .8 }}>= {hits * 20}%</span></div>
            <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
              {hits >= 4 ? "Отличная калибровка — либо широкие честные интервалы, либо эрудиция. Проверим на следующих квизах." : "Типичный результат: уверенность «90%» на деле работает как 40–60%. Это не про знания — это про ширину интервалов. Сверхуверенность лечится только такими сверками."}
            </div>
          </div>
          <Btn onClick={() => onDone(hits)}>Записать результат</Btn>
        </div>
      )}
    </Card>
  );
}

// ============ ГЛАВНОЕ ПРИЛОЖЕНИЕ ============
export default function App() {
  const [tab, setTab] = useState("home");
  const [doneLessons, setDoneLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [journal, setJournal] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [newPred, setNewPred] = useState({ text: "", conf: 70 });
  const [newEntry, setNewEntry] = useState({ decision: "", args: "", expect: "", conf: 70 });

  const addJournal = (e) => setJournal([{ ...e }, ...journal]);

  const tabs = [
    ["home", "Главная"],
    ["lessons", "Уроки"],
    ["journal", "Дневник"],
    ["preds", "Прогнозы"],
    ["meet", "Встреча"],
    ["curator", "Куратор"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.paper, backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`, backgroundSize: "24px 24px", fontFamily: "'IBM Plex Sans',sans-serif", color: C.ink }}>
      <style>{FONTS}</style>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 90px" }}>

        {/* ШАПКА */}
        <header style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, fontSize: 22, letterSpacing: "-.02em" }}>
            ОПТИКА<span style={{ color: C.teal }}>_</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft }}>прибор для наблюдения за мышлением · неделя 1/12</div>
        </header>

        {/* ГЛАВНАЯ */}
        {tab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card style={{ background: C.ink, color: C.white, border: "none" }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, opacity: .65, letterSpacing: ".06em" }}>МОЯ КАЛИБРОВКА</div>
              <p style={{ fontSize: 13.5, opacity: .85, lineHeight: 1.5, margin: "6px 0 12px" }}>
                Главная метрика курса: совпадает ли ваша уверенность с реальностью.
              </p>
              <div style={{ background: C.white, borderRadius: 10, padding: 10 }}>
                <CalibrationChart quizResults={quizResults} predictions={predictions} />
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Tag>Сегодня</Tag>
                  <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>
                    {doneLessons.length < 3 ? `Урок ${doneLessons.length + 1}: ${LESSONS[doneLessons.length].title}` : "Уроки недели пройдены"}
                  </div>
                  <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>
                    {doneLessons.length < 3 ? `≈ ${LESSONS[doneLessons.length].minutes} минут` : "Встреча группы — в пятницу"}
                  </div>
                </div>
                {doneLessons.length < 3 && (
                  <Btn onClick={() => { setActiveLesson(LESSONS[doneLessons.length]); setTab("lessons"); }}>Начать</Btn>
                )}
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                [doneLessons.length + "/3", "урока недели"],
                [journal.length, "записей в дневнике"],
                [predictions.length, "прогнозов"],
              ].map(([v, l], i) => (
                <Card key={i} style={{ padding: 14, textAlign: "center" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 22, fontWeight: 600, color: C.teal }}>{v}</div>
                  <div style={{ fontSize: 11.5, color: C.inkSoft }}>{l}</div>
                </Card>
              ))}
            </div>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Калибровочный квиз недели</div>
                  <div style={{ fontSize: 13, color: C.inkSoft }}>5 вопросов · интервалы 90% · 4 минуты</div>
                </div>
                <Btn variant="ghost" small onClick={() => { setShowQuiz(true); setTab("preds"); }}>
                  {quizResults.length ? "Ещё раз" : "Пройти"}
                </Btn>
              </div>
            </Card>
          </div>
        )}

        {/* УРОКИ */}
        {tab === "lessons" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {activeLesson ? (
              <>
                <button onClick={() => setActiveLesson(null)} style={{ background: "none", border: "none", color: C.teal, fontWeight: 600, fontSize: 14, cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "'IBM Plex Sans',sans-serif" }}>← Все уроки</button>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{activeLesson.title}</h2>
                <LessonPlayer
                  lesson={activeLesson}
                  onJournal={addJournal}
                  onDone={() => {
                    if (!doneLessons.includes(activeLesson.id)) setDoneLessons([...doneLessons, activeLesson.id]);
                    setActiveLesson(null);
                  }}
                />
              </>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Модуль 1 · Наблюдение за мышлением</h2>
                {LESSONS.map((l, i) => {
                  const done = doneLessons.includes(l.id);
                  const locked = i > doneLessons.length;
                  return (
                    <Card key={l.id} style={{ opacity: locked ? 0.55 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.inkSoft }}>УРОК {l.id} · {l.minutes} МИН</div>
                          <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 3 }}>{l.title}</div>
                        </div>
                        {done ? <Tag>Пройден ✓</Tag> : locked ? <Tag color={C.grid} text={C.inkSoft}>Позже</Tag> : <Btn small onClick={() => setActiveLesson(l)}>Открыть</Btn>}
                      </div>
                    </Card>
                  );
                })}
                <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
                  Уроки открываются последовательно — по одному в день. Недели 2–12 подключаются по карте программы (36 уроков, 4 модуля).
                </p>
              </>
            )}
          </div>
        )}

        {/* ДНЕВНИК */}
        {tab === "journal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Дневник решений</h2>
            <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>
              Личный. Никому не виден. На встречу попадает только то, что вы явно пометите «поделиться».
            </p>
            <Card>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={newEntry.decision} onChange={(e) => setNewEntry({ ...newEntry, decision: e.target.value })} placeholder="Какое решение принимаю" style={inputStyle} />
                <textarea value={newEntry.args} onChange={(e) => setNewEntry({ ...newEntry, args: e.target.value })} placeholder="Ключевые аргументы (2–3)" rows={2} style={inputStyle} />
                <input value={newEntry.expect} onChange={(e) => setNewEntry({ ...newEntry, expect: e.target.value })} placeholder="Чего ожидаю" style={inputStyle} />
                <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: C.inkSoft }}>
                  Уверенность: <b style={{ color: C.teal }}>{newEntry.conf}%</b>
                  <input type="range" min="50" max="99" value={newEntry.conf} onChange={(e) => setNewEntry({ ...newEntry, conf: +e.target.value })} style={{ width: "100%", accentColor: C.teal }} />
                </label>
                <Btn disabled={!newEntry.decision} onClick={() => { addJournal({ ...newEntry, tag: "запись", date: new Date().toLocaleDateString("ru") }); setNewEntry({ decision: "", args: "", expect: "", conf: 70 }); }}>
                  Записать
                </Btn>
              </div>
            </Card>
            {journal.map((e, i) => (
              <Card key={i}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Tag>{e.tag}</Tag>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: C.inkSoft }}>{e.date} · {e.conf}%</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, margin: "8px 0 4px" }}>{e.decision}</div>
                {e.args && <div style={{ fontSize: 13.5, color: C.inkSoft }}>Аргументы: {e.args}</div>}
                {e.expect && <div style={{ fontSize: 13.5, color: C.inkSoft }}>Ожидаю: {e.expect}</div>}
              </Card>
            ))}
            {!journal.length && <p style={{ fontSize: 14, color: C.inkSoft }}>Пока пусто. Первая запись создаётся в уроке 3 — или прямо здесь.</p>}
          </div>
        )}

        {/* ПРОГНОЗЫ */}
        {tab === "preds" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Прогнозы и калибровка</h2>
            {showQuiz ? (
              <Quiz onDone={(hits) => { setQuizResults([...quizResults, { hits, date: Date.now() }]); setShowQuiz(false); }} />
            ) : (
              <>
                <Card>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Новый прогноз</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input value={newPred.text} onChange={(e) => setNewPred({ ...newPred, text: e.target.value })} placeholder="Проверяемое событие: «релиз X выйдет до 15.08»" style={inputStyle} />
                    <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: C.inkSoft }}>
                      Вероятность, что сбудется: <b style={{ color: C.teal }}>{newPred.conf}%</b>
                      <input type="range" min="5" max="95" step="5" value={newPred.conf} onChange={(e) => setNewPred({ ...newPred, conf: +e.target.value })} style={{ width: "100%", accentColor: C.teal }} />
                    </label>
                    <Btn disabled={!newPred.text} onClick={() => { setPredictions([{ text: newPred.text, conf: newPred.conf, outcome: true, resolved: null }, ...predictions]); setNewPred({ text: "", conf: 70 }); }}>
                      Поставить
                    </Btn>
                  </div>
                </Card>
                {predictions.map((p, i) => (
                  <Card key={i}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.text}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, color: C.teal, fontWeight: 600 }}>{p.conf}%</span>
                      {p.resolved === null ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn small variant="ghost" onClick={() => { const a = [...predictions]; a[i] = { ...p, resolved: true }; setPredictions(a); }}>Сбылось</Btn>
                          <Btn small variant="ghost" onClick={() => { const a = [...predictions]; a[i] = { ...p, resolved: false }; setPredictions(a); }}>Нет</Btn>
                        </div>
                      ) : (
                        <Tag color={p.resolved ? C.tealSoft : "#F9E3DC"} text={p.resolved ? C.teal : C.red}>{p.resolved ? "Сбылось" : "Не сбылось"}</Tag>
                      )}
                    </div>
                  </Card>
                ))}
                {!predictions.length && <p style={{ fontSize: 14, color: C.inkSoft }}>Норма недели 1: 2–3 прогноза. Хороший прогноз через месяц можно однозначно проверить.</p>}
              </>
            )}
          </div>
        )}

        {/* ВСТРЕЧА */}
        {tab === "meet" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Встреча недели {CARD1.week}</h2>
            <Card style={{ borderLeft: `4px solid ${C.teal}` }}>
              <Tag>Сценарная карточка ведущего</Tag>
              <div style={{ fontWeight: 700, fontSize: 17, margin: "10px 0 4px" }}>{CARD1.title}</div>
              <div style={{ fontSize: 13, color: C.inkSoft }}>{CARD1.lead}</div>
              <div style={{ background: "#FFF3D6", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, margin: "12px 0", lineHeight: 1.5 }}>
                <b>Цель:</b> {CARD1.goal}
              </div>
              {CARD1.timeline.map(([t, d], i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < CARD1.timeline.length - 1 ? `1px dashed ${C.grid}` : "none" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, color: C.teal, fontWeight: 600, minWidth: 44 }}>{t}</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>{d}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, fontSize: 13, fontStyle: "italic", color: C.inkSoft }}>
                Фраза-камертон, если группа зажата: {CARD1.phrase}
              </div>
            </Card>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Правила группы (оборот карточки)</div>
              {CARD1.rules.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 14 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: C.teal, fontWeight: 600 }}>{i + 1}</span>
                  <span>{r}</span>
                </div>
              ))}
            </Card>
            <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
              В четверг приложение соберёт для каждого участника «что принести на встречу» из его материалов недели.
            </p>
          </div>
        )}

        {/* КУРАТОР */}
        {tab === "curator" && (() => {
          const me = { name: "Вы (Андрей)", role: "Куратор программы", last: "сейчас", lessons: doneLessons.map((id, i) => [String(id), "сегодня", LESSONS.find((l) => l.id === id)?.minutes || 10]), journal: journal.length, shared: 0, preds: predictions.length, quizHits: quizResults.length ? quizResults[quizResults.length - 1].hits : null };
          const all = [me, ...TEAM];
          const flags = teamFlags(TEAM);
          const activeToday = all.filter((p) => p.last.includes("сегодня") || p.last === "сейчас").length;
          const lessonsDone = all.reduce((s, p) => s + p.lessons.length, 0);
          const allMins = all.flatMap((p) => p.lessons.map(([, , m]) => m));
          const avgMin = allMins.length ? Math.round(allMins.reduce((a, b) => a + b, 0) / allMins.length) : 0;
          const quizDone = all.filter((p) => p.quizHits !== null).length;
          const flagColor = { risk: "#F9E3DC", warn: "#FFF3D6", info: C.paper };
          const flagBorder = { risk: C.red, warn: C.marker, info: C.grid };
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Куратор · неделя 1</h2>

              {/* Принцип приватности — виден куратору всегда */}
              <div style={{ background: C.ink, color: C.white, borderRadius: 12, padding: "12px 16px", fontSize: 13, lineHeight: 1.55 }}>
                <b>Вы видите активность, но не содержание.</b> Тексты дневников и формулировки прогнозов участникам обещаны как приватные (урок 3) — доступны только факты и количество. Это условие честности их записей.
              </div>

              {/* Сводка недели */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  [`${activeToday}/${all.length}`, "активны сегодня"],
                  [`${lessonsDone}/${all.length * 3}`, "уроков недели пройдено"],
                  [`${avgMin} мин`, "среднее время урока"],
                  [`${quizDone}/${all.length}`, "прошли квиз недели"],
                ].map(([v, l], i) => (
                  <Card key={i} style={{ padding: 14, textAlign: "center" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, fontWeight: 600, color: C.teal }}>{v}</div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft }}>{l}</div>
                  </Card>
                ))}
              </div>

              {/* Зона внимания */}
              <Card>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Зона внимания</div>
                {flags.length ? flags.map((f, i) => (
                  <div key={i} style={{ background: flagColor[f.level], borderLeft: `3.5px solid ${flagBorder[f.level]}`, borderRadius: "0 8px 8px 0", padding: "9px 12px", margin: "6px 0", fontSize: 13.5, lineHeight: 1.45 }}>
                    <b>{f.who}:</b> {f.text}
                  </div>
                )) : <p style={{ fontSize: 13.5, color: C.inkSoft }}>Флагов нет — группа идёт в темпе.</p>}
                <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
                  Флаги строятся автоматически по метаданным: скорость прохождения, паузы в активности, отсутствие практик. Рекомендация: реагировать личным разговором, а не в общем чате.
                </p>
              </Card>

              {/* Участники */}
              <div style={{ fontWeight: 700, fontSize: 15 }}>Участники — {all.length}</div>
              {all.map((p, i) => (
                <Card key={i} style={{ borderLeft: i === 0 ? `4px solid ${C.teal}` : undefined }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                      <span style={{ fontSize: 12.5, color: C.inkSoft, marginLeft: 8 }}>{p.role}</span>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: p.last.includes("дн") ? C.red : C.inkSoft }}>{p.last}</span>
                  </div>

                  {/* Уроки: когда и как быстро */}
                  <div style={{ display: "flex", gap: 6, margin: "10px 0 8px", flexWrap: "wrap" }}>
                    {[1, 2, 3].map((n) => {
                      const l = p.lessons.find(([id]) => id === String(n));
                      const tooFast = l && l[2] <= 5;
                      return (
                        <div key={n} style={{
                          fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, padding: "5px 9px", borderRadius: 7,
                          background: l ? (tooFast ? "#FFF3D6" : C.tealSoft) : C.paper,
                          border: `1px solid ${l ? (tooFast ? C.marker : C.teal) : C.grid}`,
                          color: l ? C.ink : C.inkSoft,
                        }}>
                          {l ? `Урок ${n} · ${l[1]} · ${l[2]} мин${tooFast ? " ⚠" : ""}` : `Урок ${n} · —`}
                        </div>
                      );
                    })}
                  </div>

                  {/* Счётчики практик — количество, не содержание */}
                  <div style={{ display: "flex", gap: 14, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: C.inkSoft, flexWrap: "wrap" }}>
                    <span>дневник: <b style={{ color: p.journal ? C.teal : C.red }}>{p.journal}</b> зап.</span>
                    <span>к встрече: <b style={{ color: C.ink }}>{p.shared}</b></span>
                    <span>прогнозы: <b style={{ color: p.preds ? C.teal : C.red }}>{p.preds}</b></span>
                    <span>квиз: <b style={{ color: p.quizHits === null ? C.red : C.teal }}>{p.quizHits === null ? "—" : `${p.quizHits}/5`}</b></span>
                  </div>
                </Card>
              ))}

              <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>
                «К встрече» — сколько материалов участник пометил «поделиться с группой»: единственное содержание, которое становится видимым, и только на встрече. Данные участников в прототипе — демонстрационные; ваша строка (выделена) собирается из реальных действий в приложении.
              </p>
            </div>
          );
        })()}
      </div>

      {/* НИЖНЯЯ НАВИГАЦИЯ */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.grid}`, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", maxWidth: 560, width: "100%" }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setActiveLesson(null); setShowQuiz(false); }}
              style={{
                flex: 1, padding: "13px 4px 15px", background: "none", border: "none", cursor: "pointer",
                fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12.5,
                fontWeight: tab === id ? 700 : 500,
                color: tab === id ? C.teal : C.inkSoft,
                borderTop: tab === id ? `2.5px solid ${C.teal}` : "2.5px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
