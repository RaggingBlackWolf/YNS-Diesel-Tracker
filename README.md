# YNS-Diesel-Tracker
Fuel tracking system for YNS Global Trucking
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, LogOut, FileText, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

// Company Logo
const COMPANY_LOGO = "/mnt/data/logo.png";

// Admin Credentials (Change These)
const ADMIN_USER = "admin";
const ADMIN_PASS = "yns123";

// Alert Threshold (L/100km)
const MAX_CONSUMPTION = 40;

const trucks = [
  "MG54WRGP",
  "MG54NBGP",
  "JGF718MP",
  "JPG018MP",
  "JM24XRGP",
  "JR79HMGP",
  "JN84VZGP",
];

const drivers = [
  "Bhekithemba Themba Ncube",
  "Sibusiso Celimpilo Mahlambi",
  "Sakhile Adonacious Mdakane",
  "Nhlalo Shange",
  "Samuel Zwelibanzi Nhlabathi",
  "Thapelo Mbetse",
  "Xolani A Mthethwa",
];

export default function DieselTrackerApp() {
  const today = new Date().toISOString().split("T")[0];

  /* ---------------- LOGIN STATE ---------------- */
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState("user");
  const [login, setLogin] = useState({ user: "", pass: "" });
  const [error, setError] = useState("");

  /* ---------------- APP STATE ---------------- */
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState("");
  const [alerts, setAlerts] = useState([]);

  const [form, setForm] = useState({
    truck: "",
    driver: "",
    odometer: "",
    litres: "",
    supplier: "",
    date: today,
    cost: "",
  });

  /* ---------------- LOGIN ---------------- */

  const handleLogin = () => {
    if (role === "admin") {
      if (login.user === ADMIN_USER && login.pass === ADMIN_PASS) {
        setLoggedIn(true);
        setError("");
      } else {
        setError("Invalid admin login");
      }
    } else {
      if (login.user.trim() !== "") {
        setLoggedIn(true);
        setError("");
      } else {
        setError("Enter your name");
      }
    }
  };

  const logout = () => {
    setLoggedIn(false);
    setLogin({ user: "", pass: "" });
    setRole("user");
  };

  /* ---------------- FORM ---------------- */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addOrder = () => {
    if (!form.truck || !form.driver || !form.litres || !form.odometer) return;

    const newOrders = [...orders, { id: Date.now(), ...form }];
    setOrders(newOrders);

    checkForAlerts(newOrders);

    setForm({
      truck: "",
      driver: "",
      odometer: "",
      litres: "",
      supplier: "",
      date: today,
      cost: "",
    });
  };

  const deleteOrder = (id) => {
    if (role !== "admin") return;
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    checkForAlerts(updated);
  };

  /* ---------------- ALERT SYSTEM ---------------- */

  const checkForAlerts = (data) => {
    const byTruck = {};

    data
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((o) => {
        if (!byTruck[o.truck]) byTruck[o.truck] = [];
        byTruck[o.truck].push(o);
      });

    const warnings = [];

    Object.keys(byTruck).forEach((truck) => {
      const entries = byTruck[truck];

      for (let i = 1; i < entries.length; i++) {
        const prev = entries[i - 1];
        const curr = entries[i];

        const km = curr.odometer - prev.odometer;
        const litres = curr.litres;

        if (km > 0) {
          const per100 = (litres / km) * 100;

          if (per100 > MAX_CONSUMPTION) {
            warnings.push({
              truck,
              from: prev.date,
              to: curr.date,
              value: per100.toFixed(2),
            });
          }
        }
      }
    });

    setAlerts(warnings);
  };

  /* ---------------- REPORTS ---------------- */

  const generateWeeklyReport = () => {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const weekly = orders.filter((o) =>
      new Date(o.date) >= weekAgo
    );

    buildReport(weekly, "Weekly");
  };

  const generateMonthlyReport = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthly = orders.filter((o) => {
      const d = new Date(o.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    buildReport(monthly, "Monthly");
  };

  const calculateConsumption = (data) => {
    const byTruck = {};

    data
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((o) => {
        if (!byTruck[o.truck]) byTruck[o.truck] = [];
        byTruck[o.truck].push(o);
      });

    let result = "";

    Object.keys(byTruck).forEach((truck) => {
      const entries = byTruck[truck];

      for (let i = 1; i < entries.length; i++) {
        const prev = entries[i - 1];
        const curr = entries[i];

        const km = curr.odometer - prev.odometer;
        const litres = curr.litres;

        if (km > 0) {
          const per100 = ((litres / km) * 100).toFixed(2);

          result += `\n${truck} | ${prev.date} → ${curr.date}`;
          result += `\nDistance: ${km} km`;
          result += `\nFuel Used: ${litres} L`;
          result += `\nConsumption: ${per100} L/100km\n`;
        }
      }
    });

    return result;
  };

  const buildReport = (data, type) => {
    if (data.length === 0) {
      setReport(`No ${type.toLowerCase()} data available`);
      return;
    }

    const totalLitres = data.reduce(
      (s, o) => s + Number(o.litres || 0),
      0
    );

    const totalCost = data.reduce(
      (s, o) => s + Number(o.cost || 0),
      0
    );

    const perTruck = {};

    data.forEach((o) => {
      if (!perTruck[o.truck]) perTruck[o.truck] = 0;
      perTruck[o.truck] += Number(o.litres);
    });

    let text = `${type} Fuel Report\n\n`;
    text += `Total Litres: ${totalLitres} L\n`;
    text += `Total Cost: R ${totalCost.toFixed(2)}\n\n`;

    text += `Per Truck Usage:\n`;

    Object.keys(perTruck).forEach((t) => {
      text += `- ${t}: ${perTruck[t]} L\n`;
    });

    text += `\nFuel Consumption (Between Fill-Ups):\n`;
    text += calculateConsumption(data);

    setReport(text);
  };

  const totalLitres = orders.reduce(
    (sum, o) => sum + Number(o.litres || 0),
    0
  );

  const totalCost = orders.reduce(
    (sum, o) => sum + Number(o.cost || 0),
    0
  );

  /* ---------------- LOGIN SCREEN ---------------- */

  if (!loggedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-100"
        style={{
          backgroundImage: `url(${COMPANY_LOGO})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "300px",
        }}
      >
        <div className="absolute inset-0 bg-white/90"></div>

        <Card className="relative z-10 w-full max-w-md shadow-xl rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-center">
              YNS Diesel System Login
            </h2>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="user">Driver / User</option>
              <option value="admin">Admin</option>
            </select>

            <Input
              placeholder={role === "admin" ? "Admin Username" : "Your Name"}
              value={login.user}
              onChange={(e) =>
                setLogin({ ...login, user: e.target.value })
              }
            />

            {role === "admin" && (
              <Input
                type="password"
                placeholder="Admin Password"
                value={login.pass}
                onChange={(e) =>
                  setLogin({ ...login, pass: e.target.value })
                }
              />
            )}

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------- MAIN APP ---------------- */

  return (
    <div className="min-h-screen bg-gray-100 p-6 relative">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${COMPANY_LOGO})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "400px",
          backgroundAttachment: "fixed",
        }}
      ></div>

      <div className="absolute inset-0 bg-white/90"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🚛 Diesel Orders Tracker</h1>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>

        {/* ALERTS */}
        {role === "admin" && alerts.length > 0 && (
          <Card className="max-w-4xl mx-auto mb-6 border-red-500">
            <CardContent className="p-4 space-y-2 text-red-600">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle size={18} /> Fuel Alerts
              </h3>

              {alerts.map((a, i) => (
                <p key={i}>
                  🚨 {a.truck}: {a.value} L/100km ({a.from} → {a.to})
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Reports */}
        {role === "admin" && (
          <Card className="max-w-4xl mx-auto mb-6">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <FileText size={18} /> Reports
              </h3>

              <div className="flex gap-2">
                <Button onClick={generateWeeklyReport}>Weekly</Button>
                <Button onClick={generateMonthlyReport}>Monthly</Button>
              </div>

              {report && (
                <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                  {report}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="max-w-4xl mx-auto mb-6 shadow-lg rounded-2xl">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              name="truck"
              value={form.truck}
              onChange={handleChange}
              className="border rounded p-2"
            >
              <option value="">Select Truck</option>
              {trucks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              name="driver"
              value={form.driver}
              onChange={handleChange}
              className="border rounded p-2"
            >
              <option value="">Select Driver</option>
              {drivers.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <Input
              name="odometer"
              type="number"
              placeholder="Odometer (KM)"
              value={form.odometer}
              onChange={handleChange}
            />

            <Input
              name="litres"
              type="number"
              placeholder="Litres"
              value={form.litres}
              onChange={handleChange}
            />

            <Input
              name="supplier"
              placeholder="Supplier"
              value={form.supplier}
              onChange={handleChange}
            />

            <Input name="date" type="date" value={form.date} disabled />

            <Input
              name="cost"
              type="number"
              placeholder="Cost (R)"
              value={form.cost}
              onChange={handleChange}
            />

            <Button onClick={addOrder} className="md:col-span-3 mt-2">
              <Plus className="mr-2 h-4 w-4" /> Add Order
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-gray-500">Total Litres</p>
              <p className="text-2xl font-bold">{totalLitres} L</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold">R {totalCost.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="max-w-6xl mx-auto shadow-lg rounded-2xl">
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Truck</th>
                  <th className="p-2">Driver</th>
                  <th className="p-2">Odometer</th>
                  <th className="p-2">Litres</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Cost</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-gray-500 p-4">
                      No diesel orders yet
                    </td>
                  </tr>
                )}

                {orders.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{o.truck}</td>
                    <td className="p-2">{o.driver}</td>
                    <td className="p-2">{o.odometer}</td>
                    <td className="p-2">{o.litres}</td>
                    <td className="p-2">{o.supplier}</td>
                    <td className="p-2">{o.date}</td>
                    <td className="p-2">{o.cost}</td>
                    <td className="p-2">
                      {role === "admin" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteOrder(o.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
