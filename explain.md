# FSBridge — Comprehensive Project Documentation

FSBridge is a next-generation, secure, and AI-powered academic hub designed to eliminate bureaucratic bottlenecks in university environments. By unifying student portals, grading frameworks, dynamic scheduling, serverless document generation, and structured AI validation engines into a single ecosystem, it modernizes daily operations for Students, Professors, and Administrative Staff.

---

## Table of Contents
1. [Core Features & User Portals](#1-core-features--user-portals)
2. [Technical Architecture](#2-technical-architecture)
3. [Database Schema & Security (Row Level Security)](#3-database-schema--security-row-level-security)
4. [The Serverless Document Generation Pipeline](#4-the-serverless-document-generation-pipeline)
5. [AI Orchestration (Gemini & RAG)](#5-ai-orchestration-gemini--rag)
6. [Frontend Design System & Aesthetics](#6-frontend-design-system--aesthetics)
7. [Production Deployment & Scalability](#7-production-deployment--scalability)

---

## 1. Core Features & User Portals

FSBridge splits academic operations into three secure, role-restricted dashboard environments:

### A. Student Portal
*   **Smart Dashboard**: Instantly aggregates raw grades, correlates them with specific course coefficients, and computes a running GPA on the fly.
*   **Dynamic Timetable**: A highly responsive visual calendar that reads schedule structures from the database. It renders classes based on the student's program (Filière) and current date.
*   **Document Generation Desk**: Allows students to request official certificates (such as enrollment certificates or transcripts) via a simplified drawer interface.
*   **RAG-Powered Chat Assistant**: An interactive chat window that allows students to query their academic performance, schedules, and administrative criteria, getting instant responses based on their real-time database state.

### B. Professor Portal
*   **Grade Management**: A secure ledger interface allowing professors to input, review, and modify grades for subjects they are assigned to.
*   **Dynamic Class Scheduling**: Enables updating session locations, hours, and descriptions, pushing updates instantly to the student calendar.
*   **Course Coordination Desk**: Allows adding modules, modifying syllabus descriptions, and coordinating coefficient weights.

### C. Administrative Portal
*   **User Provisioning (CRUD)**: Create, read, update, or delete profiles for students and professors.
*   **Document Request Hub**: A verification center highlighting incoming document generation requests. It displays automated validation outcomes provided by the AI, allowing admins to oversee, manually verify, or override approvals.
*   **Filière & Curriculum Designer**: A high-level control panel to add new academic programs, modify subject matrices, and configure coefficients.

---

## 2. Technical Architecture

FSBridge is designed around a modern **BaaS (Backend-as-a-Service)** model that completely removes the requirement for a traditional, stateful backend middleware API server:

```
               +----------------------------------------+
               |              React Client              |
               |       (Vite, Tailwind v4, Framer)      |
               +---+--------------------------------+---+
                   |                                |
   Reads/Writes via Postgres Client    Triggers Serverless Execution
   (Gated securely by RLS Policies)    (Deno Runtime via HTTPS POST)
                   v                                v
+------------------+---------------+    +-----------+------------+
|             Supabase             |    |   Supabase Edge Function|
|  (PostgreSQL relational database)|    |     ("document-agent")  |
+------------------+---------------+    +-----+--------------+---+
                   |                          |              |
           Stores compiled PDFs       Executes jsPDF   Validates JSON
                   v                          v              v
+------------------+---------------+    +-----+---+      +---+---+
|         Supabase Storage         |    |  Deno   |      |Gemini |
|    (Securely saves static PDFs)  |    |  Canvas |      |  API  |
+----------------------------------+    +---------+      +-------+
```

### Stack Components:
1.  **Frontend Framework**: **React 18** compiled using **Vite** for optimized assets, esbuild speed, and instant Hot Module Replacement (HMR).
2.  **Styling & Motion**: **Tailwind CSS (v4)** coupled with **Framer Motion** for premium physics-based transitions, interactive panels, and fluid micro-interactions.
3.  **Database & Auth (BaaS)**: **Supabase** offering a fully-managed **PostgreSQL** relational database, **GoTrue (JWT)** identity authentication, and asset file buckets.
4.  **Serverless Computing**: **Supabase Deno Edge Functions** executing globally close to the end-user with zero cold starts.
5.  **Intelligence Layer**: **Google Gemini (1.5 Flash)** used for low-latency JSON structure enforcement, intelligent routing, and Context-Aware AI Chat.

---

## 3. Database Schema & Security (Row Level Security)

Security in FSBridge is enforced at the **database level** via PostgreSQL **Row Level Security (RLS)**. This is a critical security architecture: instead of relying on frontend verification, Postgres policies reject invalid read/write requests directly at the SQL engine level.

### A. Core Relational Schema

*   **`profiles`**: Links to `auth.users` to save profile details (name, email, role: `'student' | 'professor' | 'admin'`, filiere_id).
*   **`filières`**: Academic tracks (e.g., Software Engineering, Data Science).
*   **`modules`**: Larger groupings of courses (e.g., Development Web, Advanced Mathematics).
*   **`subjects`**: Individual courses belonging to modules, carrying coefficients (e.g., React JS with Coef 4).
*   **`grades`**: Maps grades (`value`) to specific `student_id` (foreign key to `profiles`) and `subject_id`.
*   **`schedules`**: Session schedules containing `subject_id`, `professor_id`, `start_time`, `end_time`, `room`, and `day_of_week`.
*   **`document_requests`**: Holds request statuses, generated PDF storage URLs, and AI validation logs.

### B. Row Level Security Examples

Every query initiated by the React application carries a secure, cryptographic JSON Web Token (JWT) containing the user's ID (`auth.uid()`) and role.

#### Example RLS Policy: Grades
Only the student who owns the grade, the assigned professor of that course, or an administrator can access it:
```sql
CREATE POLICY "Grades access controls" ON grades
FOR SELECT TO authenticated
USING (
  student_id = auth.uid() -- A student can only view their own grades
  OR EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.id = grades.subject_id 
    AND s.professor_id = auth.uid() -- Or if the user is the assigned professor
  )
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' -- Or if the user is an administrator
  )
);
```

---

## 4. The Serverless Document Generation Pipeline

FSBridge completely automates document creation, avoiding human delay. The process works as follows:

```
[React Client] ──> Inserts Request ──> [Database Trigger / Webhook]
                                                     │
[Client URL Download] <── Signed Link <── Uploads PDF <── [Deno Edge Function]
```

### High-Performance PDF Compiling:
*   **Ephemeral Sandbox Sandbox (V8)**: Supabase Edge Functions run inside an isolated Deno container. They have no permanent file system access and cannot query local paths.
*   **Base64 Asset Loader (`logo.ts`)**: To include branding, the FSBridge logo (`logo-fsb-pdf.png`) is encoded into a Base64 string and compiled directly into the TypeScript module.
*   **jsPDF Rendering Engine**: The Edge function draws the document programmatically using `jsPDF`. It reads student data (Grades, Filière, Profile) dynamically from Postgres, compiles the coordinates, attaches the Base64 logo in the top-right corner, and stamps a digital administrative signature.
*   **Secure Upload & Temporary Delivery**: The output buffer is pushed straight to a secure private Supabase Storage bucket. The Edge Function then creates a temporary, cryptographically signed URL (valid for 5 minutes) and updates the request record, letting the student download their document securely.

---

## 5. AI Orchestration (Gemini & RAG)

FSBridge features deep artificial intelligence integration divided into two distinct engines:

### A. AI Automated Document Validation
When a document is requested, the system invokes Gemini to run an initial administrative check.
*   **JSON-Schema Enforced Outputs**: To prevent hallucination and parse outputs reliably, the Edge function defines a rigid response schema using the Google Gen AI SDK:
    ```typescript
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        decision: { 
          type: SchemaType.STRING, 
          description: "Must be 'approuve' if grades and payment stand, or 'rejete' if outstanding criteria remain.",
          enum: ["approuve", "rejete"] 
        },
        raison: { 
          type: SchemaType.STRING, 
          description: "Clear French administrative justification." 
        }
      },
      required: ["decision", "raison"]
    };
    ```
*   **Low Temperature**: Gemini is executed with `temperature: 0.1` to enforce strict logical analysis and prevent variations in decision-making. If "approuve", the PDF is generated instantly; if "rejete", it is flagged for manual admin override.

### B. Retrieval-Augmented Generation (RAG) Chatbot
The conversational student helper implements a custom RAG paradigm:
1.  **Context Assembly**: When a student opens the chat and asks a question (e.g., *"What is my average in Dev Web?"*), the client doesn't just send the raw query.
2.  **Payload Ingestion**: The system queries the student's active database tables (`profiles`, `grades`, `schedules`).
3.  **Prompt Enrichment**: It builds an extensive, secure system instruction prompt that injects the student's specific grades, coefficient matrices, and schedule arrays, followed by their message:
    ```
    System: "You are the FSBridge Assistant. The student is logged in. 
    Here is their verified academic record:
    - Name: Sarah Connor
    - Filière: Software Engineering
    - Grades: [React JS: 17/20 (Coef 4), Python: 11/20 (Coef 2)]
    
    Answer their questions truthfully using ONLY the context provided above. 
    If they ask about grades not listed, guide them politely."
    ```
4.  **Instant Answer**: Gemini reads the context, processes the mathematical average, and returns a tailored, context-accurate explanation instantly.

---

## 6. Frontend Design System & Aesthetics

FSBridge implements a striking, highly interactive **Neo-Brutalist / Retrofly** design system that stands out drastically from boring corporate dashboards:

*   **Vibrant, Brand-Compliant Palette**: Built using dynamic HSL configurations:
    *   **Background**: `#FAFAF7` (Warm Cream paper)
    *   **Foreground & Borders**: `#0A0A0A` (Ink Black)
    *   **Primary Accent**: `#F5A623` (Mustard Yellow)
    *   **Highlights**: `#D35435` (Terracotta/Red-Orange)
*   **Heavy Retro Outlines**: Cards, fields, and buttons feature stark, solid `3px` black borders (`retro-border`) and zero-blur shifted shadows (`retro-shadow`), providing a clean, modern aesthetic.
*   **Fluid Framer Animations**: Subtle transition animations are bound to page changes, drawer toggles, and hover states, keeping the interface feeling snappy, responsive, and tactile.

---

## 7. Production Deployment & Scalability

FSBridge's serverless design allows the infrastructure to scale to thousands of concurrent users without overhead:

*   **Database Scalability**: Supabase utilizes PostgreSQL's underlying connection pooler (**PgBouncer**), allowing a high volume of concurrent database connections during critical times (like exam weeks).
*   **Edge Functions**: PDF generation, layout building, and API routing run at distributed edge locations globally close to the user, ensuring fast compile times and 100% server uptime.
*   **Storage Optimization**: Secure, signed temporary URLs prevent unauthorized hot-linking of documents and save database storage by keeping the binary files safely inside isolated storage nodes.
