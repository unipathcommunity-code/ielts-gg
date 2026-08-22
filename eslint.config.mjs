import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // UI matni o'zbekcha va o'zbek imlosida apostrof doimiy ishlatiladi
      // (o', g', to'xtatildi...). Har birini &apos; ga aylantirish manbani o'qib
      // bo'lmas holga keltiradi va hech qanday runtime foydasi yo'q — 179 ta "xato"
      // shu sababdan chiqar edi va haqiqiy hook bug'larini ko'mib tashlar edi.
      "react/no-unescaped-entities": "off",

      // Supabase javoblari va AI JSON'lari uchun `any` ataylab ishlatiladi.
      // Bu sifat masalasi, xato emas — shuning uchun warn (build'ni to'xtatmaydi).
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
