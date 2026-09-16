# PEA Room Booking

คู่มือสำหรับเปิด Database, Backend และ Frontend ของระบบ **PEA Room Booking**

---

Markdown Preview : Ctrl + Shift + V

---
## 📋 Requirements

ตรวจสอบว่าติดตั้งโปรแกรมเหล่านี้แล้ว

* PostgreSQL
* Go
* Node.js
* npm

---

# 🗄️ 0. ต้องมี PostgreSQL ทำงานอยู่ และต้องมี Database

ถ้ายังไม่มี Database ให้สร้างก่อน เช่นใน pgAdmin → Query Tool

```sql
CREATE DATABASE pea_booking;
```

'''Import database
\i 'C:/Users/User/Downloads/DB_PEA/DB_Meeting_RoomBooking.sql'
'''
ถ้าPostgreSQL มี ทำงานอยู่ และต้องมี Database ชื่อ: pea_booking

# 🗄️ 1. Start PostgreSQL

เปิด **PostgreSQL** ก่อนเริ่มระบบ

### Database Configuration

| Setting      | Value          |
| ------------ | -------------- |
| **Host**     | `localhost`    |
| **Port**     | `5432`         |
| **User**     | `postgres`     |
| **Password** | `yourpassword` |
| **Database** | `pea_booking`  |

> ⚠️ เปลี่ยน `yourpassword` เป็น Password ของ PostgreSQL ที่ตั้งไว้จริง

---

# 🚀 2. Run Backend

เปิด Terminal / PowerShell แล้วเข้าไปที่โฟลเดอร์ **Backend**

```bash
cd Backend
```

จากนั้น Download Dependencies

```bash
go mod download
```

และ Start Backend

```bash
go run ./cmd/main.go
```

ถ้า Backend ทำงานสำเร็จ จะเห็นประมาณว่า:

```text
PEA Room Booking API v1
Fiber v2.x.x
http://127.0.0.1:3000
```

### Backend URL

```text
http://localhost:3000
```

---

# 💻 3. Run Frontend

เปิด **Terminal ใหม่** อีกหน้าต่าง

เข้าไปที่โฟลเดอร์ **Frontend**

```bash
cd Frontend
```

ติดตั้ง Dependencies:

```bash
npm install
```

จากนั้น Start Frontend:

```bash
npm run dev
```

ระบบจะแสดง URL สำหรับเข้าเว็บไซต์ เช่น:

```text
http://localhost:3000
```

> ⚠️ ถ้า Port `3000` ถูก Backend ใช้อยู่ Frontend อาจเปลี่ยนไปใช้ Port อื่น เช่น `3001` หรือ `5173` ให้ใช้ URL ที่ Terminal แสดง

---

# 🛑 4. Stop Server

หากต้องการหยุด Backend หรือ Frontend

กด:

```text
Ctrl + C
```

---

# 🔄 Quick Start

เมื่อต้องการเปิดระบบอีกครั้ง ให้ทำตามลำดับนี้:

### 1. PostgreSQL

เปิด PostgreSQL และตรวจสอบว่า Database พร้อมใช้งาน

```text
Database: pea_booking
Host: localhost
Port: 5432
```

### 2. Backend

```bash
cd Backend
go mod download
go run ./cmd/main.go
```

### 3. Frontend

เปิด Terminal ใหม่:

```bash
cd Frontend
npm install
npm run dev
```

### 4. เปิดระบบ

เปิด Browser แล้วเข้า URL ที่ Frontend แสดงใน Terminal

---

# 🛑 Shutdown

เมื่อใช้งานเสร็จ:

1. กลับไปที่ Terminal ของ **Frontend**
2. กด `Ctrl + C`
3. กลับไปที่ Terminal ของ **Backend**
4. กด `Ctrl + C`
5. ปิด PostgreSQL หากไม่ใช้งานต่อ

---

## 📌 Command Summary

| งาน                      | Command                |
| ------------------------ | ---------------------- |
| เข้า Backend             | `cd Backend`           |
| Download Go Dependencies | `go mod download`      |
| Run Backend              | `go run ./cmd/main.go` |
| เข้า Frontend            | `cd Frontend`          |
| Install npm Dependencies | `npm install`          |
| Run Frontend             | `npm run dev`          |
| Stop Server              | `Ctrl + C`             |

---

## 🗂️ Project Structure

```text
PEA-Room-Booking/
│
├── Backend/
│   ├── cmd/
│   │   └── main.go
│   ├── go.mod
│   └── ...
│
├── Frontend/
│   ├── package.json
│   ├── src/
│   └── ...
│
└── README.md
```

---

## ⚡ TL;DR

```text
1. Start PostgreSQL
        ↓
2. Start Backend
   cd Backend
   go mod download
   go run ./cmd/main.go
        ↓
3. Start Frontend (Terminal ใหม่)
   cd Frontend
   npm install
   npm run dev
        ↓
4. Open Browser
        ↓
5. Stop → Ctrl + C
```

## F12
'''text
localStorage.removeItem('pea_registered_users')
'''
