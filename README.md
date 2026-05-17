# IOL Calc Abakarov — Веб-версия

Веб-калькулятор силы интраокулярной линзы (ИОЛ). Реализован на React + TypeScript + Vite + Tailwind CSS.

---

## Запуск локально

### 1. Установите Node.js

Скачайте и установите с [nodejs.org](https://nodejs.org/) (рекомендуется LTS).  
В вашей папке Downloads уже есть установщик: `node-v24.15.0.pkg`.

### 2. Установите зависимости

```bash
cd iol-calculator
npm install
```

### 3. Запустите дев-сервер

```bash
npm run dev
```

Откроется на `http://localhost:5173`

### 4. Сборка для продакшна

```bash
npm run build
```

Файлы появятся в папке `dist/`.

### 5. Тесты

```bash
npm test
```

---

## Деплой на Vercel

### Вариант A — через GitHub (рекомендуется)

1. Создайте репозиторий на GitHub и запушьте папку `iol-calculator`.
2. Войдите на [vercel.com](https://vercel.com) → **Add New Project**.
3. Выберите репозиторий, фреймворк Vite определится автоматически.
4. Нажмите **Deploy** — готово.

### Вариант B — через Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Структура проекта

```
src/
├── types/         — TypeScript-типы
├── data/
│   ├── units.ts            — единицы измерения, подсказки
│   ├── referenceRanges.ts  — нормальные диапазоны параметров
│   └── mockCorrections.ts  — ⚠️ MOCK-константы (поправки Абакарова)
├── calculations/
│   ├── srkt.ts             — формула SRK/T (Retzlaff 1990)
│   ├── holladay1.ts        — Holladay-like (частично MOCK)
│   ├── corrections.ts      — поправки на стекловидное тело, фиксацию, этнос
│   └── index.ts            — главная функция calculateIOL()
├── components/
│   ├── Header.tsx
│   ├── Disclaimer.tsx
│   ├── InputForm.tsx
│   └── ResultsPanel.tsx
├── tests/
│   └── calculations.test.ts
├── validation.ts
├── App.tsx
└── main.tsx
```

---

## ⚠️ Что сейчас является MOCK

Следующие данные — **заглушки**. Они извлечены из структуры оригинальной программы,
но **числовые значения не верифицированы** по первоисточнику:

| Константа | Файл | Что нужно |
|-----------|------|-----------|
| `DELTA_P_OIL_1000` | `mockCorrections.ts` | Поправка к силе ИОЛ при масле 1000 сСт |
| `DELTA_P_OIL_5000` | `mockCorrections.ts` | Поправка к силе ИОЛ при масле 5000 сСт |
| `DELTA_P_GAS` | `mockCorrections.ts` | Поправка при газовой тампонаде |
| `DELTA_P_PPV` | `mockCorrections.ts` | Поправка после витрэктомии |
| `UNCERTAINTY_*` | `mockCorrections.ts` | Диапазоны неопределённости |
| `ETHNIC_ELP_ADJUST` | `mockCorrections.ts` | Этнические поправки к ELP |
| `DELTA_ELP_CB/SCLERA/TUNNEL` | `mockCorrections.ts` | Поправки ELP по методу фиксации |
| Коэффициенты Holladay-like | `holladay1.ts` | SF-конвертация, константа 0.56 и хорда 12 мм |

---

## Что нужно уточнить для финальной медицинской версии

1. **Публикация Абакарова** — точное название статьи, журнал, год, все числовые константы.
2. **Поправки на силиконовое масло** — значения DELTA_P для 1000/1300/5000 сСт.
3. **Поправки на газ и PPV** — точные значения из публикации.
4. **Формула Holladay-like** — точные коэффициенты ELP в версии Абакарова.
5. **Этнические поправки** — обоснование и численные значения.
6. **Диапазоны неопределённости** — из клинических данных публикации.
7. **Валидация поправки AL для оптической биометрии** — оригинальный SRK/T использовал ультразвук; для IOL Master коэффициенты иные.

---

## Источники реализованных формул

- **SRK/T**: Retzlaff JA, Sanders DR, Kraff MC. J Cataract Refract Surg. 1990;16(3):333–340.
- **Holladay 1 (базис)**: Holladay JT et al. J Cataract Refract Surg. 1988;14(1):17–24.
- **Референсные диапазоны**: Olsen T. J Cataract Refract Surg. 2007; ESCRS Calculator Guidelines.
