/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
  safelist: [
  'bg-indigo-600','text-white',
  'group-hover:bg-indigo-600','group-hover:text-white',
  'hover:bg-indigo-600','hover:text-white'
],
}