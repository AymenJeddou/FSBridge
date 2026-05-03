# FSBridge - Mon Portail Étudiant 

**FSBridge** is a next-generation academic portal designed specifically to meet the needs of university students (with a focus on the Faculté des Sciences de Bizerte - FSB). More than just a tool for checking grades, FSBridge acts as a "bridge" between the student, the administration, and academic knowledge by integrating an advanced Artificial Intelligence layer.

##  Key Features

- **Intelligent Dashboard:** A centralized hub summarizing the student's academic situation, including automatic GPA calculation (20-point system), grade visualization by teaching unit (UE), and automatic honors calculation based on Tunisian grading scales.
- **AI Assistant (FSB Assistant):** An integrated AI powered by Google's Gemini to answer questions about schedules or classrooms, explain course concepts from imported documents, and analyze academic performance to suggest areas for improvement.
- **Document Management & Administration:** Automatic generation of PDF documents such as certificates of attendance, transcripts, and internship agreements.
- **Dynamic Timetable:** A clear, responsive weekly schedule view with quick identification of session types (Lectures, Tutorials, Practicals) and responsible professors.

##  Tech Stack

This project is built with a modern, cloud-native, and type-safe architecture:

- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (implementing the custom "Retrofly" brutalist design system)
- **Navigation:** [React Router](https://reactrouter.com/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL & Authentication)
- **AI Integration:** [Gemini AI](https://deepmind.google/technologies/gemini/) via Supabase Edge Functions
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)

##  Design System

The project utilizes a strong visual identity named **FSBridge Design System**:
- **Colors:** Predominantly Black and Yellow (Accent) for maximum readability and a premium "Brutalist/Retro" look.
- **Typography:** Grotesque fonts for a professional and modern aesthetic.
- **Interactivity:** Smooth animations to enhance user engagement without weighing down the application.

##  Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mon-portail-tudiant.git
   cd mon-portail-tudiant
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory.
   - Add your Supabase and Gemini API keys (you will need `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GEMINI_API_KEY` or equivalent backend keys).

4. Start the development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:8080` or `http://localhost:5173`).

## 🔮 Future Roadmap
- **Research Agent: an agent that pulls research articles related to students every 24hours (using Zapier)
- **Native Mobile App:** Development of a mobile application for real-time push notifications.
- **Professor Module:** Allow teachers to enter grades and communicate directly with their student groups.
- **Admin Module:** Allow Technical staff to create student account and manage all students.
- **Payment Integration:** Enable payment of registration fees or related services directly through the portal.

## 📝 License

This project is intended for the Faculté des Sciences de Bizerte (FSB).
