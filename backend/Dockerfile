# استخدم صورة node.js الأساسية
FROM node:16

# تعيين مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ package.json و package-lock.json لتثبيت التبعيات أولاً
COPY package*.json ./

# تثبيت التبعيات
RUN npm install

# نسخ باقي الملفات إلى الحاوية
COPY . .

# تعيين المتغيرات البيئية، إذا كنت تستخدم .env
ENV MONGODB_URI=mongodb://mongodb:27017/healthcare
ENV PORT=3001

# فتح المنفذ الذي يعمل عليه السيرفر
EXPOSE 3001

# تشغيل التطبيق
CMD ["npm", "start"]
