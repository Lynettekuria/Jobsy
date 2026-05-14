import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data store for this demo. In a real app, use Firestore.
  let profile = {
    name: "Lynette Kuria",
    title: "Virtual Assistant & Digital Marketer",
    location: "Nairobi, Kenya",
    email: "wamuyukuria@gmail.com",
    phone: "+254797886117",
    linkedin: "linkedin.com/in/lynette-kuria",
    portfolio: "lynettekuriava.my.canva.site/lynette",
    cvHighlights: "3+ years remote VA · ALX Africa Certified · Google Workspace · Slack · Zoom · Canva · CRM · Instagram / Facebook / TikTok · Calendar & Inbox Management · Analytics Reporting · BSc Hospitality, Strathmore University"
  };

  let preferences = {
    roles: ["Virtual Assistant", "Remote VA", "Digital Marketing Assistant", "Transaction Coordinator", "Truck Dispatcher"],
    location: "Remote, Nairobi",
    salary: "$600+/mo or KES 60,000+/mo",
    type: "Full-time, Part-time, Contract"
  };

  let applications: any[] = [];

  // API routes
  app.get("/api/profile", (req, res) => {
    res.json(profile);
  });

  app.post("/api/profile", (req, res) => {
    profile = { ...profile, ...req.body };
    res.json(profile);
  });

  app.get("/api/preferences", (req, res) => {
    res.json(preferences);
  });

  app.post("/api/preferences", (req, res) => {
    preferences = { ...preferences, ...req.body };
    res.json(preferences);
  });

  app.get("/api/applications", (req, res) => {
    res.json(applications);
  });

  app.post("/api/applications", (req, res) => {
    const newApp = { 
      id: Date.now(), 
      date: new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
      ...req.body 
    };
    applications.push(newApp);
    res.json(newApp);
  });

  app.patch("/api/applications/:id", (req, res) => {
    const { id } = req.params;
    const index = applications.findIndex(a => a.id === parseInt(id));
    if (index !== -1) {
      applications[index] = { ...applications[index], ...req.body };
      res.json(applications[index]);
    } else {
      res.status(404).json({ error: "Application not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
